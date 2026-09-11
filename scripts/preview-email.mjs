#!/usr/bin/env node
/**
 * Renders the verification email to email-preview.html so it can be opened in
 * a browser without sending anything.  npm run preview:email
 */
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'email-preview.html')

// The template is TypeScript, so transpile it through esbuild first. Call the
// binary directly — spawning npx needs a shell on Windows.
const esbuild = resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild',
)

const bundled = execFileSync(
  esbuild,
  ['api/_email-template.ts', '--bundle', '--format=esm', '--platform=node'],
  { encoding: 'utf8', shell: process.platform === 'win32' },
)

const module = await import(
  `data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`
)

writeFileSync(
  OUT,
  module.verificationHtml({
    link: 'https://trading-journal-43d07.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=EXAMPLE',
    name: 'Reuvin Hernandez',
    gifUrl: '/email/verify.gif',
    brand: 'RadEx',
  }),
  'utf8',
)

console.log('\n  Wrote', OUT)
console.log('  Open it from the dev server so the GIF resolves:')
console.log('    npm run dev   ->   http://localhost:5173/../email-preview.html')
console.log('\n  Plain-text part:\n')
console.log(
  module
    .verificationText({ link: 'https://…/verify?oobCode=EXAMPLE', name: 'Reuvin Hernandez', brand: 'RadEx' })
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n'),
)
