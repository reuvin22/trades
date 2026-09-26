import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  SpinnerIcon,
} from '../components/Icons'
import {
  ACTION_ROW,
  CARD,
  EMPTY_BLOCK,
  MUTED_NOTE,
  NOTE_AFTER,
  NOTE_AFTER_WIDE,
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
  UNI_COACH_BODY,
  UNI_COACH_CARD,
  UNI_COACH_NAME,
  UNI_COACH_NOTE,
  UNI_COACH_ROLE,
  UNI_INVITE_NOTE,
  UNI_LOADING,
} from '../components/ui'
import { accentFor, initialsFor } from '../data/messages'
import { COMM_AVATAR, COMM_AVATAR_FACE } from '../components/ui'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import {
  declineInvitation,
  startEnrolment,
  fetchIntake,
  nameOf,
  type Intake,
} from '../lib/university'
import type { Profile } from '../lib/profile'

/**
 * Where the invitation email lands.
 *
 * Not My University — a recipient is not a student yet, and sending them to a
 * roster they are not on was the bug. This resolves everything from the
 * session rather than from the URL, so the link in every email is identical
 * and cannot be edited into somebody else's invitation.
 *
 * What it shows depends on how far the invitation has got:
 *
 *   * **pending** — the coach's intake form, or a plain accept button when
 *     they have not set one;
 *   * **applied** — waiting on the coach, with nothing to do;
 *   * **active**  — already in, so it steps aside to My University;
 *   * nothing open — an explanation rather than an error, because somebody
 *     may simply have followed an old link.
 */
