import { useEffect, useState } from 'react'
import { CheckIcon, ChevronLeftIcon, SpinnerIcon } from '../components/Icons'
import {
  ANSWER_BLOCK,
  ANSWER_HELP,
  ANSWER_LIST,
  ANSWER_OPTION,
  ANSWER_OPTIONS,
  ANSWER_PROMPT,
  ANSWER_REQUIRED,
  ANSWER_SCALE,
  ANSWER_SCALE_STEP,
  CARD,
  DOC_FLAG,
  DOC_FLAG_TONE,
  DOC_PROSE,
  EMPTY_BLOCK,
  MUTED_NOTE,
  NOTE_AFTER,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  SAVE_BAR,
  SET_SECTION,
  SIGN_BOX,
  SIGN_INPUT,
  SIGN_LABEL,
  SIGN_NOTE,
  UNI_BACK,
  UNI_LOADING,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import {
  SCALE_MAX,
  SCALE_MIN,
  fetchDocument,
  submitDocument,
  type Answer,
  type Question,
  type UniversityDocument,
} from '../lib/documents'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import { nameOf } from '../lib/university'
import type { Profile } from '../lib/profile'

/**
 * One document, from the student's side: read it, then sign or answer it.
 *
 * The API decides whether this can be opened at all — a document is readable
 * only if it is published and its author is a coach this account has an active
 * enrolment with. A 404 here is the same answer a stranger gets, which is the
 * point: it does not confirm that the document exists.
 *
 * Nothing sent from here says who it is from. The uid comes from the session
 * and the document from the path, so a submission is evidence of a specific
 * person completing a specific thing rather than a claim about both.
 */
export function StudentDocument({
  id,
  profile,
}: {
  id: string
  profile: Profile | null
}) {
  const toast = useToast()

  const [document, setDocument] = useState<UniversityDocument | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signed, setSigned] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const abort = new AbortController()

    fetchDocument(id)
      .then((found) => {
        if (abort.signal.aborted) return
        setDocument(found)
        setLoaded(true)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoaded(true)
      })

    return () => abort.abort()
  }, [id])

  function setAnswer(questionId: string, patch: Partial<Answer>) {
    setAnswers((current) => ({
      ...current,
      // Defaults first, then whatever is already held, then the change —
      // spelling the base out after `current` would blank a field the caller
      // did not mean to touch.
      [questionId]: {
        ...{ questionId, value: '', values: [] },
        ...current[questionId],
        ...patch,
      },
    }))
  }

  async function submit() {
    if (document === null) return

    setSending(true)
    try {
      await submitDocument(document.id, signed, Object.values(answers))

      /*
       * Back to the relay, which finds the next one.
       *
       * Except for the intake form: answering that is the application, and
       * what follows is the coach's decision rather than another document —
       * so it goes back to the join screen, which says so.
       */
      if (document.isIntake) {
        toast.success('Answers sent.', 'Your coach reviews them before you join.')
        navigate('university/join')
        return
      }

      toast.success(
        document.kind === 'agreement' ? 'Signed.' : 'Answers sent.',
        'Your coach can see it now.',
      )
      navigate('university/next')
    } catch (cause) {
      toast.error('Could not send that', readableApiError(cause))
    } finally {
      setSending(false)
    }
  }

  if (!loaded) {
    return (
      <>
        <Back />
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading…</p>
        </section>
      </>
    )
  }

  if (error !== null || document === null) {
    return (
      <>
        <Back />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{error ?? 'No such document.'}</p>
          <p className={MUTED_NOTE}>
            You can only open documents your coach has published to you.
          </p>
        </section>
      </>
    )
  }

  const done = document.submittedAt !== null

  return (
    <>
      <Back />

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>{document.title}</h2>
          <p className={PAGE_SUB}>
            {document.summary ||
              (document.kind === 'agreement'
                ? 'Read this, then sign it below.'
                : 'Answer the questions below.')}
          </p>
        </div>
      </div>

      {done && (
        <section className={`${CARD} ${SET_SECTION}`}>
          <span className={`${DOC_FLAG} ${DOC_FLAG_TONE.done}`}>
            Completed {document.submittedAt?.toLocaleDateString('en-GB')}
          </span>
          <p className={`${MUTED_NOTE} ${NOTE_AFTER}`}>
            Sending it again replaces what your coach has, rather than adding to it.
          </p>
        </section>
      )}

      {document.kind === 'agreement' ? (
        <>
          <section className={CARD}>
            <div className={SET_SECTION}>
              {/*
                Sanitised server-side against an allowlist before it was ever
                stored — the same one the invitation email goes through. This
                is another account's markup rendering in this browser, which is
                exactly the case that allowlist exists for.
              */}
              <div
                className={DOC_PROSE}
                dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
              />
            </div>
          </section>

          <section className={CARD}>
            <div className={SET_SECTION}>
              <div className={SIGN_BOX}>
                <span className={SIGN_LABEL}>Sign by typing your name</span>
                <input
                  className={SIGN_INPUT}
                  value={signed}
                  maxLength={200}
                  placeholder={nameOf(
                    profile?.displayName ?? '',
                    profile?.email ?? '',
                  )}
                  aria-label="Your name, as a signature"
                  onChange={(event) => setSigned(event.target.value)}
                />
                <span className={SIGN_NOTE}>
                  Your name, the time, and a fingerprint of this text are recorded
                  together. If the document is edited afterwards, the fingerprint no
                  longer matches — so what you signed stays what you signed.
                </span>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className={CARD}>
          <div className={SET_SECTION}>
            <div className={ANSWER_LIST}>
              {document.questions.map((question) => (
                <Field
                  key={question.id}
                  question={question}
                  answer={answers[question.id]}
                  onChange={(patch) => setAnswer(question.id, patch)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SAVE_BAR}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={submit}
              disabled={sending || (document.kind === 'agreement' && signed.trim() === '')}
            >
              {sending ? (
                <SpinnerIcon size={14} className="animate-spin" />
              ) : (
                <CheckIcon size={14} />
              )}
              {document.kind === 'agreement' ? 'Sign and send' : 'Send my answers'}
            </button>

            <span className={MUTED_NOTE}>
              Your coach sees this. Nobody else on the platform does.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ parts */

function Field({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: Answer | undefined
  onChange: (patch: Partial<Answer>) => void
}) {
  const value = answer?.value ?? ''
  const values = answer?.values ?? []

  return (
    <div className={ANSWER_BLOCK}>
      <span className={ANSWER_PROMPT}>
        {question.prompt}
        {question.required && (
          <span className={ANSWER_REQUIRED} aria-label="required">
            *
          </span>
        )}
      </span>

      {question.helpText !== '' && (
        <span className={ANSWER_HELP}>{question.helpText}</span>
      )}

      {question.type === 'short_text' && (
        <input
          value={value}
          maxLength={4000}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      )}

      {question.type === 'long_text' && (
        <textarea
          value={value}
          rows={4}
          maxLength={4000}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      )}

      {question.type === 'single_choice' && (
        <div className={ANSWER_OPTIONS}>
          {question.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={ANSWER_OPTION}
              aria-pressed={value === choice}
              onClick={() => onChange({ value: choice, values: [] })}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi_choice' && (
        <div className={ANSWER_OPTIONS}>
          {question.choices.map((choice) => {
            const on = values.includes(choice)

            return (
              <button
                key={choice}
                type="button"
                className={ANSWER_OPTION}
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    value: '',
                    values: on
                      ? values.filter((entry) => entry !== choice)
                      : [...values, choice],
                  })
                }
              >
                {choice}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'scale' && (
        <div className={ANSWER_SCALE}>
          {Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, step) => {
            const number = String(SCALE_MIN + step)

            return (
              <button
                key={number}
                type="button"
                className={ANSWER_SCALE_STEP}
                aria-pressed={value === number}
                onClick={() => onChange({ value: number, values: [] })}
              >
                {number}
              </button>
            )
          })}
        </div>
      )}
    </div>
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
