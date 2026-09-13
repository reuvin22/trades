import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  clampZoom,
  ImageViewerContext,
  turn,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  type ImageViewerApi,
  type ViewerImage,
} from '../lib/imageViewer'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  RotateIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './Icons'
import {
  VIEWER,
  VIEWER_BAR,
  VIEWER_BUTTON,
  VIEWER_CLOSE,
  VIEWER_COUNT,
  VIEWER_IMAGE,
  VIEWER_LEVEL,
  VIEWER_STAGE,
  VIEWER_STEP,
  VIEWER_TOOLS,
} from './ui'

/** Where the picture sits and how it is turned. Reset on every open. */
type View = { zoom: number; degrees: number; x: number; y: number }

const RESTING: View = { zoom: 1, degrees: 0, x: 0, y: 0 }

/**
 * The app's one picture viewer.
 *
 * Every image in the app opens here, so that zooming, rotating and stepping
 * through behave the same on a chart in the journal, an attachment in a
 * conversation and a screenshot sent to the coach. The alternative — each
 * surface opening a new browser tab — loses the app, the theme, and any
 * control over the image once it is open.
 *
 * Mounted once at the root and driven through context, because the thing being
 * looked at is usually inside something else that is already modal: a trade's
 * charts open from a dialog, and a dialog inside a dialog is a layout fight.
 * One viewer in the top layer sits above whatever opened it.
 */
