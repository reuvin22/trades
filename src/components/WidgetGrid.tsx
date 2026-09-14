import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  clampSize,
  columnsFor,
  COLUMNS,
  forgetLayout,
  GAP,
  readLayout,
  reconcile,
  reorder,
  resize,
  ROW_HEIGHT,
  rowsFor,
  writeLayout,
  type Edge,
  type Layout,
  type Size,
  type WidgetSpec,
} from '../lib/widgets'
import { GripIcon } from './Icons'
import {
  HANDLE,
  HANDLE_CORNER_MARK,
  HANDLE_E,
  HANDLE_N,
  HANDLE_NE,
  HANDLE_NW,
  HANDLE_S,
  HANDLE_SE,
  HANDLE_SW,
  HANDLE_W,
  LAYOUT_RESET,
  WIDGET,
  WIDGET_ACTIVE,
  WIDGET_GRID,
  WIDGET_GRIP,
  WIDGET_TARGET,
} from './ui'

const HANDLES: { edge: Edge; className: string; label: string }[] = [
  { edge: 'n', className: HANDLE_N, label: 'Resize from the top' },
  { edge: 's', className: HANDLE_S, label: 'Resize from the bottom' },
  { edge: 'e', className: HANDLE_E, label: 'Resize from the right' },
  { edge: 'w', className: HANDLE_W, label: 'Resize from the left' },
  { edge: 'ne', className: HANDLE_NE, label: 'Resize from the top right' },
  { edge: 'nw', className: HANDLE_NW, label: 'Resize from the top left' },
  { edge: 'se', className: HANDLE_SE, label: 'Resize from the bottom right' },
  { edge: 'sw', className: HANDLE_SW, label: 'Resize from the bottom left' },
]

/** Below this the grid is one column and dragging is turned off entirely. */
const NARROW = 900

type Dragging =
  | { kind: 'resize'; id: string; edge: Edge; fromSize: Size; x: number; y: number }
  | { kind: 'move'; id: string; over: number | null }
  | null

/**
 * A grid of widgets the trader arranges themselves.
 *
 * Drag any of the four edges to resize one way, a corner to resize both. Drag
 * the grip to move a widget somewhere else in the order. It is remembered per
 * browser, and one button puts it all back.
 *
 * Built rather than installed, because this app takes no vendor packages into
 * `src/` — and the constraint turned out to be the good decision. A layout
 * library gives free x/y placement, which needs collision resolution, push-down
 * and compaction, and that is where hand-rolled dashboards break and library
 * ones get heavy. A flow of ordered widgets with sizes cannot overlap and
 * cannot leave an unreachable hole: every arrangement is valid by
 * construction.
 *
 * On a narrow screen none of it applies. A phone has one column, there is
 * nothing to arrange, and a drag gesture there fights the scroll.
 */
