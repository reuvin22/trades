import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { CloseIcon, SpinnerIcon } from './Icons'
import { readableApiError } from '../lib/api'
import {
  ASK_BODY,
  ASK_CONSEQUENCE,
  ASK_TEXT,
  MODAL,
  MODAL_BUTTONS,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_HEAD,
  MODAL_NARROW,
  MODAL_NOTE,
  MODAL_SHELL,
  MODAL_SUB,
  MODAL_TITLE,
  PILL,
  PILL_DANGER,
  PILL_IDLE,
} from './ui'

export type ConfirmRequest = {
  title: string
  /** What is about to happen, in a sentence. */
  body: ReactNode
  /**
   * What is lost and cannot be recovered.
   *
   * Optional, and separate from `body` on purpose: "delete this document" and
   * "every signature on it goes too" are different facts, and running them
   * together is how the second one gets skimmed past.
   */
  consequence?: ReactNode
  /** The button's words. Say the verb, never "OK". */
  action?: string
  onConfirm: () => void | Promise<void>
}

/**
 * One confirmation for everything destructive.
 *
 * A native `<dialog>`, like the rest of this app's modals, so the focus trap,
 * the backdrop and Escape come from the platform rather than from us.
 *
 * Three things it does that a bare `window.confirm` does not: it names the
 * thing being deleted, it states the consequence separately from the question,
 * and it stays open on failure with the reason — a delete that silently did
 * nothing is worse than one that refused out loud.
 *
 * Rendered by the screen that owns the action rather than provided through
 * context, because each one needs its own wording and there is nothing to
 * share but the shape.
 */
export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  const [working, setWorking] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (request && !node.open) node.showModal()
    else if (!request && node.open) node.close()
  }, [request])

  /** Every way out comes through here, so nothing is left half-set. */
  function dismiss() {
    if (working) return
    setFailure(null)
    onClose()
  }

  async function go() {
    if (request === null || working) return

    setWorking(true)
    setFailure(null)

    try {
      await request.onConfirm()
      setWorking(false)
      onClose()
    } catch (cause) {
      // Held open with the reason. Closing on failure would look exactly like
      // closing on success.
      setFailure(readableApiError(cause))
      setWorking(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_NARROW}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) dismiss()
      }}
    >
      {request && (
        <div className={MODAL_SHELL}>
          <header className={MODAL_HEAD}>
            <div>
              <h2 className={MODAL_TITLE} id={titleId}>
                {request.title}
              </h2>
              <p className={MODAL_SUB}>This cannot be undone.</p>
            </div>

            <button
              type="button"
              className={MODAL_CLOSE}
              onClick={dismiss}
              aria-label="Cancel"
            >
              <CloseIcon size={15} />
            </button>
          </header>

          <div className={ASK_BODY}>
            <p className={ASK_TEXT}>{request.body}</p>
            {request.consequence !== undefined && (
              <p className={ASK_CONSEQUENCE}>{request.consequence}</p>
            )}
          </div>

          <footer className={MODAL_FOOT}>
            <p className={MODAL_NOTE} role={failure === null ? undefined : 'alert'}>
              {failure ?? ''}
            </p>

            <div className={MODAL_BUTTONS}>
              <button
                type="button"
                className={`${PILL} ${PILL_IDLE}`}
                onClick={dismiss}
                disabled={working}
                // Cancel takes the focus, not the destructive button. A
                // dialog that deletes on a stray Enter is a dialog that
                // makes things worse than having no dialog.
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${PILL} ${PILL_DANGER}`}
                onClick={go}
                disabled={working}
              >
                {working && <SpinnerIcon size={14} className="animate-spin" />}
                {working ? 'Working…' : (request.action ?? 'Delete')}
              </button>
            </div>
          </footer>
        </div>
      )}
    </dialog>
  )
}
