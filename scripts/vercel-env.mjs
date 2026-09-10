#!/usr/bin/env node
/**
 * Turns .env.local into Vercel CLI commands, so environment variables can be
 * set without fighting the dashboard form.
 *
 *   npm run vercel:env              print the commands to run
 *   npm run vercel:env -- --apply   run them (removes any existing value first)
 *   npm run vercel:env -- --apply --env production
 *
 * Removing before adding matters: Vercel will not let you change a variable's
 * type (Secret vs Config) in place, and re-adding an existing name is what the
 * dashboard rejects with a red key field.
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const ENVIRONMENTS = ['production', 'preview', 'development']

/** Everything unprefixed is server-side and must stay a Secret. */
function isPublic(name) {
  return name.startsWith('VITE_')
}

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) {
    console.error('\n  .env.local not found. Run npm run setup:firebase first.\n')
    process.exit(1)
  }

  const values = []
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const name = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (value !== '') values.push([name, value])
  }
  return values
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const only = args.includes('--env') ? [args[args.indexOf('--env') + 1]] : ENVIRONMENTS

const vars = loadEnv()
const publicVars = vars.filter(([name]) => isPublic(name))
const secretVars = vars.filter(([name]) => !isPublic(name))

console.log(`\n  ${publicVars.length} public (Config) · ${secretVars.length} server-only (Secret)`)
console.log(`  environments: ${only.join(', ')}\n`)

for (const [name] of secretVars) {
  if (name.startsWith('VITE_')) {
    console.error(`  Refusing: ${name} is a secret with a VITE_ prefix.`)
    process.exit(1)
  }
}

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  return result
}

if (!apply) {
  console.log('  Run these, or re-run with --apply:\n')
  for (const [name, value] of vars) {
    for (const environment of only) {
      const preview = isPublic(name)
        ? value
        : `<${name.toLowerCase()} from .env.local>`
      console.log(`    vercel env rm ${name} ${environment} -y  2>NUL`)
      console.log(`    echo ${preview}| vercel env add ${name} ${environment}`)
    }
  }
  console.log(
    '\n  Tip: the dashboard shows a red key field when the name already exists.\n' +
      '  Delete the existing variable first, or edit it in place instead of adding.\n',
  )
  process.exit(0)
}

const probe = run('vercel', ['--version'])
if (probe.status !== 0) {
  console.error('  Vercel CLI not found. Install it with:  npm i -g vercel\n')
  process.exit(1)
}

let failures = 0
for (const [name, value] of vars) {
  for (const environment of only) {
    // Ignore the result: a missing variable is the normal case.
    run('vercel', ['env', 'rm', name, environment, '-y'])

    const added = run('vercel', ['env', 'add', name, environment], value)
    const ok = added.status === 0

    if (!ok) failures++
    const label = isPublic(name) ? 'config' : 'secret'
    console.log(`    ${ok ? '✓' : '✗'} ${name} · ${environment} · ${label}`)
    if (!ok) console.log(`        ${(added.stderr || '').trim().split('\n')[0]}`)
  }
}

console.log(
  failures === 0
    ? '\n  All set. Redeploy for the new values to take effect.\n'
    : `\n  ${failures} failed. Check you are linked to the right project (vercel link).\n`,
)
process.exit(failures === 0 ? 0 : 1)