export function JoinUniversity({ profile }: { profile: Profile | null }) {
  const toast = useToast()

  const [intake, setIntake] = useState<Intake | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const abort = new AbortController()

    fetchIntake()
      .then((found) => {
        if (abort.signal.aborted) return
        setIntake(found)
        setLoaded(true)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoaded(true)
      })

    return () => abort.abort()
  }, [])

  async function answer(accept: boolean) {
    if (intake === null || accept) return

    setBusy(true)
    try {
      await declineInvitation(intake.coachUid)
      toast.info('Invitation declined.')
      navigate('university')
    } catch (cause) {
      toast.error('Could not decline that', readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  /**
   * Open the way in.
   *
   * With a form, that is the form. Without one, the program's documents — and
   * the API has to be told to open them, because an invitation nobody has
   * acted on does not yet permit reading them.
   */
  async function begin() {
    if (intake === null) return

    if (intake.documentId !== '') {
      navigate(`university/doc/${intake.documentId}`)
      return
    }

    setBusy(true)
    try {
      // The message comes back from the call that settled the enrolment, so
      // it says what actually happened rather than asserting "you joined".
      const result = await startEnrolment(intake.coachUid)
      toast.success(String(result.message ?? 'Opened.'))
      navigate('university/next')
    } catch (cause) {
      toast.error('Could not open that', readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  if (!loaded) {
    return (
      <section className={CARD}>
        <p className={UNI_LOADING}>Looking for your invitation…</p>
      </section>
    )
  }

  if (error !== null) {
    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>{error}</p>
      </section>
    )
  }

  if (intake === null || intake.status === null || intake.status === 'declined') {
    return (
      <>
        <Head title="Nothing waiting" sub="No invitation is open on this account." />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>There is no invitation waiting for you.</p>
          <p className={MUTED_NOTE}>
            It may already have been answered, or the invitation may have gone to a
            different email address than the one this account uses
            {profile?.email ? ` (${profile.email})` : ''}.
          </p>
          <p className={MUTED_NOTE}>
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE}`}
              onClick={() => navigate('university')}
            >
              Go to My University
            </button>
          </p>
        </section>
      </>
    )
  }

  const where = intake.universityName.trim() || nameOf(intake.coachName, intake.coachEmail)

  if (intake.status === 'active') {
    return (
      <>
        <Head title="You are already in" sub={`You joined ${where}.`} />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Nothing to do here.</p>
          <p className={MUTED_NOTE}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={() => navigate('university')}
            >
              Open My University
            </button>
          </p>
        </section>
      </>
    )
  }

  if (intake.status === 'documents') {
    const left = intake.outstanding
    const total = intake.requiredTotal

    return (
      <>
        <Head
          title="You are approved"
          sub={`${nameOf(intake.coachName, intake.coachEmail)} accepted your application.`}
        />
        <section className={`${CARD} ${SET_SECTION}`}>
          <p className={UNI_COACH_ROLE}>
            <CheckCircleIcon size={14} /> {left} of {total} left to sign
          </p>
          <p className={`${UNI_INVITE_NOTE} ${NOTE_AFTER}`}>
            One step left. {where} asks every member to sign{' '}
            {total === 1 ? 'a document' : `${total} documents`} before joining —
            you are enrolled the moment the last one is signed, with nothing
            further to wait for.
          </p>
          <p className={ACTION_ROW}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={() => navigate('university')}
            >
              Open the documents
            </button>
          </p>
        </section>
      </>
    )
  }

  if (intake.status === 'applied') {
    return (
      <>
        <Head
          title="Waiting on your coach"
          sub={`Your answers are with ${nameOf(intake.coachName, intake.coachEmail)}.`}
        />
        <section className={`${CARD} ${SET_SECTION}`}>
          <p className={UNI_COACH_ROLE}>
            <ClockIcon size={14} /> Pending approval
          </p>
          <p className={`${UNI_INVITE_NOTE} ${NOTE_AFTER}`}>
            You have answered the form for {where}. Nothing else is needed from you —
            when your coach approves it, the documents they want signed appear on
            your My University screen.
          </p>
          <p className={`${MUTED_NOTE} ${NOTE_AFTER_WIDE}`}>
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE}`}
              onClick={() => navigate('university')}
            >
              Go to My University
            </button>
          </p>
        </section>
      </>
    )
  }

  // pending: the form if there is one, otherwise straight to the documents.
  // There is no "accept" — finishing what the program asks for is what
  // joining means, and the enrolment completes on the last signature.
  return (
    <>
      <Head
        title={`Join ${where}`}
        sub={`${nameOf(intake.coachName, intake.coachEmail)} invited you.`}
      />

      <section className={`${CARD} ${UNI_COACH_CARD}`}>
        <span className={COMM_AVATAR} style={{ width: 52, height: 52 }}>
          <span
            className={COMM_AVATAR_FACE}
            style={{ background: accentFor(intake.coachUid), fontSize: 18 }}
          >
            {initialsFor(nameOf(intake.coachName, intake.coachEmail), '')}
          </span>
        </span>

        <div className={UNI_COACH_BODY}>
          <span className={UNI_COACH_ROLE}>Your invitation</span>
          <h3 className={UNI_COACH_NAME}>{where}</h3>
          <p className={UNI_COACH_NOTE}>
            {intake.note || 'They did not leave a note.'}
          </p>
        </div>
      </section>

      <section className={`${CARD} ${SET_SECTION}`}>
        <p className={UNI_INVITE_NOTE}>
          {intake.documentId !== ''
            ? `${nameOf(intake.coachName, intake.coachEmail)} asks everyone a few questions first. Your answers go to them for review — you join once they have approved you and signed what ${where} asks for.`
            : `Here is what ${where} asks for. You are not joined until the last one is done, and you can stop at any point.`}
        </p>

        {/*
          What "Review" actually reviews.
          
          The screen used to show a coach's name and a button, which is not a
          review of anything. This lists what the program asks for, in the
          order it will be asked — forms first, then the agreements — so
          somebody deciding whether to join can see what joining involves
          before they start rather than discovering it one page at a time.
        */}
        {intake.steps.length > 0 && (
          <div className={STEP_LIST}>
            {intake.steps.map((step, index) => (
              <div key={step.id} className={STEP_ROW}>
                <span className={`${STEP_NUMBER} ${step.done ? STEP_DONE : ''}`}>
                  {step.done ? <CheckIcon size={12} /> : index + 1}
                </span>
                <span className={STEP_TITLE}>{step.title}</span>
                <span className={STEP_KIND}>
                  {step.done
                    ? 'Done'
                    : step.kind === 'form'
                      ? 'Answer'
                      : 'Sign'}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className={ACTION_ROW}>
          <button
            type="button"
            className={`${PILL} ${PILL_ACCENT}`}
            onClick={begin}
            disabled={busy}
          >
            {busy ? (
              <SpinnerIcon size={14} className="animate-spin" />
            ) : (
              <CheckCircleIcon size={15} />
            )}
            {intake.documentId !== '' ? 'Answer the form' : 'Review the documents'}
          </button>

          {/*
            Declining stays. Removing the accept step does not mean somebody
            has to join — it means joining is the result of finishing, rather
            than of a button that skipped it.
          */}
          <button
            type="button"
            className={`${PILL} ${PILL_IDLE}`}
            onClick={() => answer(false)}
            disabled={busy}
          >
            Decline
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
