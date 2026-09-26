import { useEffect, useMemo, useState } from 'react'
import { ChatIcon, ChevronRightIcon, UserPlusIcon } from '../components/Icons'
import { InviteStudent } from '../components/InviteStudent'
import { accentFor, initialsFor } from '../data/messages'
import {
  CARD,
  COMM_AVATAR,
  DOC_BODY,
  DOC_FLAG,
  DOC_FLAG_TONE,
  DOC_GLYPH,
  DOC_LIST,
  DOC_ROW,
  DOC_ROW_LINK,
  DOC_SUB,
  DOC_TAIL,
  PANEL_TITLE,
  UNI_CARD_HEAD,
  COMM_AVATAR_FACE,
  EMPTY_BLOCK,
  MONO,
  MUTED_NOTE,
  NEG,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  POS,
  ROW,
  STAT_CARD,
  STAT_LABEL,
  STAT_ROW,
  STAT_VALUE,
  TABLE,
  TABLE_WRAP,
  TD,
  TH,
  UNI_BAND,
  UNI_BAND_ACTIONS,
  UNI_BAND_BODY,
  UNI_BAND_NAME,
  UNI_BAND_SUB,
  UNI_COACH_BODY,
  UNI_COACH_CARD,
  UNI_COACH_NAME,
  UNI_COACH_NOTE,
  UNI_COACH_ROLE,
  UNI_GHOST,
  UNI_INVITE,
  UNI_INVITE_ACTIONS,
  UNI_INVITE_BODY,
  UNI_INVITE_NOTE,
  UNI_INVITE_WHO,
  UNI_LOADING,
  UNI_NAME_BUTTON,
  UNI_ROW_ACTIONS,
  UNI_ROW_LINK,
  UNI_STATUS,
  UNI_STATUS_TONE,
  UNI_STUDENT,
  UNI_STUDENT_MAIL,
  UNI_STUDENT_NAME,
  UNI_TAB,
  UNI_TAB_ACTIVE,
  UNI_TABS,
} from '../components/ui'
import { moneyIn } from '../lib/journalStats'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import {
  declineInvitation,
  decideApplication,
  fetchApplications,
  endEnrolment,
  nameOf,
  useUniversity,
  type Application,
  type Invitation,
  type SentInvite,
  type Student,
} from '../lib/university'
import { readableApiError } from '../lib/api'
import { ConfirmDialog, type ConfirmRequest } from '../components/ConfirmDialog'
import { useDocuments } from '../lib/documents'
import { useInbox, type Inbox } from '../lib/university'
import type { Profile } from '../lib/profile'

/**
 * The teaching side of the account, on real data.
 *
 * Which screen this is still depends on `account_type` — the plan is what
 * somebody is billed as, the account type is what they are here as — but the
 * contents now come from `/api/v1/university`. Every figure on a student is
 * computed by the service from that student's journal; none of it is derived
 * in the browser and none of it is sent.
 *
 * Invitations sit above all of it regardless of account type. Being asked to
 * join a program is not something only students can have happen to them:
 * an individual account is exactly who a coach invites.
 */
export function MyUniversity({ profile }: { profile: Profile | null }) {
  const accountType = profile?.accountType ?? 'individual'
  const state = useUniversity(profile?.uid ?? null)
  const inbox = useInbox(profile?.uid ?? null)
  const toast = useToast()

  /** Declining only. Joining goes through the join screen. */
  async function answer(coachUid: string, accept: boolean) {
    if (accept) {
      navigate('university/join')
      return
    }

    try {
      await declineInvitation(coachUid)
      toast.info('Invitation declined.')
      state.reload()
    } catch (cause) {
      toast.error('Could not decline that invitation', readableApiError(cause))
    }
  }

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>My University</h2>
          <p className={PAGE_SUB}>
            {accountType === 'coach'
              ? 'The traders you are teaching, what they have logged, and who has yet to answer. Open anyone to see their whole record.'
              : 'Who is teaching you, and anything waiting on your answer.'}
          </p>
        </div>
      </div>

      {state.error !== null && (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{state.error}</p>
        </section>
      )}

      {state.invitations.map((invitation) => (
        <InvitationCard
          key={invitation.coachUid}
          invitation={invitation}
          onAnswer={answer}
        />
      ))}

      {accountType !== 'coach' && (
        <Waiting
          uid={profile?.uid ?? null}
          signing={inbox.intake.status === 'documents'}
        />
      )}

      {accountType === 'coach' && (
        <CoachView profile={profile} state={state} inbox={inbox} />
      )}
      {accountType !== 'coach' && <TraderView state={state} intake={inbox.intake} />}
    </>
  )
}

