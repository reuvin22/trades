/**
 * Checks the built site for the mistakes that quietly cost rankings.
 *
 * Run after `vite build`, against `dist/` — the real HTML that ships, not the
 * source template. That distinction matters: the source can look right and the
 * build can still drop a tag, and the crawler only ever sees the build.
 *
 * Two severities, on purpose:
 *
 *   ERROR    the page is broken for search or social. Fails the build.
 *   WARN     worth fixing, not worth blocking a deploy over.
 *
 * A checker that fails on everything gets disabled within a week, and then it
 * checks nothing at all. Only the things that genuinely break get to stop you.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absolute, SITE_URL } from './site.config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')

const errors = []
const warnings = []

const fail = (what, fix) => errors.push({ what, fix })
const warn = (what, fix) => warnings.push({ what, fix })

if (!existsSync(join(dist, 'index.html'))) {
  console.error('  seo — no dist/index.html. Run `npm run build` first.')
  process.exit(1)
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')

/** The content of a `<meta name="x">` or `<meta property="x">`, or null. */
function meta(name) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
    'i',
  )
  const alternate = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    'i',
  )
  return (html.match(pattern) ?? html.match(alternate))?.[1] ?? null
}

/* ------------------------------------------------------------- the title */

const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? ''

if (title === '') {
  fail('No <title>.', 'It is the blue line in every search result. Nothing matters more.')
} else if (title.length > 60) {
  warn(
    `Title is ${title.length} characters.`,
    'Google truncates around 60. Put the important words first.',
  )
} else if (title.length < 20) {
  warn(`Title is only ${title.length} characters.`, 'There is room to say more.')
}

/* ------------------------------------------------------- the description */

const description = meta('description')

if (!description) {
  fail(
    'No meta description.',
    'Google writes its own from the page, and it is rarely the sentence you would have chosen.',
  )
} else if (description.length > 160) {
  warn(
    `Description is ${description.length} characters.`,
    'It gets cut around 160. The tail is wasted.',
  )
} else if (description.length < 70) {
  warn(`Description is only ${description.length} characters.`, 'Half the space is unused.')
}

/* --------------------------------------------------------- the canonical */

const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)?.[1]

if (!canonical) {
  fail(
    'No canonical link.',
    'It names the one real address of this page. Without it the same content on two URLs competes with itself.',
  )
} else if (!canonical.startsWith('http')) {
  fail(`Canonical is relative: ${canonical}`, 'It must be absolute, including https://.')
} else if (!canonical.startsWith(SITE_URL)) {
  fail(
    `Canonical points at ${canonical}, but SITE_URL is ${SITE_URL}.`,
    'One of the two is wrong. A canonical pointing elsewhere hands your ranking away.',
  )
}

/* --------------------------------------------------------------- sharing */

const shareTags = {
  'og:title': 'the headline when the link is pasted anywhere',
  'og:description': 'the sentence under it',
  'og:image': 'the picture — a link without one is a grey box',
  'og:url': 'which address the card points at',
  'og:type': 'what kind of thing this is',
}

for (const [tag, why] of Object.entries(shareTags)) {
  if (!meta(tag)) fail(`No ${tag}.`, `Open Graph: ${why}.`)
}

const image = meta('og:image')
if (image && !image.startsWith('http')) {
  fail(
    `og:image is relative: ${image}`,
    'Social networks fetch it from their own servers, where a relative path means nothing. Use an absolute URL.',
  )
}

if (image?.startsWith('http') && !existsSync(join(dist, new URL(image).pathname.slice(1)))) {
  fail(
    `og:image points at ${image}, which is not in the build.`,
    'Put the file in public/ so it ships.',
  )
}

if (!meta('twitter:card')) {
  warn('No twitter:card.', 'Without it X shows a small thumbnail instead of a wide one.')
}

/* ----------------------------------------------------- structured data */

const jsonLd = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]

if (jsonLd.length === 0) {
  warn(
    'No structured data.',
    'JSON-LD is how you state plainly what this is. It is what rich results are built from.',
  )
}

for (const [, body] of jsonLd) {
  try {
    const parsed = JSON.parse(body)
    if (!parsed['@context'] || !parsed['@type']) {
      fail('Structured data is missing @context or @type.', 'Both are required by schema.org.')
    }
  } catch {
    fail(
      'Structured data is not valid JSON.',
      'Google skips the whole block silently — it will not tell you.',
    )
  }
}

/* ---------------------------------------------------- accidental blocking */

const robotsMeta = meta('robots')
if (robotsMeta && /noindex/i.test(robotsMeta)) {
  fail(
    'The page says noindex.',
    'This removes it from Google entirely. Almost always a staging tag left behind.',
  )
}

/* ------------------------------------------------------ the two files */

for (const name of ['robots.txt', 'sitemap.xml']) {
  if (!existsSync(join(dist, name))) {
    fail(`No ${name} in the build.`, 'Run `npm run seo:generate`, then build again.')
  }
}

const robots = existsSync(join(dist, 'robots.txt'))
  ? readFileSync(join(dist, 'robots.txt'), 'utf8')
  : ''

if (robots && /^\s*Disallow:\s*\/\s*$/m.test(robots)) {
  fail(
    'robots.txt disallows the whole site.',
    'A bare "Disallow: /" blocks every crawler. This is the single most expensive typo in SEO.',
  )
}

if (robots && !robots.includes(absolute('/sitemap.xml'))) {
  warn('robots.txt does not name the sitemap.', 'It is the first place a crawler looks.')
}

/* ----------------------------------------------------------- the report */

const label = (text, colour) => `[${colour}m${text}[39m`

for (const { what, fix } of errors) {
  console.error(`  ${label('✗', 31)} ${what}`)
  console.error(`    ${fix}`)
}

for (const { what, fix } of warnings) {
  console.warn(`  ${label('!', 33)} ${what}`)
  console.warn(`    ${fix}`)
}

if (errors.length === 0 && warnings.length === 0) {
  console.log(`  ${label('✓', 32)} seo — every check passed`)
} else if (errors.length === 0) {
  console.log(
    `  ${label('✓', 32)} seo — no errors, ${warnings.length} thing${
      warnings.length === 1 ? '' : 's'
    } worth a look`,
  )
}

process.exit(errors.length > 0 ? 1 : 0)
