import { useEffect, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from '../components/Icons'
import { ConfirmDialog, type ConfirmRequest } from '../components/ConfirmDialog'
import { QuestionBuilder } from '../components/QuestionBuilder'
import { RichTextEditor } from '../components/RichTextEditor'
import {
  ANSWER_PROMPT,
  CARD,
  DOC_BODY,
  DOC_FLAG,
  DOC_FLAG_TONE,
  DOC_GLYPH,
  DOC_LIST,
  DOC_ROW,
  DOC_ROW_LINK,
  DOC_SUB,
  DOC_TAIL,
  DOC_TITLE,
  EMPTY_BLOCK,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  MUTED_NOTE,
  PAGE_ACTIONS,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SAVE_BAR,
  SET_ABOUT,
  SET_GRID,
  SET_HEAD,
  SET_SECTION,
  SET_TITLE,
  SUB_A,
  SUB_ANSWER,
  SUB_Q,
  UNI_BACK,
  UNI_GHOST,
  UNI_LOADING,
  UNI_STUDENT_MAIL,
  UNI_STUDENT_NAME,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import {
  blankDocument,
  deleteDocument,
  fetchSubmissions,
  saveDocument,
  useDocuments,
  type Submission,
  type UniversityDocument,
} from '../lib/documents'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import type { Profile } from '../lib/profile'

/**
 * Agreements and forms, from the coach's side.
 *
 * One screen for both kinds, because they differ in one field — an agreement
 * carries prose, a form carries questions — and everything around that field
 * is the same: a title, a draft switch, and a list of who has completed it.
 *
 * Publishing is the gate. A draft never leaves the server, so a half-written
 * agreement is not something a student can stumble into; the switch is the
 * one deliberate act that puts a document in front of people.
 */
export function UniversityDocuments({ profile }: { profile: Profile | null }) {
  const isCoach = (profile?.accountType ?? 'individual') === 'coach'
  const state = useDocuments(isCoach ? (profile?.uid ?? null) : null)
  const [editing, setEditing] = useState<UniversityDocument | null>(null)
  const [reviewing, setReviewing] = useState<UniversityDocument | null>(null)

  if (!isCoach) {
    return (
      <>
        <Back />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Only a Coach account can create documents.</p>
        </section>
      </>
    )
  }

  if (editing !== null) {
    return (
      <Editor
        document={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          state.reload()
        }}
      />
    )
  }

  if (reviewing !== null) {
    return <Submissions document={reviewing} onClose={() => setReviewing(null)} />
  }

  return (
    <>
      <Back />

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Documents</h2>
          <p className={PAGE_SUB}>
            Agreements your students sign, and forms they answer. A draft is
            invisible to them until you publish it.
          </p>
        </div>

        <div className={PAGE_ACTIONS}>
          <button
            type="button"
            className={`${PILL} ${PILL_IDLE}`}
            onClick={() => setEditing(blankDocument('form'))}
          >
            <PlusIcon size={15} />
            New form
          </button>
          <button
            type="button"
            className={`${PILL} ${PILL_ACCENT}`}
            onClick={() => setEditing(blankDocument('agreement'))}
          >
            <PlusIcon size={15} />
            New agreement
          </button>
        </div>
      </div>

      {/*
        The gap that made invitations skip the form.
        
        A coach can publish a form and reasonably assume invited traders will
        be asked it — but nothing asks anybody until one form is marked as the
        intake form, and that switch lives two clicks away inside an editor.
        So the screen says so where the forms are.
      */}
      {!state.loading &&
        state.documents.some((entry) => entry.kind === 'form' && entry.published) &&
        !state.documents.some((entry) => entry.isIntake) && (
          <section className={`${CARD} ${SET_SECTION}`}>
            <p className={ANSWER_PROMPT}>No intake form is set</p>
            <p className={MUTED_NOTE} style={{ marginTop: 6 }}>
              Invited traders are not being asked anything — they see a plain
              Accept instead. Open a form and switch on{' '}
              <strong>Use as the intake form</strong> to have them answer it
              before you approve them.
            </p>
          </section>
        )}

      {state.error !== null && (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{state.error}</p>
        </section>
      )}

      {state.loading ? (
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading your documents…</p>
        </section>
      ) : state.documents.length === 0 ? (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Nothing yet.</p>
          <p className={MUTED_NOTE}>
            An agreement is prose somebody signs — a code of conduct, a risk
            disclosure. A form is questions somebody answers — what they trade, what
            they want from coaching.
          </p>
        </section>
      ) : (
        <div className={DOC_LIST}>
          {state.documents.map((document) => (
            <section key={document.id} className={CARD}>
              <div className={`${DOC_ROW} ${DOC_ROW_LINK}`}>
                <span className={DOC_GLYPH}>
                  {document.kind === 'agreement' ? '§' : '?'}
                </span>

                <span className={DOC_BODY}>
                  <span className={DOC_TITLE}>{document.title || 'Untitled'}</span>
                  <span className={DOC_SUB}>
                    {document.kind === 'agreement'
                      ? 'Agreement'
                      : `Form · ${document.questions.length} question${document.questions.length === 1 ? '' : 's'}`}
                    {document.required ? ' · required' : ' · optional'}
                    {document.isIntake && ' · intake form'}
                  </span>
                </span>

                <span className={DOC_TAIL}>
                  <span
                    className={`${DOC_FLAG} ${
                      document.published ? DOC_FLAG_TONE.published : DOC_FLAG_TONE.draft
                    }`}
                  >
                    {document.published ? 'Published' : 'Draft'}
                  </span>

                  <button
                    type="button"
                    className={UNI_GHOST}
                    onClick={() => setReviewing(document)}
                  >
                    {document.submissionCount ?? 0} completed
                  </button>

                  <button
                    type="button"
                    className={UNI_GHOST}
                    onClick={() => setEditing(document)}
                  >
                    Edit
                    <ChevronRightIcon size={14} />
                  </button>
                </span>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- editor */

function Editor({
  document,
  onClose,
  onSaved,
}: {
  document: UniversityDocument
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState(document)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null)
  const toast = useToast()

  function edit(patch: Partial<UniversityDocument>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function save() {
    if (draft.title.trim() === '') {
      toast.error('Give it a title first.')
      return
    }

    setSaving(true)
    try {
      await saveDocument(draft)
      toast.success(draft.published ? 'Published.' : 'Saved as a draft.')
      onSaved()
    } catch (cause) {
      toast.error('Could not save that', readableApiError(cause))
    } finally {
      setSaving(false)
    }
  }

  function remove() {
    if (draft.id === '') {
      onClose()
      return
    }

    setConfirming({
      title: `Delete “${draft.title || 'Untitled'}”?`,
      body:
        draft.kind === 'agreement'
          ? 'Students will no longer see this agreement.'
          : 'Students will no longer see this form.',
      consequence:
        draft.kind === 'agreement'
          ? 'Every signature on it is deleted too — including the record of what each person signed.'
          : 'Every answer anybody has given is deleted too.',
      onConfirm: async () => {
        await deleteDocument(draft.id)
        toast.success('Deleted.')
        onSaved()
      },
    })
  }

  return (
    <>
      <button type="button" className={UNI_BACK} onClick={onClose}>
        <ChevronLeftIcon size={15} />
        Documents
      </button>

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>
            {draft.kind === 'agreement' ? 'Agreement' : 'Form'}
          </h2>
          <p className={PAGE_SUB}>
            {draft.kind === 'agreement'
              ? 'Prose a student reads and signs. Their signature records what the text said at the time, so editing it afterwards is visible.'
              : 'Questions a student answers. Editing keeps the answers you already have — question ids survive a save.'}
          </p>
        </div>
      </div>

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SET_GRID}>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>Title</span>
              <input
                value={draft.title}
                maxLength={200}
                placeholder={
                  draft.kind === 'agreement' ? 'Code of conduct' : 'Starting questionnaire'
                }
                onChange={(event) => edit({ title: event.target.value })}
              />
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>One line about it</span>
              <input
                value={draft.summary}
                maxLength={400}
                placeholder="What it is for, in a sentence."
                onChange={(event) => edit({ summary: event.target.value })}
              />
            </label>
          </div>

          <div className={SET_GRID} style={{ marginTop: 16 }}>
            <Switch
              label="Required"
              hint="Shown to every student as outstanding until they complete it."
              on={draft.required}
              onToggle={() => edit({ required: !draft.required })}
            />
            <Switch
              label="Published"
              hint="Off, this is a draft and no student can see it — not even by guessing the address."
              on={draft.published}
              onToggle={() => edit({ published: !draft.published })}
            />

            {draft.kind === 'form' && (
              <Switch
                label="Use as the intake form"
                hint="The form an invited trader fills in before joining. Answering it puts them in your approval queue. Only one form can be the intake form — setting this clears it on any other."
                on={draft.isIntake}
                onToggle={() => edit({ isIntake: !draft.isIntake })}
              />
            )}
          </div>
        </div>
      </section>

      {draft.kind === 'agreement' ? (
        <section className={CARD}>
          <div className={SET_SECTION}>
            <div className={SET_HEAD}>
              <div>
                <h3 className={SET_TITLE}>What they are signing</h3>
                <p className={SET_ABOUT}>
                  The same editor as the invitation email, and the same allowlist on
                  save — a student reads this rendered in their browser, so the
                  markup is cleaned before it is ever stored.
                </p>
              </div>
            </div>

            <RichTextEditor
              value={draft.bodyHtml}
              onChange={(bodyHtml) => edit({ bodyHtml })}
              placeholder="The terms, the expectations, what they are agreeing to…"
            />
          </div>
        </section>
      ) : (
        <QuestionBuilder
          questions={draft.questions}
          onChange={(questions) => edit({ questions })}
        />
      )}

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SAVE_BAR}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={save}
              disabled={saving}
            >
              {saving && <SpinnerIcon size={14} className="animate-spin" />}
              {saving ? 'Saving…' : draft.published ? 'Save and publish' : 'Save draft'}
            </button>

            <button type="button" className={`${PILL} ${PILL_IDLE}`} onClick={onClose}>
              Cancel
            </button>

            {draft.id !== '' && (
              <button
                type="button"
                className={`${UNI_GHOST} ml-auto`}
                onClick={remove}
              >
                <TrashIcon size={14} />
                Delete, with every signature on it
              </button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog request={confirming} onClose={() => setConfirming(null)} />
    </>
  )
}

function Switch({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string
  hint: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className={FIELD}>
      <span className={FIELD_LABEL}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`${PILL} ${on ? PILL_ACCENT : PILL_IDLE}`}
        onClick={onToggle}
      >
        {on ? 'Yes' : 'No'}
      </button>
      <span className={FIELD_HINT}>{hint}</span>
    </div>
  )
}

/* ----------------------------------------------------------- submissions */

function Submissions({
  document,
  onClose,
}: {
  document: UniversityDocument
  onClose: () => void
}) {
  const [entries, setEntries] = useState<Submission[]>([])
  const [outstanding, setOutstanding] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abort = new AbortController()

    fetchSubmissions(document.id)
      .then((page) => {
        if (abort.signal.aborted) return
        setEntries(page.submissions)
        setOutstanding(page.outstanding)
        setLoaded(true)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoaded(true)
      })

    return () => abort.abort()
  }, [document.id])

  const prompts = new Map(document.questions.map((q) => [q.id, q.prompt]))

  return (
    <>
      <button type="button" className={UNI_BACK} onClick={onClose}>
        <ChevronLeftIcon size={15} />
        Documents
      </button>

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>{document.title}</h2>
          <p className={PAGE_SUB}>
            {entries.length} completed
            {outstanding.length > 0 && `, ${outstanding.length} outstanding`}.
          </p>
        </div>
      </div>

      {error !== null && (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{error}</p>
        </section>
      )}

      {outstanding.length > 0 && (
        <section className={CARD}>
          <div className={SET_SECTION}>
            <div className={SET_HEAD}>
              <div>
                <h3 className={SET_TITLE}>Still waiting on</h3>
                <p className={SET_ABOUT}>{outstanding.join(', ')}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {!loaded ? (
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading…</p>
        </section>
      ) : entries.length === 0 ? (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Nobody has completed this yet.</p>
        </section>
      ) : (
        entries.map((entry) => (
          <section key={entry.studentUid} className={CARD}>
            <div className={SET_SECTION}>
              <div className={SET_HEAD}>
                <div>
                  <span className={UNI_STUDENT_NAME}>
                    {entry.studentName || entry.studentEmail || entry.studentUid}
                  </span>
                  <span className={UNI_STUDENT_MAIL}>
                    {entry.submittedAt?.toLocaleString('en-GB') ?? ''}
                  </span>
                </div>
              </div>

              {document.kind === 'agreement' ? (
                <>
                  <p className={ANSWER_PROMPT}>Signed as &ldquo;{entry.signedName}&rdquo;</p>
                  <p className={MUTED_NOTE}>
                    {/*
                      The digest is what makes a signature evidence of something
                      specific rather than of whatever the document says today.
                    */}
                    {entry.documentDigest === ''
                      ? 'No digest recorded.'
                      : `Signed against ${entry.documentDigest.slice(0, 12)}…`}
                  </p>
                </>
              ) : (
                <div>
                  {entry.answers.map((answer) => (
                    <div key={answer.questionId} className={SUB_ANSWER}>
                      <span className={SUB_Q}>
                        {prompts.get(answer.questionId) ?? 'A question since removed'}
                      </span>
                      <span className={SUB_A}>
                        {answer.values.length > 0
                          ? answer.values.join(', ')
                          : answer.value || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))
      )}
    </>
  )
}

function Back() {
  return (
    <button type="button" className={UNI_BACK} onClick={() => navigate('university')}>
      <ChevronLeftIcon size={15} />
      My University
    </button>
  )
}
