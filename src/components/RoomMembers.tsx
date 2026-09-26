import { useEffect, useId, useRef, useState } from 'react'
import { CloseIcon } from './Icons'
import { accentFor, initialsFor } from '../data/messages'
import { memberLabel, type ChatGroup } from '../lib/groups'
import {
  ASK_ROW,
  ASK_ROW_TEXT,
  MEMBER_ACTION,
  MEMBER_ACTIONS,
  MEMBER_BODY,
  MEMBER_DANGER,
  MEMBER_EDIT,
  MEMBER_EDIT_INPUT,
  MEMBER_FACE,
  MEMBER_LIST,
  MEMBER_NAME,
  MEMBER_NOTE,
  MEMBER_REAL,
  MEMBER_ROW,
  MEMBER_YOU,
  MODAL,
  MODAL_BODY,
  MODAL_CLOSE,
  MODAL_HEAD,
  MODAL_NARROW,
  MODAL_SHELL,
  MODAL_SUB,
  MODAL_TITLE,
} from './ui'

type RoomMembersProps = {
  /** Null closes the dialog. */
  room: ChatGroup | null
  /** The signed-in uid, so one row can be marked as you and kept unremovable. */
  meUid: string | null
  onClose: () => void
  onNickname: (uid: string, nickname: string) => void
  onRemove: (uid: string) => void
}

/**
 * Who is in a room, and what they are called in it.
 *
 * Opened from the member count in the room header rather than shown in the
 * panel body. A roster is something you go and look at once; the body belongs
 * to the conversation.
 *
 * A nickname is set for the whole room, not for the person setting it — so
 * this is a shared edit, and like everything else about rooms it is currently
 * only in this session's memory. `lib/groups.ts` says what that will take.
 */
export function RoomMembers({
  room,
  meUid,
  onClose,
  onNickname,
  onRemove,
}: RoomMembersProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  /** The uid whose nickname is being edited, and the text so far. */
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  /**
   * The uid being removed, while the row asks whether to.
   *
   * Confirmed on the row rather than in a second dialog. This list is already
   * a modal, and a modal over a modal hides the thing being confirmed — which
   * here is the name of the person about to be removed.
   */
  const [removing, setRemoving] = useState<string | null>(null)

  // <dialog> gives us the focus trap, backdrop and Esc handling for free.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (room && !node.open) node.showModal()
    else if (!room && node.open) node.close()
  }, [room])

  /**
   * Close, and drop anything half-typed.
   *
   * Done here rather than in an effect watching the room: every way out — the
   * button, Escape, the backdrop — comes through this one function, so there
   * is nothing for an effect to catch that this does not.
   */
  function dismiss() {
    setEditing(null)
    setDraft('')
    setRemoving(null)
    onClose()
  }

  function startEdit(uid: string, current: string) {
    setEditing(uid)
    setDraft(current)
  }

  function commit(uid: string) {
    onNickname(uid, draft)
    setEditing(null)
    setDraft('')
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
        // A click that lands on the dialog itself is a click on the backdrop.
        if (event.target === dialog.current) dismiss()
      }}
    >
      {room && (
        <div className={MODAL_SHELL}>
          <header className={MODAL_HEAD}>
            <div>
              <h2 className={MODAL_TITLE} id={titleId}>
                Members
              </h2>
              <p className={MODAL_SUB}>
                {room.members.length}{' '}
                {room.members.length === 1 ? 'person' : 'people'} in {room.name}.
              </p>
            </div>

            <button
              type="button"
              className={MODAL_CLOSE}
              onClick={dismiss}
              aria-label="Close members"
            >
              <CloseIcon size={15} />
            </button>
          </header>

          <div className={MODAL_BODY}>
            <div>
              <p className={MEMBER_NOTE}>
                A nickname is set for the whole conversation — everyone in the room
                sees it, not just you.
              </p>

              <div className={MEMBER_LIST}>
                {room.members.map((member) => {
                  const label = memberLabel(member)
                  const nicknamed = label !== member.name
                  const isMe = member.uid === meUid

                  if (editing === member.uid) {
                    return (
                      <div key={member.uid} className={MEMBER_ROW}>
                        <span
                          className={MEMBER_FACE}
                          style={{ background: accentFor(member.uid) }}
                          aria-hidden="true"
                        >
                          {initialsFor(member.name, '')}
                        </span>

                        <div className={MEMBER_EDIT}>
                          <input
                            className={MEMBER_EDIT_INPUT}
                            value={draft}
                            autoFocus
                            maxLength={40}
                            placeholder={member.name}
                            aria-label={`Nickname for ${member.name}`}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') commit(member.uid)
                              if (event.key !== 'Escape') return
                              // Back out of the field, not out of the dialog.
                              event.stopPropagation()
                              setEditing(null)
                            }}
                          />
                          <button
                            type="button"
                            className={MEMBER_ACTION}
                            onClick={() => commit(member.uid)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className={MEMBER_ACTION}
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={member.uid} className={MEMBER_ROW}>
                      <span
                        className={MEMBER_FACE}
                        style={{ background: accentFor(member.uid) }}
                        aria-hidden="true"
                      >
                        {initialsFor(member.name, '')}
                      </span>

                      <span className={MEMBER_BODY}>
                        <span className={MEMBER_NAME}>{label}</span>
                        {nicknamed && (
                          <span className={MEMBER_REAL}>{member.name}</span>
                        )}
                      </span>

                      {isMe && <span className={MEMBER_YOU}>You</span>}

                      {removing === member.uid ? (
                        <span className={ASK_ROW}>
                          <span className={ASK_ROW_TEXT}>Remove {label}?</span>
                          <button
                            type="button"
                            className={MEMBER_ACTION}
                            onClick={() => setRemoving(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={`${MEMBER_ACTION} ${MEMBER_DANGER}`}
                            onClick={() => {
                              setRemoving(null)
                              onRemove(member.uid)
                            }}
                          >
                            Remove
                          </button>
                        </span>
                      ) : (
                        <span className={MEMBER_ACTIONS}>
                          <button
                            type="button"
                            className={MEMBER_ACTION}
                            onClick={() =>
                              startEdit(member.uid, member.nickname ?? '')
                            }
                          >
                            {nicknamed ? 'Edit nickname' : 'Nickname'}
                          </button>

                          {/*
                            You cannot remove yourself. Leaving a room is a
                            different act with a different consequence — it ends
                            your access rather than someone else's — and it needs
                            its own confirmation rather than sharing this button.
                          */}
                          {!isMe && (
                            <button
                              type="button"
                              className={`${MEMBER_ACTION} ${MEMBER_DANGER}`}
                              onClick={() => setRemoving(member.uid)}
                            >
                              Remove
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