type State = ReturnType<typeof useUniversity>

/* ------------------------------------------------------------- coach view */

function CoachView({
  profile,
  state,
  inbox,
}: {
  profile: Profile | null
  state: State
  inbox: Inbox
}) {
  const [tab, setTab] = useState<
    'students' | 'applications' | 'signing' | 'invites'
  >('students')
  const [applications, setApplications] = useState<Application[]>([])
  const [inviting, setInviting] = useState(false)
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null)
  const toast = useToast()

  const { students, sent } = state

  /*
   * Fetched here rather than in `useUniversity`, because only a coach has an
   * approval queue — putting it in the shared hook would make every student's
   * My University call an endpoint that always answers empty for them.
   */
  useEffect(() => {
    const abort = new AbortController()

    fetchApplications()
      .then((found) => {
        if (!abort.signal.aborted) setApplications(found)
      })
      // Silent: a failed queue should not replace a working roster with an
      // error. It reappears on the next load.
      .catch(() => undefined)

    return () => abort.abort()
  }, [state.students])

  async function decide(application: Application, approve: boolean) {
    try {
      await decideApplication(application.studentUid, approve)
      toast.success(
        approve
          ? `${nameOf(application.studentName, application.studentEmail)} is enrolled.`
          : 'Application turned down.',
        approve ? 'Your required documents are now waiting for them.' : undefined,
      )
      setApplications((current) =>
        current.filter((entry) => entry.studentUid !== application.studentUid),
      )
      state.reload()
    } catch (cause) {
      toast.error('Could not do that', readableApiError(cause))
    }
  }

  const graded = students.filter((student) => student.ruleScore !== null)
  const meanDiscipline =
    graded.length === 0
      ? null
      : Math.round(
          graded.reduce((total, student) => total + (student.ruleScore ?? 0), 0) /
            graded.length,
        )
  const cohortPl = students.reduce((total, student) => total + student.netPl, 0)
  // Only genuinely unanswered ones. A row that has moved on is counted by
  // the stat that describes where it moved to.
  const pending = sent.filter((invite) => invite.status === 'pending').length

  function drop(student: Student) {
    const who = nameOf(student.displayName, student.email)

    setConfirming({
      title: `Remove ${who}?`,
      body: 'They leave your University and you stop being able to read their journal.',
      consequence:
        'Their own journal is untouched — this ends the enrolment, not their account. You can invite them again.',
      action: 'Remove',
      onConfirm: async () => {
        await endEnrolment(student.uid)
        toast.success(`${who} is no longer enrolled.`)
        state.reload()
      },
    })
  }

  /** The same, for somebody who was approved but has not finished signing. */
  function dropApplicant(application: Application) {
    const who = nameOf(application.studentName, application.studentEmail)

    setConfirming({
      title: `Withdraw ${who}?`,
      body: 'They stop being able to see or sign your documents.',
      consequence:
        'Anything they have already signed is kept, but the enrolment ends and they do not join.',
      action: 'Withdraw',
      onConfirm: async () => {
        await endEnrolment(application.studentUid)
        toast.success(`${who} withdrawn.`)
        state.reload()
      },
    })
  }

  return (
    <>
      <section className={`${CARD} ${UNI_BAND}`}>
        <div className={UNI_BAND_BODY}>
          {/*
            The University's own name, as the coach registered it in settings —
            not a label built from their display name. An unnamed University
            says so and links to where it is named, rather than quietly
            inventing one that would then differ from the invitation email.
          */}
          <h3 className={UNI_BAND_NAME}>
            {state.settings.name.trim() || 'Your University'}
          </h3>
          <p className={UNI_BAND_SUB}>
            {state.settings.name.trim() === ''
              ? 'Not named yet — open Program settings to register it.'
              : state.settings.blurb.trim() ||
                (students.length === 0
                  ? 'Nobody enrolled yet. Invite a trader by their email address.'
                  : `${students.length} enrolled${pending > 0 ? `, ${pending} awaiting an answer` : ''}.`)}
          </p>
        </div>

        <div className={UNI_BAND_ACTIONS}>
          <button
            type="button"
            className={`${PILL} ${PILL_IDLE}`}
            onClick={() => navigate('university/documents')}
          >
            Documents
          </button>
          <button
            type="button"
            className={`${PILL} ${PILL_IDLE}`}
            onClick={() => navigate('university/settings')}
          >
            Program settings
          </button>
          <button
            type="button"
            className={`${PILL} ${PILL_ACCENT}`}
            onClick={() => setInviting(true)}
          >
            <UserPlusIcon size={15} />
            Invite a student
          </button>
        </div>
      </section>

      <div className={STAT_ROW}>
        <Figure label="Students" value={String(students.length)} />
        <Figure label="Awaiting an answer" value={String(pending)} />
        <Figure label="To approve" value={String(applications.length)} />
        {/*
          Approved but not enrolled. Without this they vanish: off the
          applications tab, not yet on the roster, and the coach has no way to
          tell whether anything happened.
        */}
        <Figure label="Signing" value={String(inbox.signing.length)} />
        <Figure
          label="Trades logged"
          value={String(students.reduce((total, s) => total + s.tradeCount, 0))}
        />
        <Figure
          label="Mean discipline"
          value={meanDiscipline === null ? '—' : `${meanDiscipline}%`}
        />
        <Figure
          label="Cohort P&L"
          value={money(cohortPl)}
          tone={cohortPl >= 0 ? 'pos' : 'neg'}
        />
      </div>

      <div className={UNI_TABS}>
        <button
          type="button"
          className={`${UNI_TAB} ${tab === 'students' ? UNI_TAB_ACTIVE : ''}`}
          onClick={() => setTab('students')}
        >
          Students ({students.length})
        </button>
        <button
          type="button"
          className={`${UNI_TAB} ${tab === 'applications' ? UNI_TAB_ACTIVE : ''}`}
          onClick={() => setTab('applications')}
        >
          Applications ({applications.length})
        </button>
        <button
          type="button"
          className={`${UNI_TAB} ${tab === 'signing' ? UNI_TAB_ACTIVE : ''}`}
          onClick={() => setTab('signing')}
        >
          Signing ({inbox.signing.length})
        </button>
        <button
          type="button"
          className={`${UNI_TAB} ${tab === 'invites' ? UNI_TAB_ACTIVE : ''}`}
          onClick={() => setTab('invites')}
        >
          Invitations ({sent.length})
        </button>
      </div>

      {state.loading && students.length === 0 ? (
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading your roster…</p>
        </section>
      ) : tab === 'students' ? (
        <Roster students={students} money={money} onDrop={drop} />
      ) : tab === 'applications' ? (
        <Applications applications={applications} onDecide={decide} />
      ) : tab === 'signing' ? (
        <Signing signing={inbox.signing} onRemove={dropApplicant} />
      ) : (
        <SentInvites invites={sent} />
      )}

      <ConfirmDialog request={confirming} onClose={() => setConfirming(null)} />

      <InviteStudent
        open={inviting}
        onClose={() => setInviting(false)}
        onInvited={() => {
          setInviting(false)
          state.reload()
        }}
      />
    </>
  )
}

