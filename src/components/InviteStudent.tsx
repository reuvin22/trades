import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CloseIcon, UserPlusIcon } from './Icons'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { inviteStudent } from '../lib/university'
import {
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  MODAL,
  MODAL_BODY,
  MODAL_BUTTONS,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_FORM,
  MODAL_HEAD,
  MODAL_NARROW,
  MODAL_NOTE,
  MODAL_SUB,
  MODAL_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
} from './ui'

type InviteStudentProps = {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

/**
 * Invite a trader to your programme.
 *
 * By email address, because that is the only thing one trader can know about
 * another — the API takes an address and resolves it to an account itself, so
 * nothing here ever holds somebody else's uid.
 *
 * The invitation is pending until they accept. Nothing about their journal is
 * readable in the meantime, which is the whole point of it being an invitation
 * rather than an assignment.
 */
export function InviteStudent({ open, onClose, onInvited }: InviteStudentProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // <dialog> gives us the focus trap, backdrop and Esc handling for free.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])

  /** Close, and drop what was typed. Every exit comes through here. */
  function dismiss() {
    setEmail('')
    setNote('')
    setFailure(null)
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()

    const address = email.trim()
    if (address === '' || sending) return

    setSending(true)
    setFailure(null)

    try {
      await inviteStudent(address, note.trim())
      toast.success(`Invitation sent to ${address}.`)
      setEmail('')
      setNote('')
      onInvited()
    } catch (cause) {
      // Shown in the dialog rather than as a toast: the address that failed is
      // still in the field, and the answer belongs beside it.
      setFailure(readableApiError(cause))
    } finally {
      setSending(false)
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
      <form className={MODAL_FORM} onSubmit={submit}>
        <header className={MODAL_HEAD}>
          <div>
            <h2 className={MODAL_TITLE} id={titleId}>
              Invite a student
            </h2>
            <p className={MODAL_SUB}>
              They keep their own journal. Accepting lets you read it — nothing
              before that, and nothing you can write to.
            </p>
          </div>

          <button
            type="button"
            className={MODAL_CLOSE}
            onClick={dismiss}
            aria-label="Close"
          >
            <CloseIcon size={15} />
          </button>
        </header>

        <div className={MODAL_BODY}>
          <label className={FIELD}>
            <span className={FIELD_LABEL}>Their email address</span>
            <input
              value={email}
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              required
              placeholder="trader@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
            <span className={FIELD_HINT}>
              The address on their RagDex account. They have to already have one.
            </span>
          </label>

          <label className={FIELD}>
            <span className={FIELD_LABEL}>A note, optional</span>
            <input
              value={note}
              maxLength={300}
              placeholder="What the programme is, or where you know them from."
              onChange={(event) => setNote(event.target.value)}
            />
            <span className={FIELD_HINT}>
              Shown with the invitation. An invitation from a stranger with no note
              mostly gets declined.
            </span>
          </label>
        </div>

        <footer className={MODAL_FOOT}>
          <p className={MODAL_NOTE} role={failure === null ? undefined : 'alert'}>
            {failure ?? 'They can decline, and you will see that here.'}
          </p>

          <div className={MODAL_BUTTONS}>
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE}`}
              onClick={dismiss}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${PILL} ${PILL_ACCENT}`}
              disabled={sending || email.trim() === ''}
            >
              <UserPlusIcon size={15} />
              {sending ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
