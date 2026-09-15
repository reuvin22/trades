import { useEffect, useRef, useState } from 'react'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { DateRangeIcon } from './Icons'
import { RANGE_LABEL, rangeLabel, type Preset } from '../lib/dateWindow'
import { ACTION_MENU, ACTION_MENU_LEFT, PILL, PILL_IDLE } from './ui'
import { hasFeature } from '../lib/entitlements'

/**
 * The range control: a preset, or a span off the calendar.
 *
 * A menu rather than a segmented row of buttons, because it sits in a page
 * header beside other actions and four side-by-side buttons crowd the title
 * off a narrow screen.
 *
 * Which presets it offers is the caller's choice. The journal opens on a
 * window and wants the three spans; the dashboard is an all-time view by
 * default and needs a way back to it.
 */
export function RangeMenu({
  range,
  custom,
  presets,
  onPreset,
  onCustom,
}: {
  range: Preset
  custom: DateRange | null
  presets: Preset[]
  onPreset: (next: Preset) => void
  onCustom: (span: DateRange | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && !picking) return

    function onPointerDown(event: PointerEvent) {
      if (wrapper.current?.contains(event.target as Node)) return
      setOpen(false)
      setPicking(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, picking])

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className={`${PILL} ${PILL_IDLE}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          setPicking(false)
        }}
      >
        <DateRangeIcon />
        {rangeLabel(range, custom)}
      </button>

      {open && !picking && (
        <div className={`${ACTION_MENU} ${ACTION_MENU_LEFT}`} role="menu">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              role="menuitem"
              // A preset is only the current view when no custom span is set.
              aria-current={custom === null && range === preset ? 'true' : undefined}
              onClick={() => {
                onPreset(preset)
                setOpen(false)
              }}
            >
              {RANGE_LABEL[preset]}
            </button>
          ))}
          {hasFeature('customRange') && (
            <button type="button" role="menuitem" onClick={() => setPicking(true)}>
              Custom range…
            </button>
          )}
        </div>
      )}

      {picking && (
        <DateRangePicker
          value={custom}
          onApply={(next) => {
            onCustom(next)
            setPicking(false)
            setOpen(false)
          }}
          onClear={() => {
            onCustom(null)
            setPicking(false)
            setOpen(false)
          }}
          onClose={() => {
            setPicking(false)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}
