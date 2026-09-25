import { useMemo, useState } from 'react'
import { ChatIcon, ChevronRightIcon, UserPlusIcon } from '../components/Icons'
import { accentFor, initialsFor } from '../data/messages'
import { journalFor } from '../data/studentJournal'
import {
  CLASSMATES,
  LEVEL_LABEL,
  MY_COACH,
  REQUESTS,
  STUDENTS,
  UNIVERSITY,
  type Student,
} from '../data/university'
import {
  CARD,
  COMM_AVATAR,
  COMM_AVATAR_FACE,
  EMPTY_BLOCK,
  METER_FILL,
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
  SOON_BADGE,
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
  UNI_LEVEL,
  UNI_LEVEL_TONE,
  UNI_NAME_BUTTON,
  UNI_PEER,
  UNI_PEER_GRID,
  UNI_PROGRESS,
  UNI_PROGRESS_CELL,
  UNI_PROGRESS_PCT,
  UNI_ROW_ACTIONS,
  UNI_ROW_LINK,
  UNI_STUDENT,
  UNI_STUDENT_MAIL,
  UNI_STUDENT_NAME,
  UNI_TAB,
  UNI_TAB_ACTIVE,
  UNI_TABS,
} from '../components/ui'
import { disciplineScore } from '../lib/dashboardStats'
import { moneyIn } from '../lib/journalStats'
import { deriveStats } from '../lib/stats'
import { navigate } from '../lib/useHashRoute'
import type { Profile } from '../lib/profile'

/**
 * The teaching side of the account.
 *
 * Which screen this is depends on `account_type`, not on the plan — the two
 * answer different questions. The plan is what somebody is billed as; the
 * account type is what they are here as, and only the second decides whether
 * you have students or a coach.
 *
 * **Nothing here is connected.** There is no enrolment anywhere in the API
 * yet: no collection joining a coach to a student, no endpoint listing one.
 * The roster is fixtures, and every number on it is derived from the sample
 * journals in `data/studentJournal.ts` by the same functions the trader's own
 * dashboard uses — so a row and the page it opens can never disagree.
 */
export function MyUniversity({ profile }: { profile: Profile | null }) {
  const accountType = profile?.accountType ?? 'individual'

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>My University</h2>
          <p className={PAGE_SUB}>
            {accountType === 'coach'
              ? 'The traders you are teaching, what they have logged, and who is waiting on a review. Open anyone to see their whole record.'
              : 'Who is teaching you, and who is learning alongside you.'}
          </p>
        </div>
      </div>

      {accountType === 'coach' && <CoachView profile={profile} />}
      {accountType === 'student' && <StudentView />}
      {accountType === 'individual' && <UnaffiliatedView />}
    </>
  )
}

/* --------------------------------------------------------- derived roster */

type RosterRow = {
  student: Student
  trades: number
  winRate: number
  netPl: number
  discipline: number | null
}

/**
 * One pass over every student's journal.
 *
 * Memoised because it is the whole roster's arithmetic, and the tab switch
 * above it re-renders this component. `journalFor` caches per uid, so the
 * generation itself only ever happens once.
 */
function useRoster(): RosterRow[] {
  return useMemo(
    () =>
      STUDENTS.map((student) => {
        const trades = journalFor(student.uid)
        const stats = deriveStats(trades)
        return {
          student,
          trades: stats.tradeCount,
          winRate: stats.winRate,
          netPl: stats.netPl,
          discipline: disciplineScore(trades).score,
        }
      }),
    [],
  )
}

/* ------------------------------------------------------------- coach view */

