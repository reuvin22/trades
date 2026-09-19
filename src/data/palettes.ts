/**
 * The palettes a trader can choose between, as the picker needs to describe
 * them.
 *
 * The token values themselves live in `index.css` under
 * `:root[data-palette='…']` — that file is the source of truth for what a
 * palette actually looks like, and nothing here is read at paint time. What
 * this file holds is the *copy*: a name, a sentence, and the three colours a
 * swatch needs to show.
 *
 * The swatches are duplicated hex values rather than a read of the live
 * custom properties, deliberately. Reading them back would mean mounting six
 * hidden elements, each with a different `data-palette`, purely to ask the
 * browser what colour they came out — and a preview that renders the palette
 * it is previewing has to fight the one the page is already using. Six
 * literal triplets are cheaper and cannot flicker. Keep them in step with
 * `index.css` by hand; they are only ever the swatch, so drift costs a
 * slightly wrong thumbnail, never a wrong theme.
 */

export const PALETTE_IDS = [
  'midnight',
  'violet',
  'azure',
  'ember',
  'graphite',
  'rose',
] as const

export type Palette = (typeof PALETTE_IDS)[number]

export const DEFAULT_PALETTE: Palette = 'midnight'

export type PaletteInfo = {
  id: Palette
  name: string
  /** One line, shown under the name in the picker. */
  blurb: string
  /** Deepest surface, panel surface, accent — in that order, dark half. */
  swatch: readonly [string, string, string]
  /** The same three from the light half, for the preview in light mode. */
  swatchLight: readonly [string, string, string]
}

export const PALETTES: readonly PaletteInfo[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    blurb: 'Deep navy and mint. The original RagDex look.',
    swatch: ['#080f19', '#152235', '#20c99a'],
    swatchLight: ['#e9eef1', '#ffffff', '#0e9b74'],
  },
  {
    id: 'violet',
    name: 'Violet',
    blurb: 'Warm graphite with a violet accent, so green and red mean money only.',
    swatch: ['#0c0b12', '#191725', '#7c6cf6'],
    swatchLight: ['#eeecf6', '#ffffff', '#6353e8'],
  },
  {
    id: 'azure',
    name: 'Azure',
    blurb: 'Colder, deeper navy with an electric blue.',
    swatch: ['#060b14', '#101a2a', '#3b9dff'],
    swatchLight: ['#e8eef7', '#ffffff', '#1668d6'],
  },
  {
    id: 'ember',
    name: 'Ember',
    blurb: 'Near-black and amber. Reads like a terminal.',
    swatch: ['#0a0a0a', '#161616', '#f5a524'],
    swatchLight: ['#f1ece3', '#ffffff', '#a35c00'],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    blurb: 'No colour at all, so your P&L is the only colour on screen.',
    swatch: ['#0b0b0c', '#171719', '#e6e6e8'],
    swatchLight: ['#ececed', '#ffffff', '#1f1f22'],
  },
  {
    id: 'rose',
    name: 'Rose',
    blurb: 'Plum and rose, with the loss colour pushed orange to keep them apart.',
    swatch: ['#110a10', '#1f1420', '#f472b6'],
    swatchLight: ['#f6e9f0', '#ffffff', '#be185d'],
  },
]

export function isPalette(value: unknown): value is Palette {
  return PALETTE_IDS.includes(value as Palette)
}

export function paletteInfo(id: Palette): PaletteInfo {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}
