import { useMemo, useState } from 'react'
import { catalogue, WIDGET_ABOUT } from '../lib/widgetCatalogue'
import { usePlan } from '../lib/entitlements'
import {
  forgetLayout,
  readLayout,
  reconcile,
  toggleHidden,
  writeLayout,
  type Layout,
} from '../lib/widgets'
import {
  LAYOUT_RESET,
  PAGE_ACTIONS,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  ROW_STAGGER,
  SECTION_EMPTY,
  TPL_ITEM,
  TPL_ITEM_ABOUT,
  TPL_ITEM_BODY,
  TPL_ITEM_NAME,
  TPL_ITEM_OFF,
  TPL_KNOB,
  TPL_LIST,
  TPL_PAGE,
  TPL_PAGE_COUNT,
  TPL_PAGE_HEAD,
  TPL_PAGE_NAME,
  TPL_SWITCH,
  TPL_SWITCH_OFF,
  TPL_SWITCH_ON,
} from '../components/ui'

/**
 * Which widgets appear on which page.
 *
 * The companion to dragging: sizing and moving decides how a page looks, this
 * decides what is on it at all. Kept as its own screen rather than a menu on
 * each page, because the useful question is "what am I not looking at", and
 * that is only answerable with every page in front of you.
 *
 * Switching one off hides it; it does not forget it. The order and size of a
 * hidden widget survive, so turning it back on puts it where it was rather
 * than at the end at a default size — which is what makes trying a layout
 * without something a safe thing to do.
 */
export function Templates() {
  // Only the widgets this plan includes are offered. A locked one left in the
  // list would be a switch that turns on something that never renders.
  const plan = usePlan()
  const pages = useMemo(() => catalogue(plan), [plan])

  /*
   * One layout per page, read once and written on every change.
   *
   * Held here rather than read fresh on each toggle so the switches respond
   * immediately: localStorage is synchronous, but a round trip through it per
   * keystroke is work for nothing.
   */
  const [layouts, setLayouts] = useState<Record<string, Layout>>(() =>
    Object.fromEntries(
      pages.map((page) => [page.key, reconcile(readLayout(page.key), page.widgets)]),
    ),
  )

  function toggle(pageKey: string, id: string) {
    setLayouts((current) => {
      const next = toggleHidden(current[pageKey], id)
      writeLayout(pageKey, next)
      return { ...current, [pageKey]: next }
    })
  }

  function showEverything() {
    setLayouts((current) => {
      const next: Record<string, Layout> = {}

      for (const page of pages) {
        // Only the hidden list is cleared. Sizes and order are the trader's
        // other decision and are none of this button's business.
        next[page.key] = { ...current[page.key], hidden: [] }
        writeLayout(page.key, next[page.key])
      }

      return next
    })
  }

  function resetEverything() {
    setLayouts(() => {
      const next: Record<string, Layout> = {}

      for (const page of pages) {
        forgetLayout(page.key)
        next[page.key] = reconcile(null, page.widgets)
      }

      return next
    })
  }

  const hiddenCount = pages.reduce(
    (total, page) => total + (layouts[page.key]?.hidden.length ?? 0),
    0,
  )

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Templates</h2>
          <p className={PAGE_SUB}>
            What appears on each page. Switch off anything you do not use — it
            keeps its place and size for when you want it back.
          </p>
        </div>

        <div className={PAGE_ACTIONS}>
          {hiddenCount > 0 && (
            <button type="button" className={LAYOUT_RESET} onClick={showEverything}>
              Show all {hiddenCount} hidden
            </button>
          )}
          <button type="button" className={LAYOUT_RESET} onClick={resetEverything}>
            Reset every layout
          </button>
        </div>
      </div>

      <div className={ROW_STAGGER}>
        {pages.map((page) => {
          const layout = layouts[page.key]
          const shown = page.widgets.length - layout.hidden.length

          return (
            <section key={page.key} className={TPL_PAGE}>
              <div className={TPL_PAGE_HEAD}>
                <h3 className={TPL_PAGE_NAME}>{page.title}</h3>
                <span className={TPL_PAGE_COUNT}>
                  {shown} of {page.widgets.length} showing
                </span>
              </div>

              <div className={TPL_LIST}>
                {page.widgets.map((widget) => {
                  const off = layout.hidden.includes(widget.id)

                  return (
                    <button
                      key={widget.id}
                      type="button"
                      role="switch"
                      aria-checked={!off}
                      className={`${TPL_ITEM} ${off ? TPL_ITEM_OFF : ''}`}
                      onClick={() => toggle(page.key, widget.id)}
                    >
                      <span
                        className={`${TPL_SWITCH} ${off ? TPL_SWITCH_OFF : TPL_SWITCH_ON}`}
                        aria-hidden="true"
                      >
                        <span
                          className={TPL_KNOB}
                          style={{ left: off ? '3px' : '17px' }}
                        />
                      </span>

                      <span className={TPL_ITEM_BODY}>
                        <span className={TPL_ITEM_NAME}>{widget.title}</span>
                        <span className={TPL_ITEM_ABOUT}>
                          {WIDGET_ABOUT[widget.id] ?? ''}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/*
        Named rather than left implicit. Only the dashboard is a widget grid so
        far, and a Templates screen listing one page looks broken unless it
        says why.
      */}
      <p className={SECTION_EMPTY}>
        Other pages are not arrangeable yet. As each one becomes a widget grid,
        its widgets appear here.
      </p>
    </>
  )
}
