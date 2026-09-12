/**
 * A screenshot, shrunk to something the API will accept.
 *
 * This exists because of a hard limit rather than for tidiness. The API
 * rejects a request over 256KB, and a chart screenshot off a phone or a
 * 4K monitor is two to six megabytes before base64 inflates it by another
 * third. Uploading the original is not slow — it is refused.
 *
 * So the browser re-encodes first. Charts survive this well: they are flat
 * colour and thin lines, so most of those megabytes are resolution nobody
 * needs to read a candle. What matters is that the axis labels stay legible,
 * which is why the long edge stays generous and the quality drops before the
 * dimensions do.
 */

/** Long edge, in pixels. Enough to read price labels on a full-screen chart. */
const MAX_EDGE = 1_400

/** Comfortably inside the API's own 200,000-character ceiling. */
const MAX_CHARACTERS = 170_000

/** Tried in order until one fits. Below the last one a chart stops being
 *  readable, and sending something illegible is worse than refusing. */
const QUALITIES = [0.85, 0.72, 0.6, 0.45]

export const ACCEPTED = 'image/png,image/jpeg,image/webp,image/gif'

function isImage(file: File | null | undefined): file is File {
  return !!file && file.type.startsWith('image/')
}

/** The first image in a paste, or null if the clipboard held none. */
export function imageFromPaste(items: DataTransferItemList | null): File | null {
  for (const item of items ?? []) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (isImage(file)) return file
  }
  return null
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      // Revoked as soon as the bitmap is decoded: the blob is held in memory
      // until it is, and a session of pasted screenshots would otherwise keep
      // every one of them alive for the life of the tab.
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be opened.'))
    }

    image.src = url
  })
}

/**
 * Re-encode a chart small enough to send.
 *
 * Returns a JPEG data URL. Throws when the file is not an image the browser
 * can decode, or when even the lowest quality will not fit — a photograph of a
 * trading desk rather than a screenshot of a chart, say.
 */
export async function prepareChart(file: File): Promise<string> {
  if (!isImage(file)) throw new Error('That file is not an image.')

  const image = await load(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))

  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser could not process that image.')

  // White underneath, because a transparent PNG flattened onto JPEG's default
  // black turns a light-themed chart into an unreadable negative.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  for (const quality of QUALITIES) {
    const encoded = canvas.toDataURL('image/jpeg', quality)
    if (encoded.length <= MAX_CHARACTERS) return encoded
  }

  throw new Error('That image is too large. Try cropping it to just the chart.')
}
