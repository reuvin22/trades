#!/usr/bin/env node
/**
 * Exercises the behavioural-leak prompt against a synthetic journal, so the
 * wiring can be checked without signing in or spending real trades.
 *
 *   npm run test:leak            a trader with a revenge-trading habit
 *   npm run test:leak -- clean   a disciplined trader (expects severity low)
 */
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { warnAboutKey, ERROR_HELP } from './_key-check.mjs'

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return values
}

const env = { ...loadEnv(), ...process.env }
const apiKey = env.OPENROUTER_API_KEY
if (!warnAboutKey(apiKey)) process.exit(1)

const esbuild = resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild',
)

async function load(file) {
  const bundled = execFileSync(
    esbuild,
    [file, '--bundle', '--format=esm', '--platform=node', '--external:firebase-admin*'],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  )
  return import(`data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`)
}

const { summarise } = await load('api/_trade-summary.ts')
const { generateLeak } = await load('api/_leak-prompt.ts')

const shape = process.argv[2] || 'revenge'
const models = env.OPENROUTER_MODEL
  ? env.OPENROUTER_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
  : undefined

/** Deterministic RNG so a run is reproducible and reviewable. */
function rng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * The app stores what an <input type="datetime-local"> produces: a local wall
 * clock with no zone. toISOString() would shift by the UTC offset and corrupt
 * every interval the summariser measures.
 */
function localStamp(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * "revenge": disciplined baseline, but after any loss the next entry comes
 * within minutes at double size and loses more often than it wins.
 * "clean": the same baseline with no post-loss distortion at all.
 */
function buildTrades(kind) {
  const random = rng(20260910)
  const trades = []
  const day = new Date('2026-08-03T00:00:00')

  for (let d = 0; d < 30; d++) {
    if (d % 7 === 5 || d % 7 === 6) continue // no weekend sessions

    let lastToday = null

    for (let n = 0; n < 3; n++) {
      const previous = lastToday
      const chasing = kind === 'revenge' && previous && previous.netPl < 0

      const entry = new Date(day)
      entry.setDate(entry.getDate() + d)
      entry.setHours(9 + n * 2, 30 + Math.floor(random() * 20))

      if (chasing) {
        entry.setTime(
          new Date(previous.exitAt).getTime() + (3 + Math.floor(random() * 2)) * 60000,
        )
      }

      const size = chasing ? 320 : 150
      const holdMinutes = chasing
        ? 12 + Math.floor(random() * 10)
        : 40 + Math.floor(random() * 60)
      const exit = new Date(entry.getTime() + holdMinutes * 60000)

      const won = chasing ? random() < 0.22 : random() < 0.56
      const netPl = won
        ? Math.round((chasing ? 90 : 210) + random() * 120)
        : -Math.round((chasing ? 300 : 120) + random() * 90)

      const trade = {
        ticker: ['NVDA', 'SPY', 'TSLA', 'AAPL'][Math.floor(random() * 4)],
        direction: random() < 0.6 ? 'Long' : 'Short',
        size,
        entryPrice: 100,
        exitPrice: 100 + netPl / size,
        entryAt: localStamp(entry),
        exitAt: localStamp(exit),
        setup: chasing
          ? 'Unplanned'
          : ['VWAP Reclaim', 'Breakout', 'Mean Reversion'][Math.floor(random() * 3)],
        netPl,
        riskReward: chasing ? 0.7 : 2.1,
        compliedEntry: chasing ? 'no' : 'yes',
        compliedExit: chasing ? 'no' : 'yes',
        compliedManagement: chasing ? 'no' : 'yes',
        emotionBefore: chasing ? 'Frustrated' : 'Calm',
        emotionDuring: chasing ? 'Frustrated' : 'Focused',
        mistakes: chasing ? ['Revenge trade', 'Oversized'] : [],
        createdAt: { toDate: () => entry },
      }

      trades.push(trade)
      lastToday = trade
    }
  }

  return trades
}

const summary = summarise(buildTrades(shape))

console.log(`\n  shape          ${shape}`)
console.log(`  trades         ${summary.tradeCount} (${summary.closedCount} closed)`)
console.log(`  net P&L        ${summary.netPl}`)
console.log(`  win rate       ${summary.winRate}%`)
console.log(
  `  after a loss   ${summary.afterLoss.count} trades, net ${summary.afterLoss.netPl}, ` +
    `win rate ${summary.afterLoss.winRate}%`,
)
console.log(
  `  same-session   ${summary.afterLoss.sameSessionCount} re-entries, ` +
    `median ${summary.afterLoss.medianMinutesToReentry} min`,
)
console.log(`  size change    ${summary.afterLoss.avgSizeChangePct}%`)

const started = Date.now()

let outcome
try {
  outcome = await generateLeak(summary, apiKey, models)
} catch (error) {
  console.log()
  console.log(`  ${error.message} (${error.status ?? '?'})`)
  if (error.detail) {
    console.log(`  ${String(error.detail).replace(/\s+/g, ' ').slice(0, 200)}`)
  }
  const help = ERROR_HELP[error.status]
  if (help) console.log(`  ${help}`)
  console.log()
  process.exit(1)
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1)
const { result, model } = outcome

console.log(`\n  --- answered in ${elapsed}s by ${model} ---\n`)
console.log(`  title           ${result.title}`)
console.log(`  severity        ${result.severity}`)
console.log(`  costLabel       ${result.costLabel}`)
console.log(`\n  finding\n    ${result.finding}`)
console.log(`\n  recommendation\n    ${result.recommendation}\n`)
