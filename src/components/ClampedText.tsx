import { useEffect, useRef, useState } from 'react'
import { INSIGHT_BODY, INSIGHT_CLAMP, INSIGHT_MORE } from './ui'

/**
 * Text that stops at a few lines until asked to go on.
 *
 * Built because the coach's findings vary from one sentence to a paragraph,
 * and the card holding them sits in a fixed-width rail beside a chart of fixed
 * height. A long finding used to push that rail to twice the height of the
 * row, which left a void next to the chart and shoved everything below it down
 * the page.
 *
 * The toggle only appears when the text is genuinely cut off, and that is
 * **measured** rather than guessed from length: the same number of characters
 * wraps to four lines or eight depending on the width it is given, and a
 * "Show more" that reveals nothing is worse than no button at all.
 */
export function ClampedText({ children }: { children: string }) {
  const body = useRef<HTMLParagraphElement>(null)
  const [clipped, setClipped] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const node = body.current
    if (!node) return

    /*
     * Re-measured on resize as well as on new text, because the rail is not a
     * fixed width at every breakpoint — the same finding that fits on a wide
     * screen is cut off on a narrow one.
     */
    function measure() {
      const element = body.current
      if (!element) return

      // Only meaningful while clamped: expanded, the two are equal by
      // definition and the button would remove itself mid-read.
      setClipped((wasClipped) =>
        open ? wasClipped : element.scrollHeight > element.clientHeight + 1,
      )
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [children, open])

  return (
    <>
      <p ref={body} className={`${INSIGHT_BODY} ${open ? '' : INSIGHT_CLAMP}`}>
        {children}
      </p>

      {clipped && (
        <button type="button" className={INSIGHT_MORE} onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  )
}
