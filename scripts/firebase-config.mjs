#!/usr/bin/env node
/**
 * Turns the firebaseConfig object from the Firebase console into .env.local.
 *
 *   npm run setup:firebase -- path/to/config.txt
 *   npm run setup:firebase            (then paste, and press Ctrl+Z / Ctrl+D)
 *
 * Accepts strict JSON or the JS object literal the console shows.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_PATH = resolve(process.cwd(), '.env.local')

const FIELDS = [
  ['apiKey', 'VITE_FIREBASE_API_KEY', true],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN', true],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID', true],
  ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET', false],
  ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID', false],
  ['appId', 'VITE_FIREBASE_APP_ID', true],
  ['measurementId', 'VITE_FIREBASE_MEASUREMENT_ID', false],
]

function readInput() {
  const [, , file] = process.argv
  if (file) {
    if (!existsSync(file)) {
      fail(`No such file: ${file}`)
    }
    return readFileSync(file, 'utf8')
  }

  if (process.stdin.isTTY) {
    console.log('Paste the firebaseConfig block, then press Ctrl+Z and Enter (Windows):\n')
  }
  return readFileSync(0, 'utf8')
}

function fail(message) {
  console.error(`\n  ✖ ${message}\n`)
  process.exit(1)
}

/** Pulls key: "value" pairs without eval, so a JS literal works as well as JSON. */
function parseConfig(text) {
  const found = {}
  const pattern = /["']?([A-Za-z_][A-Za-z0-9_]*)["']?\s*:\s*["']([^"']*)["']/g

  let match
  while ((match = pattern.exec(text)) !== null) {
    found[match[1]] = match[2]
  }

  return found
}

const raw = readInput().trim()
if (raw === '') fail('Nothing to read. Pass a file path or paste the config.')

const parsed = parseConfig(raw)

if (parsed.type === 'service_account' || 'private_key' in parsed || raw.includes('BEGIN PRIVATE KEY')) {
  fail(
    'That is a SERVICE ACCOUNT key, not a web app config.\n' +
      '    It is an admin credential and must never go in a browser bundle.\n\n' +
      '    You need the web config instead:\n' +
      '      https://console.firebase.google.com/project/trading-journal-43d07/settings/general\n' +
      '      -> Your apps -> Web app (</>) -> SDK setup and configuration -> Config',
  )
}

const missing = FIELDS.filter(([key, , required]) => required && !parsed[key]).map(
  ([key]) => key,
)

if (missing.length > 0) {
  fail(
    `Could not find these in what you pasted: ${missing.join(', ')}\n` +
      '    Paste the whole firebaseConfig = { ... } block, braces included.',
  )
}

// Keep any unrelated variables that already live in .env.local.
const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8').split(/\r?\n/) : []
const managed = new Set(FIELDS.map(([, envName]) => envName))
const preserved = existing.filter((line) => {
  const name = line.split('=')[0].trim()
  return line.trim() !== '' && !line.startsWith('#') && !managed.has(name)
})

const lines = [
  '# Firebase WEB app config — written by npm run setup:firebase.',
  '# Public by design; Firestore is protected by security rules, not by secrecy.',
  '',
  ...FIELDS.map(([key, envName]) => `${envName}=${parsed[key] ?? ''}`),
  ...preserved,
  '',
]

writeFileSync(ENV_PATH, lines.join('\n'), 'utf8')

console.log('\n  ✔ Wrote .env.local for project', parsed.projectId)
for (const [key, envName] of FIELDS) {
  const value = parsed[key]
  const shown = value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '(not provided)'
  console.log(`      ${envName.padEnd(35)} ${shown}`)
}
console.log('\n  Restart the dev server — Vite only reads env files at startup.\n')