function CoachView({ profile }: { profile: Profile | null }) {
  const [tab, setTab] = useState<'students' | 'requests'>('students')
  const roster = useRoster()
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])

  const active = STUDENTS.filter((student) => student.lastActive.endsWith('h')).length
  const awaiting = STUDENTS.filter((student) => student.awaitingReview === true).length

  const graded = roster.filter((row) => row.discipline !== null)
  const meanDiscipline =
    graded.length === 0
      ? null
      : Math.round(
          graded.reduce((total, row) => total + (row.discipline ?? 0), 0) / graded.length,
        )
  const cohortPl = roster.reduce((total, row) => total + row.netPl, 0)

  return (
    <>
      <section className={`${CARD} ${UNI_BAND}`}>
        <div className={UNI_BAND_BODY}>
          <h3 className={UNI_BAND_NAME}>{UNIVERSITY.name}</h3>
          <p className={UNI_BAND_SUB}>
            {UNIVERSITY.cohort} · {UNIVERSITY.blurb}
          </p>
        </div>

        <div className={UNI_BAND_ACTIONS}>
          <button type="button" className={`${PILL} ${PILL_IDLE}`} disabled>
            Programme settings
          </button>
          <button type="button" className={`${PILL} ${PILL_ACCENT}`} disabled>
            <UserPlusIcon size={15} />
            Invite a student
          </button>
        </div>
      </section>

      <div className={STAT_ROW}>
        <Figure label="Students" value={String(STUDENTS.length)} />
        <Figure label="Active today" value={String(active)} />
        <Figure label="Awaiting review" value={String(awaiting)} />
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
          Students ({STUDENTS.length})
        </button>
        <button
          type="button"
          className={`${UNI_TAB} ${tab === 'requests' ? UNI_TAB_ACTIVE : ''}`}
          onClick={() => setTab('requests')}
        >
          Requests ({REQUESTS.length})
        </button>
      </div>

      {tab === 'students' ? <Roster roster={roster} money={money} /> : <Requests />}

      <p className={MUTED_NOTE}>
        Sample roster. Enrolment is not built yet — no part of the API joins a coach
        to a student, so nothing on this screen is your own data.
      </p>
    </>
  )
}