function Roster({
  students,
  money,
  onDrop,
}: {
  students: Student[]
  money: (value: number) => string
  onDrop: (student: Student) => void
}) {
  if (students.length === 0) {
    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>No students yet.</p>
        <p className={MUTED_NOTE}>
          An invitation stays pending until the trader accepts it — they will see it
          on their own My University screen.
        </p>
      </section>
    )
  }

  return (
    <section className={CARD}>
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Student</th>
              <th className={TH}>Trades</th>
              <th className={TH}>Win rate</th>
              <th className={TH}>Net P&amp;L</th>
              <th className={TH}>Discipline</th>
              <th className={TH}>Last trade</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const open = () => navigate(`university/${student.uid}`)

              return (
                <tr
                  key={student.uid}
                  className={`${ROW} ${UNI_ROW_LINK}`}
                  onClick={open}
                >
                  <td className={TD}>
                    <span className={UNI_STUDENT}>
                      <Face
                        uid={student.uid}
                        name={nameOf(student.displayName, student.email)}
                      />
                      <span>
                        <button
                          type="button"
                          className={UNI_NAME_BUTTON}
                          onClick={(event) => {
                            event.stopPropagation()
                            open()
                          }}
                        >
                          {nameOf(student.displayName, student.email)}
                        </button>
                        <span className={UNI_STUDENT_MAIL}>{student.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className={TD}>{student.tradeCount}</td>
                  <td className={TD}>
                    {student.closedCount === 0 ? '—' : `${Math.round(student.winRate)}%`}
                  </td>
                  <td className={`${TD} ${MONO} ${student.netPl >= 0 ? POS : NEG}`}>
                    {money(student.netPl)}
                  </td>
                  <td className={TD}>
                    {student.ruleScore === null ? '—' : `${student.ruleScore}%`}
                  </td>
                  <td className={TD}>
                    {student.lastTradeAt === null
                      ? 'Nothing yet'
                      : student.lastTradeAt.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                  </td>
                  <td className={TD}>
                    <span className={UNI_ROW_ACTIONS}>
                      <button
                        type="button"
                        className={UNI_GHOST}
                        onClick={(event) => {
                          event.stopPropagation()
                          onDrop(student)
                        }}
                      >
                        Remove
                      </button>
                      <ChevronRightIcon size={16} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * What each state is called on the invitations tab.
 *
 * Every one of these used to read "Waiting", because the wire status was
 * flattened to pending-or-declined on the way in. A coach could see a Signing
 * count of one and an invitation that looked unanswered, both describing the
 * same person.
 */
const INVITE_LABEL: Record<string, string> = {
  pending: 'Waiting',
  applied: 'Answered — to approve',
  documents: 'Signing documents',
  active: 'Enrolled',
  declined: 'Declined',
}

function SentInvites({ invites }: { invites: SentInvite[] }) {
  if (invites.length === 0) {
    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>Nothing outstanding.</p>
        <p className={MUTED_NOTE}>
          Invitations that were accepted are on the Students tab.
        </p>
      </section>
    )
  }

  return (
    <section className={CARD}>
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Trader</th>
              <th className={TH}>What you said</th>
              <th className={TH}>Status</th>
              <th className={TH}>Sent</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.studentUid} className={ROW}>
                <td className={TD}>
                  <span className={UNI_STUDENT}>
                    <Face
                      uid={invite.studentUid}
                      name={nameOf(invite.studentName, invite.studentEmail)}
                    />
                    <span>
                      <span className={UNI_STUDENT_NAME}>
                        {nameOf(invite.studentName, invite.studentEmail)}
                      </span>
                      <span className={UNI_STUDENT_MAIL}>{invite.studentEmail}</span>
                    </span>
                  </span>
                </td>
                <td className={TD}>{invite.note || '—'}</td>
                <td className={TD}>
                  <span className={`${UNI_STATUS} ${UNI_STATUS_TONE[invite.status]}`}>
                    {INVITE_LABEL[invite.status]}
                  </span>
                </td>
                <td className={TD}>
                  {invite.invitedAt === null
                    ? '—'
                    : invite.invitedAt.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ------------------------------------------------ student and solo traders */

function TraderView({ state, intake }: { state: State; intake: Inbox['intake'] }) {
  const { coach, loading, invitations } = state

  /*
   * Approved, and still signing.
   *
   * `/university/coach` only answers for an *active* enrolment, deliberately —
   * it is the roster relationship. So somebody part-way through signing had a
   * null coach here and was told they were in no program at all, which is the
   * opposite of true. The enrolment status is what this screen turns on.
   */
  if (intake.status === 'documents') {
    return (
      <section className={`${CARD} ${UNI_INVITE}`}>
        <div className={UNI_INVITE_BODY}>
          <span className={UNI_INVITE_WHO}>
            {intake.universityName.trim() || nameOf(intake.coachName, intake.coachEmail)}{' '}
            approved you
          </span>
          <p className={UNI_INVITE_NOTE}>
            {intake.outstanding === 0
              ? 'Finishing up — refresh in a moment.'
              : `Sign ${intake.outstanding} of ${intake.requiredTotal} document${
                  intake.requiredTotal === 1 ? '' : 's'
                } below and you are enrolled. Nothing else is waiting on you.`}
          </p>
        </div>
      </section>
    )
  }

  if (intake.status === 'applied') {
    return (
      <section className={`${CARD} ${UNI_INVITE}`}>
        <div className={UNI_INVITE_BODY}>
          <span className={UNI_INVITE_WHO}>Waiting on your coach</span>
          <p className={UNI_INVITE_NOTE}>
            You have answered{' '}
            {intake.universityName.trim() || nameOf(intake.coachName, intake.coachEmail)}
            &rsquo;s form. They review it before you join — nothing else is needed
            from you.
          </p>
        </div>
      </section>
    )
  }

  if (loading && coach === null) {
    return (
      <section className={CARD}>
        <p className={UNI_LOADING}>Loading…</p>
      </section>
    )
  }

  if (coach !== null) {
    return (
      <section className={`${CARD} ${UNI_COACH_CARD}`}>
        <Face uid={coach.uid} name={nameOf(coach.displayName, coach.email)} size={56} />
        <div className={UNI_COACH_BODY}>
          <span className={UNI_COACH_ROLE}>Your coach</span>
          <h3 className={UNI_COACH_NAME}>{nameOf(coach.displayName, coach.email)}</h3>
          <p className={UNI_COACH_NOTE}>
            {coach.email}
            {coach.since !== null &&
              ` · since ${coach.since.toLocaleDateString('en-GB', {
                month: 'long',
                year: 'numeric',
              })}`}
          </p>
        </div>
        <div className={UNI_BAND_ACTIONS}>
          <button type="button" className={`${PILL} ${PILL_IDLE}`} disabled>
            <ChatIcon size={15} />
            Message
          </button>
        </div>
      </section>
    )
  }

  if (invitations.length > 0) return null

  return (
    <section className={`${CARD} ${EMPTY_BLOCK}`}>
      <p>You are not in a coaching program.</p>
      <p className={MUTED_NOTE}>
        A coach invites you by the email address on your account. When one does, the
        invitation appears here for you to accept or decline.
      </p>
    </section>
  )
}

function InvitationCard({
  invitation,
  onAnswer,
}: {
  invitation: Invitation
  onAnswer: (coachUid: string, accept: boolean) => void
}) {
  const who = nameOf(invitation.coachName, invitation.coachEmail)

  return (
    <section className={`${CARD} ${UNI_INVITE}`}>
      <Face uid={invitation.coachUid} name={who} size={46} />

      <div className={UNI_INVITE_BODY}>
        <span className={UNI_INVITE_WHO}>{who} invited you to their program</span>
        <p className={UNI_INVITE_NOTE}>
          {invitation.note || 'They did not leave a note.'}
        </p>
      </div>

      <div className={UNI_INVITE_ACTIONS}>
        <button
          type="button"
          className={`${PILL} ${PILL_IDLE}`}
          onClick={() => onAnswer(invitation.coachUid, false)}
        >
          Decline
        </button>
        {/*
          Opens the join flow rather than accepting here.
          
          This button used to call accept directly, which walked straight past
          the coach's intake form and their approval — the invited trader
          landed on the roster without answering or being reviewed. The join
          screen is the one place that knows which of those apply.
        */}
        <button
          type="button"
          className={`${PILL} ${PILL_ACCENT}`}
          onClick={() => navigate('university/join')}
        >
          Open invitation
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ parts */

function Figure({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
}) {
  const colour = tone === 'pos' ? POS : tone === 'neg' ? NEG : ''

  return (
    <div className={`${CARD} ${STAT_CARD}`}>
      <span className={STAT_LABEL}>{label}</span>
      <span className={`${STAT_VALUE} ${colour}`}>{value}</span>
    </div>
  )
}

function Face({ uid, name, size = 36 }: { uid: string; name: string; size?: number }) {
  return (
    <span className={COMM_AVATAR} style={{ width: size, height: size }}>
      <span
        className={COMM_AVATAR_FACE}
        style={{ background: accentFor(uid), fontSize: size * 0.34 }}
      >
        {initialsFor(name, '')}
      </span>
    </span>
  )
}

/**
 * Documents a student has been given, and whether they have done them.
 *
 * Above the coach card rather than below it, because this is the only part of
 * the screen that is asking the reader for something. Completed ones stay on
 * the list — "I already signed that" is a question people ask, and a list that
 * hid the answer would not answer it.
 */
function Waiting({ uid, signing }: { uid: string | null; signing: boolean }) {
  const { documents, loading, error } = useDocuments(uid)

  if (loading) return null

  /*
   * Silence was the bug here.
   *
   * This used to render nothing whenever the list came back empty — so a
   * student the coach could see under "Signing", with two published documents
   * waiting, got a blank screen and no way to tell whether the problem was
   * them, the coach, or the app. If the enrolment says there is signing to do,
   * this says so even when the list is empty.
   */
  if (documents.length === 0) {
    if (!signing) return null

    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>Your coach has documents for you, but none came back.</p>
        <p className={MUTED_NOTE}>
          {error ?? 'Try reloading. If it persists, your coach may have unpublished them.'}
        </p>
      </section>
    )
  }

  const outstanding = documents.filter((entry) => entry.submittedAt === null)

  return (
    <section className={CARD}>
      <div className={UNI_CARD_HEAD}>
        <h3 className={PANEL_TITLE}>
          {outstanding.length === 0
            ? 'Documents'
            : `Waiting on you (${outstanding.length})`}
        </h3>
      </div>

      <div className={DOC_LIST}>
        {documents.map((entry) => (
          <div
            key={entry.id}
            className={`${DOC_ROW} ${DOC_ROW_LINK}`}
            onClick={() => navigate(`university/doc/${entry.id}`)}
          >
            <span className={DOC_GLYPH}>{entry.kind === 'agreement' ? '§' : '?'}</span>

            <span className={DOC_BODY}>
              <button
                type="button"
                className={UNI_NAME_BUTTON}
                onClick={(event) => {
                  event.stopPropagation()
                  navigate(`university/doc/${entry.id}`)
                }}
              >
                {entry.title}
              </button>
              <span className={DOC_SUB}>
                {entry.summary ||
                  (entry.kind === 'agreement' ? 'An agreement to sign' : 'A form to answer')}
              </span>
            </span>

            <span className={DOC_TAIL}>
              <span
                className={`${DOC_FLAG} ${
                  entry.submittedAt !== null
                    ? DOC_FLAG_TONE.done
                    : entry.required
                      ? DOC_FLAG_TONE.waiting
                      : DOC_FLAG_TONE.draft
                }`}
              >
                {entry.submittedAt !== null
                  ? 'Done'
                  : entry.required
                    ? 'Required'
                    : 'Optional'}
              </span>
              <ChevronRightIcon size={16} />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Students who answered the intake form and are waiting on a decision.
 *
 * Approving is the single act that enrols them — and because every document
 * read is gated on an active enrolment, it is also what puts the coach's
 * required documents in front of them. There is no second "send the
 * documents" step that could be forgotten.
 */
function Applications({
  applications,
  onDecide,
}: {
  applications: Application[]
  onDecide: (application: Application, approve: boolean) => void
}) {
  if (applications.length === 0) {
    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>Nobody waiting.</p>
        <p className={MUTED_NOTE}>
          When an invited trader answers your intake form, they appear here until
          you approve or turn them down.
        </p>
      </section>
    )
  }

  return (
    <div className={DOC_LIST}>
      {applications.map((application) => (
        <section key={application.studentUid} className={CARD}>
          <div className={DOC_ROW}>
            <Face
              uid={application.studentUid}
              name={nameOf(application.studentName, application.studentEmail)}
            />

            <span className={DOC_BODY}>
              <span className={UNI_STUDENT_NAME}>
                {nameOf(application.studentName, application.studentEmail)}
              </span>
              <span className={UNI_STUDENT_MAIL}>
                {application.studentEmail}
                {application.appliedAt !== null &&
                  ` · applied ${application.appliedAt.toLocaleDateString('en-GB')}`}
              </span>
            </span>

            <span className={DOC_TAIL}>
              {application.documentId !== '' && (
                <button
                  type="button"
                  className={UNI_GHOST}
                  onClick={() => navigate('university/documents')}
                >
                  Read their answers
                </button>
              )}
              <button
                type="button"
                className={`${PILL} ${PILL_IDLE}`}
                onClick={() => onDecide(application, false)}
              >
                Turn down
              </button>
              <button
                type="button"
                className={`${PILL} ${PILL_ACCENT}`}
                onClick={() => onDecide(application, true)}
              >
                Approve
              </button>
            </span>
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Approved, and working through their documents.
 *
 * Its own tab rather than a number on a card, because the useful thing to do
 * with somebody stuck here is act on it — chase them, or withdraw them. A
 * count told a coach that somebody existed and gave them no way to reach it.
 */
function Signing({
  signing,
  onRemove,
}: {
  signing: Application[]
  onRemove: (application: Application) => void
}) {
  if (signing.length === 0) {
    return (
      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>Nobody is mid-signing.</p>
        <p className={MUTED_NOTE}>
          Approved students appear here until every required document is signed.
          They join the roster the moment the last one is done.
        </p>
      </section>
    )
  }

  return (
    <div className={DOC_LIST}>
      {signing.map((application) => (
        <section key={application.studentUid} className={CARD}>
          <div className={DOC_ROW}>
            <Face
              uid={application.studentUid}
              name={nameOf(application.studentName, application.studentEmail)}
            />

            <span className={DOC_BODY}>
              <span className={UNI_STUDENT_NAME}>
                {nameOf(application.studentName, application.studentEmail)}
              </span>
              <span className={UNI_STUDENT_MAIL}>
                {application.studentEmail} · waiting on their signatures
              </span>
            </span>

            <span className={DOC_TAIL}>
              <span className={`${UNI_STATUS} ${UNI_STATUS_TONE.documents}`}>
                Signing
              </span>
              <button
                type="button"
                className={UNI_GHOST}
                onClick={() => onRemove(application)}
              >
                Remove
              </button>
            </span>
          </div>
        </section>
      ))}
    </div>
  )
}
