import { useEffect, useState } from 'react'
import { CheckCircleIcon, CheckIcon, SpinnerIcon } from '../components/Icons'
import {
  ACTION_ROW_WIDE,
  CARD,
  EMPTY_BLOCK,
  MUTED_NOTE,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SET_SECTION,
  STEP_DONE,
  STEP_KIND,
  STEP_LIST,
  STEP_NUMBER,
  STEP_ROW,
  STEP_TITLE,
  UNI_INVITE_NOTE,
  UNI_LOADING,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import { fetchIntake, fetchNextDocument, submitDocuments, type Intake } from '../lib/university'

/**
 * The signing run: work through what the program asks for, then join.
 *
 * A relay for as long as there is something to open — it asks the API what is
 * next and goes there, and every document comes back here when it is
 * submitted. When nothing is left it stops being a relay and becomes the last
 * step: a button that submits the lot.
 *
 * **Finishing the documents does not enrol anybody.** That used to happen on
 * the last signature, which meant somebody could be enrolled by a submission
 * they did not realise was the last one — and, worse, by submissions left
 * over from a previous enrolment, before they had agreed to anything this
 * time round. Joining is now one deliberate act, taken here.
 */
export function SigningRun() {
  const toast = useToast()

  const [ready, setReady] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [intake, setIntake] = useState<Intake | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const abort = new AbortController()

    fetchNextDocument()
      .then(async (next) => {
        if (abort.signal.aborted) return

        if (next.documentId !== '') {
          navigate(`university/doc/${next.documentId}`)
          return
        }

        if (next.enrolled) {
          setEnrolled(true)
          return
        }

        if (next.readyToSubmit) {
          // The list is fetched only at this point, because it is only at
          // this point that anybody has to read it.
          setIntake(await fetchIntake())
          setReady(true)
          return
        }

        setEnrolled(false)
        setReady(false)
      })
      .catch((cause: unknown) => {
        if (!abort.signal.aborted) setError(readableApiError(cause))
      })

    return () => abort.abort()
  }, [])

  async function submit() {
    setSending(true)
    try {
      const result = await submitDocuments()
      toast.success(String(result.message ?? 'You are enrolled.'))
      setEnrolled(true)
      setReady(false)
    } catch (cause) {
      toast.error('Could not submit those', readableApiError(cause))
    } finally {
      setSending(false)
    }
  }

  if (error !== null) {
    return (
      <>
        <Head title="Something went wrong" sub="We could not work out what is next." />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{error}</p>
          <p className={MUTED_NOTE}>
            <Go label="Go to My University" />
          </p>
        </section>
      </>
    )
  }

  if (enrolled) {
    return (
      <>
        <Head title="You are enrolled" sub="Everything is submitted." />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>
            <CheckCircleIcon size={18} /> Welcome in.
          </p>
          <p className={MUTED_NOTE}>
            Your coach can now see your journal and review your trades with you.
          </p>
          <p className={MUTED_NOTE}>
            <Go label="Open My University" />
          </p>
        </section>
      </>
    )
  }

  if (!ready) {
    return (
      <section className={CARD}>
        <p className={UNI_LOADING}>Finding what is next…</p>
      </section>
    )
  }

  return (
    <>
      <Head
        title="Everything is complete"
        sub="One last step — submit them and you are in."
      />

      <section className={`${CARD} ${SET_SECTION}`}>
        <p className={UNI_INVITE_NOTE}>
          You have finished everything{' '}
          {intake?.universityName.trim() || 'the program'} asks for. Nothing has been
          submitted yet, and you are not enrolled until you do.
        </p>

        {intake !== null && intake.steps.length > 0 && (
          <div className={STEP_LIST}>
            {intake.steps.map((step) => (
              <div key={step.id} className={STEP_ROW}>
                <span className={`${STEP_NUMBER} ${STEP_DONE}`}>
                  <CheckIcon size={12} />
                </span>
                <span className={STEP_TITLE}>{step.title}</span>
                <span className={STEP_KIND}>Done</span>
              </div>
            ))}
          </div>
        )}

        <p className={ACTION_ROW_WIDE}>
          <button
            type="button"
            className={`${PILL} ${PILL_ACCENT}`}
            onClick={submit}
            disabled={sending}
          >
            {sending ? (
              <SpinnerIcon size={14} className="animate-spin" />
            ) : (
              <CheckCircleIcon size={15} />
            )}
            {sending ? 'Submitting…' : 'Submit documents'}
          </button>

          <button
            type="button"
            className={`${PILL} ${PILL_IDLE}`}
            onClick={() => navigate('university')}
            disabled={sending}
          >
            Not yet
          </button>
        </p>
      </section>
    </>
  )
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={PAGE_HEAD}>
      <div>
        <h2 className={PAGE_TITLE}>{title}</h2>
        <p className={PAGE_SUB}>{sub}</p>
      </div>
    </div>
  )
}

function Go({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={`${PILL} ${PILL_ACCENT}`}
      onClick={() => navigate('university')}
    >
      {label}
    </button>
  )
}
