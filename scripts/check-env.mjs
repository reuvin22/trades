#!/usr/bin/env node
/**
 * Guards the one mistake that actually leaks credentials: giving a secret a
 * VITE_ prefix, which inlines it into the client bundle.
 *
 *   node scripts/check-env.mjs         before a build — checks variable names
 *   node scripts/check-env.mjs --dist  after a build  — scans dist/ for values
 *
 * Both run automatically around `npm run build`, including on Vercel, where
 * process.env carries whatever is configured in the dashboard.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describeOpenRouterKey } from './_key-check.mjs'

const RED = '[31m'
const GREEN = '[32m'
const DIM = '[2m'
const OFF = '[0m'

/** Names that must never be exposed, whatever they are prefixed with. */
// Deliberately NOT matching a bare "API_KEY": VITE_FIREBASE_API_KEY is public
// by design, and flagging it would block every build.
const SECRET_NAME = /(SECRET|PRIVATE|PASSWORD|CREDENTIAL|SERVICE_ACCOUNT|BREVO|OPENROUTER|GEMINI|_TOKEN)/i

/** Value shapes that are unambiguously credentials. */
const SECRET_VALUE = [
  { pattern: /^xkeysib-/, what: 'a Brevo API key' },
  { pattern: /BEGIN [A-Z ]*PRIVATE KEY/, what: 'a private key' },
  { pattern: /"type"\s*:\s*"service_account"/, what: 'a service account' },
  { pattern: /^sk-or-/, what: 'an OpenRouter key' },
  { pattern: /^sk-/, what: 'an API secret key' },
  { pattern: /^ghp_|^github_pat_/, what: 'a GitHub token' },
]

function loadDotEnv() {
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

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

const env = { ...loadDotEnv(), ...process.env }
const problems = []

if (process.argv.includes('--dist')) {
  const dist = resolve(process.cwd(), 'dist')
  if (!existsSync(dist)) {
    console.log(`${DIM}  no dist/ to scan${OFF}`)
    process.exit(0)
  }

  // Any unprefixed variable is server-side by definition, so finding its value
  // in the client bundle means it escaped.
  const serverValues = Object.entries(env).filter(
    ([name, value]) =>
      !name.startsWith('VITE_') &&
      typeof value === 'string' &&
      value.length >= 16 &&
      (SECRET_NAME.test(name) || SECRET_VALUE.some((s) => s.pattern.test(value))),
  )

  const contents = walk(dist).map((file) => ({ file, text: readFileSync(file, 'latin1') }))

  for (const [name, value] of serverValues) {
    for (const { file, text } of contents) {
      if (text.includes(value)) {
        problems.push(`${name} appears in ${file.replace(process.cwd(), '.')}`)
      }
    }
  }

  if (problems.length === 0) {
    const checked = serverValues.length
    console.log(
      `${GREEN}  ✓${OFF} bundle clean — ${checked} server secret${checked === 1 ? '' : 's'} checked, none present in dist/`,
    )
  }
} else {
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('VITE_') || typeof value !== 'string' || value === '') continue

    if (SECRET_NAME.test(name)) {
      problems.push(`${name} is VITE_-prefixed but its name says it is a secret.`)
      continue
    }

    const shape = SECRET_VALUE.find((s) => s.pattern.test(value))
    if (shape) {
      problems.push(`${name} is VITE_-prefixed but its value looks like ${shape.what}.`)
    }
  }

  // A warning, not a failure: key formats change, and a deploy should not be
  // blocked by our guess about one.
  if (env.OPENROUTER_API_KEY) {
    const key = describeOpenRouterKey(env.OPENROUTER_API_KEY)
    if (!key.ok) console.warn(`${DIM}  ! OPENROUTER_API_KEY: ${key.note}${OFF}`)
  }

  if (problems.length === 0) {
    const exposed = Object.keys(env).filter((name) => name.startsWith('VITE_')).length
    console.log(
      `${GREEN}  ✓${OFF} ${exposed} VITE_ variable${exposed === 1 ? '' : 's'} will be public, none look like secrets`,
    )
  }
}

if (problems.length > 0) {
  console.error(`\n${RED}  Refusing to build — a secret would be published:${OFF}\n`)
  for (const problem of problems) console.error(`    • ${problem}`)
  console.error(
    `\n  Anything with a VITE_ prefix is compiled into the JavaScript every\n` +
      `  visitor downloads. Server secrets must have no prefix and be read\n` +
      `  from an api/ handler instead.\n`,
  )
  process.exit(1)
}
