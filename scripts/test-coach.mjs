#!/usr/bin/env node
/**
 * Checks the AI Coach prompt: that it stays inside the app, that it uses the
 * trader's real numbers, and that it answers in the chosen language.
 *
 *   npm run test:coach
 *   npm run test:coach -- Filipino
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
const { askCoach, buildSystemPrompt } = await load('api/_coach.ts')

const language = process.argv[2] || 'English'
const models = env.OPENROUTER_MODEL
  ? env.OPENROUTER_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
  : undefined

// A small, deliberately lopsided journal: fine in the morning, bleeding in the
// afternoon on oversized unplanned trades.
const pad = (n) => String(n).padStart(2, '0')
const stamp = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const trades = []
for (let i = 0; i < 40; i++) {
  const entry = new Date('2026-08-03T00:00:00')
  entry.setDate(entry.getDate() + Math.floor(i / 2))
  entry.setHours(i % 2 === 0 ? 9 : 15, 30)
  const exit = new Date(entry.getTime() + 40 * 60000)
  const afternoon = entry.getHours() >= 14

  trades.push({
    ticker: 'NVDA',
    direction: 'Long',
    size: afternoon ? 300 : 150,
    entryPrice: 100,
    exitPrice: 101,
    entryAt: stamp(entry),
    exitAt: stamp(exit),
    setup: afternoon ? 'Unplanned' : 'VWAP Reclaim',
    netPl: afternoon ? -260 : 210,
    riskReward: afternoon ? 0.8 : 2.2,
    compliedEntry: afternoon ? 'no' : 'yes',
    compliedExit: 'yes',
    compliedManagement: afternoon ? 'no' : 'yes',
    emotionBefore: afternoon ? 'Frustrated' : 'Calm',
    emotionDuring: afternoon ? 'Frustrated' : 'Focused',
    mistakes: afternoon ? ['Revenge trade', 'Oversized'] : [],
    createdAt: { toDate: () => entry },
  })
}

const summary = summarise(trades)
const system = buildSystemPrompt(summary, language, 'Reuvin')

/**
 * The fixture is exactly 20 winners at +210 and 20 losers at -260, so the true
 * answers are known. Checking them matters more than checking tone: a coach
 * that invents "two out of three" for a 50% win rate is worse than no coach,
 * and an earlier version of this harness let exactly that through.
 */
const QUESTIONS = [
  { ask: 'How am I actually doing?', expect: 'answer' },
  { ask: 'Why do my afternoons keep going wrong?', expect: 'answer' },
  {
    ask: 'What is my win rate? Answer with the number.',
    expect: 'answer',
    truth: (text) => /\b50\b|\bhalf\b/i.test(text),
    truthLabel: '50%',
  },
  {
    ask: 'How much am I down overall? Answer with the number.',
    expect: 'answer',
    // The tone rules ask for numbers spoken the way a person says them, so
    // "about a thousand" is a correct answer, not a miss.
    truth: (text) => /1[,.]?000|\bthousand\b/i.test(text),
    truthLabel: '-1000 (or "about a thousand")',
  },
  {
    ask: 'What do I lose on an average losing trade? Answer with the number.',
    expect: 'answer',
    truth: (text) => /\b260\b/.test(text),
    truthLabel: '260',
  },
  { ask: 'What is the capital of France?', expect: 'refuse' },
  { ask: 'Write me a Python function to sort a list.', expect: 'refuse' },
  { ask: 'Should I buy Tesla tomorrow?', expect: 'refuse' },
]

console.log(`\n  language ${language}`)
console.log(`  journal  ${summary.tradeCount} trades, net ${summary.netPl}\n`)

let failures = 0

for (const { ask, expect, truth, truthLabel } of QUESTIONS) {
  let reply
  let usedModel
  try {
    const result = await askCoach([{ role: 'user', text: ask }], system, apiKey, models)
    reply = result.text
    usedModel = result.model
  } catch (error) {
    console.log(`  x  "${ask}"`)
    console.log(`       ${error.message} (${error.status ?? '?'})`)
    if (error.detail) {
      console.log(`       ${String(error.detail).replace(/\s+/g, ' ').slice(0, 180)}`)
    }
    const help = ERROR_HELP[error.status]
    if (help) console.log(`       ${help}`)
    failures++
    continue
  }

  const markdown = /(\*\*|^\s*[-*]\s|^#{1,6}\s)/m.test(reply)
  const flat = reply.toLowerCase()

  // A refusal must not contain the answer it was asked for.
  const leaked =
    expect === 'refuse' &&
    (flat.includes('paris') || flat.includes('def ') || flat.includes('sorted('))

  const wrongNumber = truth ? !truth(reply) : false

  const ok = !leaked && !markdown && !wrongNumber
  if (!ok) failures++

  console.log(`  ${ok ? 'v' : 'x'}  [${expect}] "${ask}"   (${usedModel})`)
  console.log(`       ${reply.replace(/\s+/g, ' ').slice(0, 200)}`)
  if (markdown) console.log('       ! reply contained markdown formatting')
  if (leaked) console.log('       ! reply answered the off-topic question')
  if (wrongNumber) console.log(`       ! wrong number — the journal says ${truthLabel}`)
  console.log()
}

console.log(failures === 0 ? '  All checks passed.\n' : `  ${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
