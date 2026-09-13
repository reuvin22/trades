/**
 * Draws the picture that appears when someone pastes a RagDex link anywhere.
 *
 * This is the highest-leverage image on the site and the easiest to forget.
 * A link with no card is a bare blue line in a Slack channel; a link with one
 * takes up twelve times the space and says what it is. It changes click-through
 * far more than any tag you can add to the head.
 *
 * 1200×630 is the size every network agrees on — X, Slack, LinkedIn, Discord,
 * iMessage, Facebook. Anything else gets cropped by someone.
 *
 * Generated from an SVG rather than exported from a design tool so it stays in
 * step with the theme: the colours below are the ones in src/index.css. Run
 * `npm run seo:image` after changing them.
 *
 * Text is drawn as SVG `<text>`, which renders with whatever font the machine
 * building has. That is fine for a solid, typographic card and avoids shipping
 * a font file; if you later want an exact typeface, embed it as a data URI.
 */

import { statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { BRAND } from './site.config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public', 'og-image.png')

const WIDTH = 1200
const HEIGHT = 630

/* Straight from src/index.css, so the card matches the app it advertises. */
const BG = '#06050f'
const PANEL = '#0d0b1c'
const ACCENT = '#7c6cf6'
const ACCENT_SOFT = '#8f83ff'
const FG = '#ffffff'
const FG_DIM = '#a9a7c4'
const GREEN = '#34d399'

/** The tagline, wrapped by hand — SVG text does not wrap on its own. */
const LINES = ['Know your trades.', 'Grow your edge.']

/**
 * A rising equity curve, because it is the one picture that says "trading
 * journal" without a word. Drawn as a path over a soft fill.
 */
const CURVE = 'M 0 190 L 90 150 L 180 168 L 270 104 L 360 126 L 450 62 L 540 78 L 620 26'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="60%" stop-color="${PANEL}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>

    <linearGradient id="line" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="100%" stop-color="${GREEN}"/>
    </linearGradient>

    <radialGradient id="glow" cx="0.78" cy="0.22" r="0.62">
      <stop offset="0%" stop-color="${ACCENT_SOFT}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${ACCENT_SOFT}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  <!-- A hairline border, so the card has an edge on a white background. -->
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" fill="none"
        stroke="${ACCENT}" stroke-opacity="0.22" stroke-width="1"/>

  <!-- Wordmark -->
  <g transform="translate(84 92)">
    <rect x="0" y="0" width="44" height="44" rx="13" fill="${ACCENT}"/>
    <path d="M 12 30 L 20 20 L 26 25 L 34 13" fill="none" stroke="${FG}"
          stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="62" y="32" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"
          font-size="30" font-weight="700" fill="${FG}" letter-spacing="-0.4">${BRAND}</text>
  </g>

  <!-- The promise -->
  <g font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">
    <text x="84" y="286" font-size="74" font-weight="700" fill="${FG}" letter-spacing="-2.2">${LINES[0]}</text>
    <text x="84" y="372" font-size="74" font-weight="700" fill="${ACCENT_SOFT}" letter-spacing="-2.2">${LINES[1]}</text>

    <text x="84" y="438" font-size="25" fill="${FG_DIM}">A trading journal that reads your habits, not just your fills.</text>
  </g>

  <!-- The curve, bottom right, clear of the text -->
  <g transform="translate(500 330)" opacity="0.95">
    <path d="${CURVE}" fill="none" stroke="url(#line)" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="620" cy="26" r="9" fill="${GREEN}"/>
    <circle cx="620" cy="26" r="17" fill="${GREEN}" opacity="0.25"/>
  </g>

  <!-- What it does, as three plain claims -->
  <g font-family="Segoe UI, Helvetica Neue, Arial, sans-serif" font-size="21" fill="${FG_DIM}">
    <text x="84" y="546">Journal</text>
    <text x="212" y="546" fill="${ACCENT}">•</text>
    <text x="238" y="546">Analytics</text>
    <text x="372" y="546" fill="${ACCENT}">•</text>
    <text x="398" y="546">AI coach</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out)

const bytes = statSync(out).size
console.log(
  `  [32m✓[39m seo — og-image.png written, ${WIDTH}×${HEIGHT}, ${Math.round(bytes / 1024)}KB`,
)