export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<ViewerImage[]>([])
  const [at, setAt] = useState(0)
  const [view, setView] = useState<View>(RESTING)

  /** Where the pointer went down, and where the picture was at that moment. */
  const drag = useRef<{ x: number; y: number; fromX: number; fromY: number } | null>(null)

  const open = images.length > 0
  const current = images[at] ?? null

  const api = useMemo<ImageViewerApi>(
    () => ({
      open: (next, startAt = 0) => {
        const usable = next.filter((entry) => entry.src !== '')
        if (usable.length === 0) return

        setImages(usable)
        setAt(Math.min(Math.max(startAt, 0), usable.length - 1))
        setView(RESTING)
      },
    }),
    [],
  )

  const close = useCallback(() => {
    setImages([])
    setAt(0)
    setView(RESTING)
  }, [])

  // Stepping resets the view: the zoom that suited one chart is rarely the one
  // that suits the next, and arriving at a new picture already panned off the
  // edge of the screen looks broken.
  const step = useCallback(
    (by: number) => {
      setAt((index) => {
        const next = index + by
        if (next < 0 || next >= images.length) return index

        setView(RESTING)
        return next
      })
    },
    [images.length],
  )

  const zoomBy = useCallback((factor: number) => {
    setView((currentView) => {
      const zoom = clampZoom(currentView.zoom * factor)
      // Back to centre on the way out: a picture panned while zoomed in and
      // then zoomed back out would otherwise sit off to one side at 1x.
      return zoom <= 1 ? { ...currentView, zoom, x: 0, y: 0 } : { ...currentView, zoom }
    })
  }, [])

  const rotate = useCallback((by: number) => {
    setView((currentView) => ({ ...currentView, degrees: turn(currentView.degrees, by) }))
  }, [])

  /* Open and close the dialog itself, following the state above. */
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])

  /* Keyboard: the shortcuts a picture viewer is expected to have. */
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowRight':
          step(1)
          break
        case 'ArrowLeft':
          step(-1)
          break
        case '+':
        case '=':
          zoomBy(ZOOM_STEP)
          break
        case '-':
        case '_':
          zoomBy(1 / ZOOM_STEP)
          break
        case 'r':
        case 'R':
          rotate(event.shiftKey ? -90 : 90)
          break
        case '0':
          setView(RESTING)
          break
        default:
          return
      }

      event.preventDefault()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, step, zoomBy, rotate])

  /*
   * Wheel zoom, attached by hand rather than with onWheel.
   *
   * React's synthetic wheel listener is passive, so preventDefault inside it
   * does nothing and the page scrolls behind the viewer while you zoom.
   */
  useEffect(() => {
    const node = stage.current
    if (!open || !node) return

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      zoomBy(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [open, zoomBy])

  function startDrag(event: ReactPointerEvent) {
    // Only worth dragging what does not already fit on the screen.
    if (view.zoom <= 1) return

    drag.current = { x: event.clientX, y: event.clientY, fromX: view.x, fromY: view.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onDrag(event: ReactPointerEvent) {
    const from = drag.current
    if (!from) return

    setView((currentView) => ({
      ...currentView,
      x: from.fromX + (event.clientX - from.x),
      y: from.fromY + (event.clientY - from.y),
    }))
  }

  function endDrag(event: ReactPointerEvent) {
    if (!drag.current) return

    drag.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const caption = current?.label ?? ''
  const counter = images.length > 1 ? `${at + 1} of ${images.length}` : ''

  return (
    <ImageViewerContext.Provider value={api}>
      {children}

      <dialog
        ref={dialog}
        className={VIEWER}
        aria-label="Image viewer"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        {current && (
          <div
            ref={stage}
            className={VIEWER_STAGE}
            // A press that lands on the stage rather than on the picture or a
            // control is a press on the space around it, which closes — the
            // same gesture that dismisses every other overlay in the app.
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) close()
            }}
          >
            {(caption || counter) && (
              <span className={VIEWER_COUNT}>
                {[caption, counter].filter(Boolean).join(' · ')}
              </span>
            )}

            <button
              type="button"
              className={VIEWER_CLOSE}
              onClick={close}
              aria-label="Close viewer"
            >
              <CloseIcon />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${VIEWER_STEP} left-16`}
                  onClick={() => step(-1)}
                  disabled={at === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon size={18} />
                </button>

                <button
                  type="button"
                  className={`${VIEWER_STEP} right-16`}
                  onClick={() => step(1)}
                  disabled={at === images.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </>
            )}

            <img
              src={current.src}
              alt={caption}
              className={VIEWER_IMAGE}
              draggable={false}
              referrerPolicy="no-referrer"
              /*
               * Translate first, so the pan is in screen coordinates: drag
               * right and the picture goes right, whichever way it is turned.
               * Put rotate ahead of it and a picture on its side would move
               * sideways when dragged up.
               */
              style={{
                transform: `translate(${view.x}px, ${view.y}px) rotate(${view.degrees}deg) scale(${view.zoom})`,
                cursor: view.zoom > 1 ? 'grab' : 'zoom-in',
              }}
              onPointerDown={startDrag}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              // At rest the picture is a far bigger zoom target than the
              // toolbar, and clicking what you want to see closer is the
              // gesture people try first.
              onClick={() => {
                if (view.zoom <= 1) zoomBy(ZOOM_STEP * ZOOM_STEP)
              }}
            />

            <div className={VIEWER_BAR}>
              <div className={VIEWER_TOOLS}>
                <button
                  type="button"
                  className={VIEWER_BUTTON}
                  onClick={() => zoomBy(1 / ZOOM_STEP)}
                  disabled={view.zoom <= ZOOM_MIN}
                  aria-label="Zoom out"
                >
                  <ZoomOutIcon />
                </button>

                <button
                  type="button"
                  className={VIEWER_LEVEL}
                  onClick={() => setView(RESTING)}
                  aria-label="Reset the view"
                  title="Reset"
                >
                  {Math.round(view.zoom * 100)}%
                </button>

                <button
                  type="button"
                  className={VIEWER_BUTTON}
                  onClick={() => zoomBy(ZOOM_STEP)}
                  disabled={view.zoom >= ZOOM_MAX}
                  aria-label="Zoom in"
                >
                  <ZoomInIcon />
                </button>

                <button
                  type="button"
                  className={VIEWER_BUTTON}
                  onClick={() => rotate(90)}
                  aria-label="Rotate a quarter turn"
                >
                  <RotateIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </ImageViewerContext.Provider>
  )
}
