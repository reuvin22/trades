import { useImageViewer } from '../lib/imageViewer'
import { useImageUrls } from '../lib/useImageUrl'
import { ImageIcon } from './Icons'
import { SHOT_STRIP, SHOT_TILE, SHOT_TILE_EMPTY, SHOT_TILE_IMAGE } from './ui'

/**
 * The charts filed with a trade, as thumbnails that open full size.
 *
 * Thumbnails here and filenames in the form, which is not an inconsistency:
 * while attaching, the name confirms the right file went up; reading the entry
 * back, the picture *is* the content, and it is usually the reason the row was
 * opened at all.
 */
export function ChartStrip({ keys }: { keys: string[] }) {
  const viewer = useImageViewer()

  /*
   * Every chart is resolved before any is clicked, not one at a time on
   * demand. The viewer steps between them with the arrow keys, so a set where
   * only the tile that was clicked has a URL is a set with one picture in it.
   */
  const urls = useImageUrls(keys)

  if (keys.length === 0) return null

  const ready = urls
    .map((url, index) => ({ url, index }))
    .filter((entry): entry is { url: string; index: number } => entry.url !== null)

  return (
    <div className={SHOT_STRIP}>
      {keys.map((key, index) => {
        const url = urls[index]
        // Where this chart sits among the ones that resolved — not among all
        // of them, since the viewer is only given the resolved set.
        const startAt = ready.findIndex((entry) => entry.index === index)

        return (
          <button
            key={key}
            type="button"
            className={SHOT_TILE}
            aria-label={`Open chart ${index + 1} of ${keys.length}`}
            disabled={url === null}
            onClick={() => {
              if (url === null) return
              viewer.open(
                ready.map((entry) => ({
                  src: entry.url,
                  label: keys.length > 1 ? `Chart ${entry.index + 1}` : 'Chart',
                })),
                startAt,
              )
            }}
          >
            {url === null ? (
              <span className={SHOT_TILE_EMPTY}>
                <ImageIcon size={20} />
              </span>
            ) : (
              <img
                className={SHOT_TILE_IMAGE}
                src={url}
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