export function WidgetGrid({
  page,
  widgets,
  slots,
}: {
  /** Namespaces the saved layout, so two pages do not share one. */
  page: string
  widgets: WidgetSpec[]
  /**
   * One node per widget, keyed by id.
   *
   * Named `slots` rather than `children`: React treats that name specially,
   * and an explicit prop called `children` is silently overridden by anything
   * written between the tags.
   */
  slots: Record<string, ReactNode>
}) {
  const track = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>(() => reconcile(readLayout(page), widgets))
  const [dragging, setDragging] = useState<Dragging>(null)
  const [wide, setWide] = useState(true)

  /*
   * Reconciled again whenever the app's own widget list changes, so a card
   * added in a release appears for people who already have a saved layout
   * rather than being silently absent.
   *
   * Adjusted during render rather than in an effect — React's documented way
   * to react to a changed input, and the pattern used elsewhere in this app.
   * In an effect it would render once with the stale layout first, which on a
   * new release means the new widget visibly pops in a frame late.
   *
   * Keyed on the ids: the caller rebuilds the array every render, so its
   * identity changes constantly and means nothing.
   */
  const signature = widgets.map((widget) => widget.id).join(',')
  const [seen, setSeen] = useState(signature)

  if (seen !== signature) {
    setSeen(signature)
    setLayout((current) => reconcile(current, widgets))
  }

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${NARROW}px)`)
    const read = () => setWide(query.matches)

    read()
    query.addEventListener('change', read)
    return () => query.removeEventListener('change', read)
  }, [])

  const save = useCallback(
    (next: Layout) => {
      setLayout(next)
      writeLayout(page, next)
    },
    [page],
  )

  /* ------------------------------------------------------------ resizing */

  const onResizeStart = (
    event: ReactPointerEvent,
    id: string,
    edge: Edge,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setDragging({
      kind: 'resize',
      id,
      edge,
      fromSize: layout.sizes[id],
      x: event.clientX,
      y: event.clientY,
    })
  }

  useEffect(() => {
    if (dragging?.kind !== 'resize') return

    const spec = widgets.find((widget) => widget.id === dragging.id)

    function onMove(event: PointerEvent) {
      if (dragging?.kind !== 'resize') return

      const width = track.current?.clientWidth ?? 0

      setLayout((current) => ({
        ...current,
        sizes: {
          ...current.sizes,
          [dragging.id]: resize(
            dragging.fromSize,
            dragging.edge,
            columnsFor(event.clientX - dragging.x, width),
            rowsFor(event.clientY - dragging.y),
            spec?.min,
          ),
        },
      }))
    }

    function onUp() {
      setDragging(null)
      // Written once at the end rather than on every pointer move: a drag
      // across the screen is a hundred events, and a hundred writes to
      // localStorage is a hundred synchronous disk touches.
      setLayout((current) => {
        writeLayout(page, current)
        return current
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, widgets, page])

  /**
   * Resize from the keyboard, with the handle focused.
   *
   * The handles are buttons rather than bare divs for exactly this: a mouse is
   * not the only way to hold and drag, and a feature that only works with one
   * is a feature half the people who need it cannot use.
   *
   * Which handle is focused does not matter. In a flow, left and right always
   * mean width and up and down always mean height — there is no north edge to
   * pull against, so every handle answers the arrows the same way.
   */
  const onHandleKey = (event: React.KeyboardEvent, id: string) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0

    if (step === 0) return
    event.preventDefault()

    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const spec = widgets.find((widget) => widget.id === id)

    save({
      ...layout,
      sizes: {
        ...layout.sizes,
        [id]: clampSize(
          {
            w: layout.sizes[id].w + (horizontal ? step : 0),
            h: layout.sizes[id].h + (horizontal ? 0 : step),
          },
          spec?.min,
        ),
      },
    })
  }

  /* ------------------------------------------------------------- moving */

  const onMoveStart = (event: ReactPointerEvent, id: string) => {
    event.preventDefault()
    setDragging({ kind: 'move', id, over: null })
  }

  useEffect(() => {
    if (dragging?.kind !== 'move') return

    function onMove(event: PointerEvent) {
      const node = track.current
      if (!node || dragging?.kind !== 'move') return

      /*
       * The drop position is read from the DOM rather than computed from the
       * grid, because CSS placed these — with dense packing, where a widget
       * visually sits is not something the order alone can tell you.
       */
      const frames = [...node.querySelectorAll<HTMLElement>('[data-widget]')]
      let over: number | null = null

      frames.forEach((frame, index) => {
        const box = frame.getBoundingClientRect()
        if (
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom
        ) {
          over = index
        }
      })

      setDragging((current) =>
        current?.kind === 'move' && current.over !== over ? { ...current, over } : current,
      )
    }

    function onUp() {
      if (dragging?.kind === 'move' && dragging.over !== null) {
        save({ ...layout, order: reorder(layout.order, dragging.id, dragging.over) })
      }
      setDragging(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, layout, save])

  /* ------------------------------------------------------------- render */

  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
    gridAutoRows: `${ROW_HEIGHT}px`,
    gap: `${GAP}px`,
  }

  return (
    <>
      <div ref={track} className={WIDGET_GRID} style={wide ? style : { gap: `${GAP}px` }}>
        {layout.order.map((id, index) => {
          const spec = widgets.find((widget) => widget.id === id)
          const size = layout.sizes[id]
          if (!spec || !size || !slots[id]) return null

          const moving = dragging?.kind === 'move' && dragging.id === id
          const target = dragging?.kind === 'move' && dragging.over === index && !moving

          return (
            <div
              key={id}
              data-widget={id}
              className={`${WIDGET} ${moving ? WIDGET_ACTIVE : ''} ${target ? WIDGET_TARGET : ''}`}
              style={
                wide
                  ? { gridColumn: `span ${size.w}`, gridRow: `span ${size.h}` }
                  : undefined
              }
            >
              {slots[id]}

              {wide && (
                <>
                  <button
                    type="button"
                    className={WIDGET_GRIP}
                    aria-label={`Move ${spec.title}`}
                    onPointerDown={(event) => onMoveStart(event, id)}
                  >
                    <GripIcon size={13} />
                  </button>

                  {HANDLES.map((handle) => (
                    <button
                      key={handle.edge}
                      type="button"
                      className={`${HANDLE} ${handle.className}`}
                      aria-label={`${handle.label}: ${spec.title}`}
                      onPointerDown={(event) => onResizeStart(event, id, handle.edge)}
                      onKeyDown={(event) => onHandleKey(event, id)}
                    >
                      {handle.edge === 'se' && <span className={HANDLE_CORNER_MARK} />}
                    </button>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>

      {wide && (
        <button
          type="button"
          className={LAYOUT_RESET}
          onClick={() => {
            forgetLayout(page)
            setLayout(reconcile(null, widgets))
          }}
        >
          Reset layout
        </button>
      )}
    </>
  )
}