function Roster({
  roster,
  money,
}: {
  roster: RosterRow[]
  money: (value: number) => string
}) {
  function open(uid: string) {
    navigate(`university/${uid}`)
  }

  return (
    <section className={CARD}>
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Student</th>
              <th className={TH}>Stage</th>
              <th className={TH}>Trades</th>
              <th className={TH}>Win rate</th>
              <th className={TH}>Net P&amp;L</th>
              <th className={TH}>Discipline</th>
              <th className={TH}>Progress</th>
              <th className={TH}>Last active</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {roster.map(({ student, trades, winRate, netPl, discipline }) => (
              /*
               * The row is clickable for convenience; the name inside it is
               * the real activator, because a click handler on a <tr> is
               * unreachable from a keyboard. The inner button stops the event
               * so one press is not handled twice.
               */
              <tr
                key={student.uid}
                className={`${ROW} ${UNI_ROW_LINK}`}
                onClick={() => open(student.uid)}
              >
                <td className={TD}>
                  <span className={UNI_STUDENT}>
                    <Face uid={student.uid} name={student.name} email={student.email} />
                    <span>
                      <button
                        type="button"
                        className={UNI_NAME_BUTTON}
                        onClick={(event) => {
                          event.stopPropagation()
                          open(student.uid)
                        }}
                      >
                        {student.name}
                      </button>
                      <span className={UNI_STUDENT_MAIL}>{student.email}</span>
                    </span>
                  </span>
                </td>
                <td className={TD}>
                  <span className={`${UNI_LEVEL} ${UNI_LEVEL_TONE[student.level]}`}>
                    {LEVEL_LABEL[student.level]}
                  </span>
                </td>
                <td className={TD}>{trades}</td>
                <td className={TD}>{Math.round(winRate)}%</td>
                <td className={`${TD} ${MONO} ${netPl >= 0 ? POS : NEG}`}>
                  {money(netPl)}
                </td>
                <td className={TD}>
                  {discipline === null ? '—' : `${Math.round(discipline)}%`}
                </td>
                <td className={TD}>
                  <span className={UNI_PROGRESS_CELL}>
                    <span className={UNI_PROGRESS}>
                      <span
                        className={METER_FILL}
                        style={{ width: `${student.progress}%` }}
                      />
                    </span>
                    <span className={UNI_PROGRESS_PCT}>{student.progress}%</span>
                  </span>
                </td>
                <td className={TD}>{student.lastActive} ago</td>
                <td className={TD}>
                  <span className={UNI_ROW_ACTIONS}>
                    <ChevronRightIcon size={16} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Requests() {
  return (
    <section className={CARD}>
      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Trader</th>
              <th className={TH}>Why they are asking</th>
              <th className={TH}>Waiting</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody>
            {REQUESTS.map((request) => (
              <tr key={request.uid} className={ROW}>
                <td className={TD}>
                  <span className={UNI_STUDENT}>
                    <Face uid={request.uid} name={request.name} email={request.email} />
                    <span>
                      <span className={UNI_STUDENT_NAME}>{request.name}</span>
                      <span className={UNI_STUDENT_MAIL}>{request.email}</span>
                    </span>
                  </span>
                </td>
                <td className={TD}>{request.note}</td>
                <td className={TD}>{request.age}</td>
                <td className={TD}>
                  <span className={UNI_ROW_ACTIONS}>
                    <button type="button" className={UNI_GHOST} disabled>
                      Decline
                    </button>
                    <button type="button" className={`${PILL} ${PILL_ACCENT}`} disabled>
                      Accept
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- student view */

function StudentView() {
  const peers = useMemo(
    () =>
      CLASSMATES.map((peer) => ({
        peer,
        trades: journalFor(peer.uid).length,
      })),
    [],
  )

  return (
    <>
      <section className={`${CARD} ${UNI_COACH_CARD}`}>
        <Face uid={MY_COACH.uid} name={MY_COACH.name} email={MY_COACH.email} size={56} />
        <div className={UNI_COACH_BODY}>
          <span className={UNI_COACH_ROLE}>Your coach</span>
          <h3 className={UNI_COACH_NAME}>{MY_COACH.name}</h3>
          <p className={UNI_COACH_NOTE}>{MY_COACH.note}</p>
        </div>
        <div className={UNI_BAND_ACTIONS}>
          <button type="button" className={`${PILL} ${PILL_ACCENT}`} disabled>
            <ChatIcon size={15} />
            Message
          </button>
        </div>
      </section>

      <section className={CARD}>
        <div className={UNI_COACH_CARD}>
          <div className={UNI_BAND_BODY}>
            <h3 className={UNI_BAND_NAME}>
              Your cohort <span className={SOON_BADGE}>Preview</span>
            </h3>
            <p className={UNI_BAND_SUB}>{UNIVERSITY.cohort}</p>
          </div>
        </div>

        <div className={UNI_PEER_GRID}>
          {peers.map(({ peer, trades }) => (
            <div key={peer.uid} className={`${CARD} ${UNI_PEER}`}>
              <Face uid={peer.uid} name={peer.name} email={peer.email} />
              <span>
                <span className={UNI_STUDENT_NAME}>{peer.name}</span>
                <span className={UNI_STUDENT_MAIL}>
                  {LEVEL_LABEL[peer.level]} · {trades} trades
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/* ----------------------------------------------------- everyone else view */

/**
 * What an individual account sees.
 *
 * Shown rather than hidden from the sidebar, because "you are not in a
 * programme" is a useful answer and a missing menu item is not one. It is also
 * where joining one will go when there is something to join.
 */
function UnaffiliatedView() {
  return (
    <section className={`${CARD} ${EMPTY_BLOCK}`}>
      <p>You are trading on your own account, so there is no cohort here yet.</p>
      <p className={MUTED_NOTE}>
        Switch your account type to Student or Coach on the Profile page, and this
        screen becomes your cohort or your roster.
      </p>
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

function Face({
  uid,
  name,
  email,
  size = 36,
}: {
  uid: string
  name: string
  email: string
  size?: number
}) {
  return (
    <span className={COMM_AVATAR} style={{ width: size, height: size }}>
      <span
        className={COMM_AVATAR_FACE}
        style={{ background: accentFor(uid), fontSize: size * 0.34 }}
      >
        {initialsFor(name, email)}
      </span>
    </span>
  )
}
