import { useState, type KeyboardEvent } from 'react'
import { useImageViewer } from '../lib/imageViewer'
import { useImageUrls } from '../lib/useImageUrl'
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, ZoomInIcon } from './Icons'

const ARROW =
  'absolute top-1/2 z-10 grid size-36 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-panel-solid/85 text-fg-strong shadow-[var(--shadow-card)] backdrop-blur-sm transition-[background-color,transform] duration-150 hover:bg-panel-solid active:scale-95 disabled:pointer-events-none disabled:opacity-0'

/**
 * The charts filed with a trade, one at a time, with arrows to step through.
 *
 * What the trader uploaded is the picture of the trade they meant; a chart
 * redrawn from entry and exit alone has no candles to show without a market
 * data feed. Clicking the image opens it full size in the shared viewer, which
 * zooms and rotates.
 */
export function ScreenshotCarousel({ keys }: { keys: string[] }) {
  const urls = useImageUrls(keys)
  const viewer = useImageViewer()
  const [index, setIndex] = useState(0)

  if (keys.length === 0) {
    return (
      <div className="grid h-[clamp(240px,42vh,380px)] place-items-center rounded-sm border border-dashed border-line bg-panel-inset px-20 text-center max-[900px]:h-[clamp(200px,34vh,280px)]">
        <div className="flex flex-col items-center gap-8 text-fg-muted">
          <ImageIcon size={26} />
          <p className="text-[13px] font-medium text-fg-dim">No chart screenshots for this trade</p>
          <p className="text-[12px]">Use Edit trade to upload one.</p>
        </div>
      </div>
    )
  }

  // Clamped on read, so a trade with fewer charts never lands past the end.
  const current = Math.min(index, keys.length - 1)
  const url = urls[current]
  const many = keys.length > 1

  const step = (by: number) => setIndex((current + by + keys.length) % keys.length)

  function openFull() {
    const ready = urls
      .map((src, at) => ({ src, at }))
      .filter((entry): entry is { src: string; at: number } => entry.src !== null)
    const startAt = ready.findIndex((entry) => entry.at === current)
    if (startAt < 0) return
    viewer.open(
      ready.map((entry) => ({ src: entry.src, label: many ? `Chart ${entry.at + 1} of ${keys.length}` : 'Chart' })),
      startAt,
    )
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!many) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div
        className="group relative h-[clamp(240px,42vh,380px)] overflow-hidden rounded-sm border border-line bg-panel-inset outline-none focus-visible:border-accent max-[900px]:h-[clamp(200px,34vh,280px)]"
        tabIndex={many ? 0 : -1}
        onKeyDown={onKeyDown}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Chart ${current + 1} of ${keys.length}`}
      >
        {url === null ? (
          <div className="grid size-full animate-pulse place-items-center text-fg-muted">
            <ImageIcon size={24} />
          </div>
        ) : (
          <button type="button" className="block size-full cursor-zoom-in" onClick={openFull} aria-label="Open full size">
            <img src={url} alt={`Chart ${current + 1}`} className="size-full object-contain" referrerPolicy="no-referrer" />
            <span className="pointer-events-none absolute right-10 bottom-10 inline-flex items-center gap-5 rounded-full bg-panel-solid/85 px-9 py-4 text-[11px] text-fg-dim opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <ZoomInIcon size={12} /> Full size
            </span>
          </button>
        )}

        {many && (
          <>
            <button type="button" className={`${ARROW} left-10`} onClick={() => step(-1)} aria-label="Previous chart">
              <ChevronLeftIcon size={18} />
            </button>
            <button type="button" className={`${ARROW} right-10`} onClick={() => step(1)} aria-label="Next chart">
              <ChevronRightIcon size={18} />
            </button>
            <span className="pointer-events-none absolute top-10 right-10 rounded-full bg-panel-solid/85 px-9 py-3 text-[11px] font-medium tabular-nums text-fg-dim">
              {current + 1} / {keys.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <div className="flex gap-8 overflow-x-auto pb-2">
          {keys.map((key, at) => (
            <button
              key={key}
              type="button"
              onClick={() => setIndex(at)}
              aria-label={`Show chart ${at + 1}`}
              aria-current={at === current}
              className={`h-48 w-72 flex-none overflow-hidden rounded-[5px] border-2 transition-[border-color,opacity] duration-150 ${
                at === current ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {urls[at] === null ? (
                <span className="grid size-full place-items-center bg-panel-inset text-fg-muted">
                  <ImageIcon size={14} />
                </span>
              ) : (
                <img src={urls[at] ?? ''} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
