import { createContext, useContext } from 'react'

/** One picture the viewer can show, already resolved to something loadable. */
export type ViewerImage = {
  src: string
  /** Shown in the corner, and read out. A filename or a caption. */
  label?: string
}

export type ImageViewerApi = {
  /**
   * Open the viewer on a set of images.
   *
   * A set rather than one, because the places that show pictures usually show
   * several — a trade with three charts, a conversation with a handful — and
   * stepping between them beats closing and reopening.
   */
  open: (images: ViewerImage[], startAt?: number) => void
}

export const ImageViewerContext = createContext<ImageViewerApi | null>(null)

/**
 * The app-wide way to show a picture full size.
 *
 * Every image in the app opens here when clicked, so that zooming, rotating
 * and stepping through work the same everywhere rather than each surface
 * inventing its own. Opening a new browser tab was the old answer; it loses
 * the app, the theme and any control over the image.
 */
export function useImageViewer(): ImageViewerApi {
  const api = useContext(ImageViewerContext)
  if (!api) throw new Error('useImageViewer must be used inside an ImageViewerProvider.')
  return api
}

/** How far in and out the viewer will go, and the step between. */
export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 8
export const ZOOM_STEP = 1.25

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))
}

/** Rotation, kept in [0, 360) so the readout never says 720°. */
export function turn(degrees: number, by: number): number {
  return (((degrees + by) % 360) + 360) % 360
}
