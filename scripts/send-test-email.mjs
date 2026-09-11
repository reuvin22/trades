#!/usr/bin/env node
/**
 * Sends the real verification email through Brevo, with a dummy link, so the
 * template can be checked in an actual inbox.
 *
 *   npm run test:email                     -> sends to BREVO_SENDER_EMAIL
 *   npm run test:email -- you@example.com  -> sends somewhere else
 *   npm run test:email -- you@example.com https://your-app.vercel.app
 *
 * The second argument overrides the base URL the GIF is loaded from, which
 * matters because email clients cannot reach http://localhost.
 */
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

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

const apiKey = env.BREVO_API_KEY
const sender = env.BREVO_SENDER_EMAIL
const brand = env.BREVO_SENDER_NAME || 'RagDex'

if (!apiKey) {
  console.error('\n  BREVO_API_KEY is not set in .env.local\n')
  process.exit(1)
}
if (!sender) {
  console.error('\n  BREVO_SENDER_EMAIL is not set in .env.local\n')
  process.exit(1)
}

const [, , recipientArg, baseUrlArg] = process.argv
const recipient = recipientArg || sender
const baseUrl = (baseUrlArg || env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

const esbuild = resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild',
)

const bundled = execFileSync(
  esbuild,
  ['api/_email-template.ts', '--bundle', '--format=esm', '--platform=node'],
  { encoding: 'utf8', shell: process.platform === 'win32' },
)

const template = await import(
  `data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`
)

const link = `${baseUrl}/#/login?test=1`
const gifUrl = `${baseUrl}/email/verify.gif`

if (baseUrl.includes('localhost')) {
  console.warn(
    '\n  NOTE: the GIF points at localhost, which no mail client can reach.\n' +
      '  Everything else renders; pass a public URL as the second argument to\n' +
      '  see the animation:  npm run test:email -- you@mail.com https://your-app.vercel.app\n',
  )
}

const response = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'api-key': apiKey,
    'content-type': 'application/json',
    accept: 'application/json',
  },
  body: JSON.stringify({
    sender: { email: sender, name: brand },
    to: [{ email: recipient }],
    subject: `[TEST] Confirm your email to open your ${brand} journal`,
    htmlContent: template.verificationHtml({
      link,
      name: 'Reuvin Hernandez',
      brand,
      gifUrl,
    }),
    textContent: template.verificationText({ link, name: 'Reuvin Hernandez', brand }),
    tags: ['verification-test'],
  }),
})

const body = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error(`\n  Brevo rejected the send (${response.status})`)
  console.error(`  ${body.code ?? ''} ${body.message ?? ''}\n`)
  process.exit(1)
}

console.log('\n  Sent.')
console.log(`    from      ${brand} <${sender}>`)
console.log(`    to        ${recipient}`)
console.log(`    messageId ${body.messageId ?? '(none returned)'}`)
console.log(`    gif       ${gifUrl}\n`)
