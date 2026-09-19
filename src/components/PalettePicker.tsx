import type { MouseEvent } from 'react'
import { PALETTES, type Palette, type PaletteInfo } from '../data/palettes'
import type { Origin, Theme } from '../lib/useTheme'
import { CheckIcon } from './Icons'
import {
  PICK_BLURB,
  PICK_BODY,
  PICK_CARD,
  PICK_CHECK,
  PICK_DONE,
  PICK_FOOT,
  PICK_FOOT_LABEL,
  PICK_GRID,
  PICK_KICKER,
  PICK_NAME,
  PICK_PREVIEW,
  PICK_PREVIEW_DOT,
  PICK_PREVIEW_LINE,
  PICK_PREVIEW_PANEL,
  PICK_TILE,
  PICK_TILE_ON,
  PICK_TITLE,
  PICK_VEIL,
  SEGMENT,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENTED,
} from './ui'

/** The centre of whatever was clicked, so the sweep starts from it. */
function originOf(event: MouseEvent<HTMLElement>): Origin {
  const box = event.currentTarget.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/**
 * One palette, drawn as a miniature of the app.
 *
 * Painted with inline styles from the palette's own hex values, which is the
 * one place in this project that is right to do. Every tile has to show its
 * own palette at the same time, and a token resolves to whichever palette is
 * currently applied — so six tiles built from tokens would be six identical
 * tiles.
 */
function Tile({
  info,
  theme,
  selected,
  onPick,
}: {
  info: PaletteInfo
  theme: Theme
  selected: boolean
  onPick: (id: Palette, origin: Origin) => void
}) {
  const [bg, panel, accent] = theme === 'light' ? info.swatchLight : info.swatch

  return (
    <button
      type="button"
      className={`${PICK_TILE} ${selected ? PICK_TILE_ON : ''}`}
      aria-pressed={selected}
      onClick={(event) => onPick(info.id, originOf(event))}
    >
      <span className={PICK_PREVIEW} style={{ background: bg }}>
        <span className={PICK_PREVIEW_LINE} style={{ background: accent }} />
        <span className={PICK_PREVIEW_DOT} style={{ background: accent }} />
        <span className={PICK_PREVIEW_PANEL} style={{ background: panel }} />
      </span>

      {selected && (
        <span className={PICK_CHECK}>
          <CheckIcon size={12} />
        </span>
      )}

      <span>
        <span className={`block ${PICK_NAME}`}>{info.name}</span>
        <span className={`block ${PICK_BLURB}`}>{info.blurb}</span>
      </span>
    </button>
  )
}

/** The grid on its own, so Settings can show it without the dialog around it. */
export function PaletteGrid({
  palette,
  theme,
  onPick,
}: {
  palette: Palette
  theme: Theme
  onPick: (id: Palette, origin: Origin) => void
}) {
  return (
    <div className={PICK_GRID}>
      {PALETTES.map((info) => (
        <Tile
          key={info.id}
          info={info}
          theme={theme}
          selected={info.id === palette}
          onPick={onPick}
        />
      ))}
    </div>
  )
}

/**
 * The one-time chooser a new account sees before the tour.
 *
 * There is no cancel and no "skip": every tile is a valid answer and one is
 * already selected, so the only button is the one that closes it. A dismissal
 * that left no choice recorded would only mean asking again next load.
 *
 * Every pick applies immediately to the whole app rather than on confirm —
 * the veil is translucent for exactly this reason. Choosing a palette from a
 * swatch is guesswork; choosing it by watching your own dashboard change is
 * not.
 */
export function PalettePicker({
  palette,
  theme,
  onPick,
  onToggleTheme,
  onDone,
}: {
  palette: Palette
  theme: Theme
  onPick: (id: Palette, origin: Origin) => void
  onToggleTheme: (origin?: Origin) => void
  onDone: () => void
}) {
  return (
    <div className={PICK_VEIL} role="dialog" aria-modal="true" aria-label="Choose a theme">
      <div className={PICK_CARD}>
        <div>
          <p className={PICK_KICKER}>First things first</p>
          <h2 className={PICK_TITLE}>Pick how RagDex looks</h2>
          <p className={PICK_BODY}>
            Six palettes, each in light and dark. Tap one and the whole app changes
            behind this card. Nothing here is permanent — you can switch again
            whenever you like, from Settings.
          </p>
        </div>

        <PaletteGrid palette={palette} theme={theme} onPick={onPick} />

        <div className={PICK_FOOT}>
          <div className="flex items-center gap-12">
            <span className={PICK_FOOT_LABEL}>Mode</span>
            <div className={SEGMENTED}>
              {(['dark', 'light'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${SEGMENT} ${
                    theme === mode ? SEGMENT_ACTIVE : SEGMENT_IDLE
                  }`}
                  aria-pressed={theme === mode}
                  onClick={(event) => {
                    if (theme === mode) return
                    onToggleTheme(originOf(event))
                  }}
                >
                  {mode === 'dark' ? 'Dark' : 'Light'}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={PICK_DONE} onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
