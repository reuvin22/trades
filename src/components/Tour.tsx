import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOUR } from '../data/tour'
import { navigate } from '../lib/useHashRoute'
import { ArrowUpIcon, ChevronRightIcon, CloseIcon, RobotIcon } from './Icons'
import {
  TOUR_AVATAR,
  TOUR_BODY,
  TOUR_CARD,
  TOUR_COUNT,
  TOUR_EXIT,
  TOUR_FILL,
  TOUR_FOOT,
  TOUR_HEAD,
  TOUR_NEXT,
  TOUR_PREV,
  TOUR_SKIP,
  TOUR_SPOTLIGHT,
  TOUR_TITLE,
  TOUR_TRACK,
  TOUR_VEIL,
} from './ui'

type Rect = { top: number; left: number; width: number; height: number }

/** Breathing room between the spotlight and the card. */
const GAP = 14
/** Keeps the card off the very edge of the viewport. */
const EDGE = 16
/** Below this the card stops chasing the target and becomes a bottom sheet. */
const SHEET_WIDTH = 520
/** How long to wait for a target to appear after a route change before giving
 *  up and centring. */
const FIND_MS = 900

function findTarget(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${name}"]`)
}

/**
 * Whether a target is worth spotlighting at this size.
 *
 * `visibility: hidden` elements still have a box, so a closed navigation
 * drawer reports a perfectly good rect off the left edge of the screen — hence
 * the horizontal check as well. Vertical position is deliberately not tested:
 * a target below the fold is normal and gets scrolled to.
 */
function isVisible(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return false
  if (getComputedStyle(node).visibility === 'hidden') return false
  return rect.right > 0 && rect.left < window.innerWidth
}

export function Tour({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const card = useRef<HTMLDivElement>(null)

  const step = TOUR[index]
  const last = index === TOUR.length - 1

  // Land on the right screen before looking for anything on it.
  useEffect(() => {
    if (step.route) navigate(step.route)
  }, [step.route])

  /**
   * Measure the target. Deliberately free of side effects: this runs on every
   * scroll event, and scrolling from in here would chase its own tail.
   */
  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null)
      return
    }

    const node = findTarget(step.target)
    if (!node || !isVisible(node)) {
      setRect(null)
      return
    }

    const box = node.getBoundingClientRect()
    setRect({
      top: box.top - 6,
      left: box.left - 6,
      width: box.width + 12,
      height: box.height + 12,
    })
  }, [step.target])

  useEffect(() => {
    let frame = 0
    let scrolled = false
    const started = performance.now()

    /*
     * Poll briefly rather than measuring once: the target may not exist until
     * the new route has painted, and the scroll below keeps moving it for a
     * few frames after that. Scrolling happens once, the first time the target
     * turns up, so the smooth scroll is never restarted mid-flight.
     */
    function tick() {
      if (!scrolled && step.target) {
        const node = findTarget(step.target)
        if (node && isVisible(node)) {
          scrolled = true
          node.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }

      measure()
      if (performance.now() - started < FIND_MS) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [measure, step.target, index])

  // Anything that changes the layout invalidates the rect.
  useEffect(() => {
    function onChange() {
      measure()
    }

    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [measure])

  /*
   * Place the card: under the spotlight if it fits, above if not, and clamped
   * to the viewport on both axes either way.
   *
   * Written straight to the node rather than held in state. The position is a
   * measurement of the card's own rendered size, so putting it in state would
   * mean rendering twice to learn where the first render should have gone.
   * Below the sheet breakpoint the inline values are cleared and the
   * stylesheet pins it across the bottom.
   */
  useLayoutEffect(() => {
    const node = card.current
    if (!node) return

    if (window.innerWidth <= SHEET_WIDTH) {
      node.style.top = ''
      node.style.left = ''
      return
    }

    const { offsetWidth: width, offsetHeight: height } = node

    if (!rect) {
      node.style.top = `${Math.max(EDGE, (window.innerHeight - height) / 2)}px`
      node.style.left = `${Math.max(EDGE, (window.innerWidth - width) / 2)}px`
      return
    }

    const below = rect.top + rect.height + GAP
    const above = rect.top - height - GAP
    // Prefer below; go above only when below would run off the bottom.
    const top =
      below + height <= window.innerHeight - EDGE
        ? below
        : above >= EDGE
          ? above
          : Math.max(EDGE, window.innerHeight - height - EDGE)

    const centred = rect.left + rect.width / 2 - width / 2
    const left = Math.min(
      Math.max(EDGE, centred),
      Math.max(EDGE, window.innerWidth - width - EDGE),
    )

    node.style.top = `${top}px`
    node.style.left = `${left}px`
  }, [rect, index])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onFinish()
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(TOUR.length - 1, i + 1))
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onFinish])

  return (
    <div role="dialog" aria-modal="true" aria-label="Product tour">
      {rect ? (
        <div
          className={TOUR_SPOTLIGHT}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : (
        <div className={TOUR_VEIL} />
      )}

      <button type="button" className={TOUR_EXIT} onClick={onFinish}>
        <CloseIcon size={13} />
        Skip tutorial
      </button>

      <div ref={card} className={TOUR_CARD}>
        {/* Previous lives above the card, as asked, and travels with it. */}
        <button
          type="button"
          className={TOUR_PREV}
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowUpIcon size={13} />
          Previous
        </button>

        <div className={TOUR_HEAD}>
          <span className={TOUR_AVATAR} aria-hidden="true">
            <RobotIcon size={20} />
          </span>

          <div className="min-w-0">
            <h2 className={TOUR_TITLE}>{step.title}</h2>
            <p className={TOUR_BODY}>{step.body}</p>
          </div>
        </div>

        <span className={TOUR_TRACK}>
          <span
            className={TOUR_FILL}
            style={{ width: `${((index + 1) / TOUR.length) * 100}%` }}
          />
        </span>

        <div className={TOUR_FOOT}>
          <span className={TOUR_COUNT}>
            {index + 1} / {TOUR.length}
          </span>

          <button type="button" className={TOUR_SKIP} onClick={onFinish}>
            Skip
          </button>

          <button
            type="button"
            className={TOUR_NEXT}
            onClick={() => (last ? onFinish() : setIndex((i) => i + 1))}
          >
            {last ? 'Start trading' : 'Next'}
            {!last && <ChevronRightIcon size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
