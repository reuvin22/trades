import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'
import { toStored, type StoredTrade, type TradeWire } from './trades'

/**
 * Coaching, through the API.
 *
 * Every figure on a student — trade count, win rate, P&L, rule score — is
 * computed by the service from their journal and arrives on the wire. None of
 * it is derived here, and none of it is sent: a coach who could post a
 * student's win rate could post any number they liked.
 *
 * The one call that names another person, `studentJournal`, is refused by the
 * API unless that student accepted an invitation from this caller. The check
 * lives there, not here — this is the convenience, that is the guarantee.
 */

export type Student = {
  uid: string
  displayName: string
  email: string
  photoURL: string
  since: Date | null
  tradeCount: number
  closedCount: number
  winRate: number
  netPl: number
  /** Null when nothing on their journal has been graded against their rules. */
  ruleScore: number | null
  lastTradeAt: Date | null
}

export type Invitation = {
  coachUid: string
  coachName: string
  coachEmail: string
  coachPhoto: string
  note: string
  invitedAt: Date | null
}

export type SentInvite = {
  studentUid: string
  studentName: string
  studentEmail: string
  studentPhoto: string
  /**
   * The real state, not a two-way guess.
   *
   * This used to collapse to 'pending' | 'declined', which made a student
   * part-way through signing show on the coach's screen as "Waiting" — the
   * coach could see a Signing count of 1 and an invitation that looked
   * unanswered, describing the same person.
   */
  status: EnrolmentStatus
  note: string
  invitedAt: Date | null
  /** When they answered — so a refusal from months ago is not news. */
  respondedAt: Date | null
}

export type Coach = {
  uid: string
  displayName: string
  email: string
  photoURL: string
  since: Date | null
}

type StudentWire = Record<string, unknown>

function toStudent(wire: StudentWire): Student {
  return {
    uid: String(wire.uid ?? ''),
    displayName: String(wire.display_name ?? ''),
    email: String(wire.email ?? ''),
    photoURL: String(wire.photo_url ?? ''),
    since: date(wire.since),
    tradeCount: Number(wire.trade_count ?? 0),
    closedCount: Number(wire.closed_count ?? 0),
    winRate: Number(wire.win_rate ?? 0),
    netPl: Number(wire.net_pl ?? 0),
    ruleScore: wire.rule_score === null || wire.rule_score === undefined
      ? null
      : Number(wire.rule_score),
    lastTradeAt: date(wire.last_trade_at),
  }
}

/** The display name an account may not have set yet. */
export function nameOf(displayName: string, email: string): string {
  return displayName.trim() || email.split('@')[0] || 'Trader'
}

/* ------------------------------------------------------------------ reads */

export type UniversityState = {
  students: Student[]
  invitations: Invitation[]
  sent: SentInvite[]
  coach: Coach | null
  /** The University as its coach registered it. Empty until they name it. */
  settings: Settings
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Everything the screen needs, in one hook.
 *
 * Four calls rather than one endpoint that returns all of it, because they are
 * four different questions with four different audiences — and a coach who is
 * also somebody's student is an ordinary case, not a special one.
 *
 * A failure on any of them shows as one error. They are fetched together and
 * are useless apart: a roster with no invitations beside it is a screen that
 * quietly lost half its content.
 */
export function useUniversity(uid: string | null): UniversityState {
  const [students, setStudents] = useState<Student[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [sent, setSent] = useState<SentInvite[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    Promise.all([
      apiFetch<{ students: StudentWire[] }>('/api/v1/university/students', {
        signal: abort.signal,
      }),
      apiFetch<{ invitations: Record<string, unknown>[] }>(
        '/api/v1/university/invitations',
        { signal: abort.signal },
      ),
      apiFetch<{ invites: Record<string, unknown>[] }>('/api/v1/university/invites', {
        signal: abort.signal,
      }),
      apiFetch<{ coach: Record<string, unknown> | null }>('/api/v1/university/coach', {
        signal: abort.signal,
      }),
      // Fetched with the rest so the University's name is on screen in the
      // same paint as the roster it heads.
      apiFetch<Record<string, unknown>>('/api/v1/university/settings', {
        signal: abort.signal,
      }),
    ])
      .then(([roster, waiting, outgoing, mine, programme]) => {
        setSettings(toSettings(programme))
        setStudents(roster.students.map(toStudent))
        setInvitations(
          waiting.invitations.map((wire) => ({
            coachUid: String(wire.coach_uid ?? ''),
            coachName: String(wire.coach_name ?? ''),
            coachEmail: String(wire.coach_email ?? ''),
            coachPhoto: String(wire.coach_photo ?? ''),
            note: String(wire.note ?? ''),
            invitedAt: date(wire.invited_at),
          })),
        )
        setSent(
          outgoing.invites.map((wire) => ({
            studentUid: String(wire.student_uid ?? ''),
            studentName: String(wire.student_name ?? ''),
            studentEmail: String(wire.student_email ?? ''),
            studentPhoto: String(wire.student_photo ?? ''),
            status: (wire.status as EnrolmentStatus) ?? 'pending',
            note: String(wire.note ?? ''),
            invitedAt: date(wire.invited_at),
            respondedAt: date(wire.responded_at),
          })),
        )
        setCoach(
          mine.coach === null
            ? null
            : {
                uid: String(mine.coach.uid ?? ''),
                displayName: String(mine.coach.display_name ?? ''),
                email: String(mine.coach.email ?? ''),
                photoURL: String(mine.coach.photo_url ?? ''),
                since: date(mine.coach.since),
              },
        )
        setError(null)
        setLoadedFor(uid)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoadedFor(uid)
      })

    return () => abort.abort()
  }, [uid, nonce])

  /*
   * Loading is derived, not stored.
   *
   * `setLoading(true)` in an effect body is a render triggered by a render —
   * the same thing `useTrades` avoids. Instead the hook records which uid the
   * data it holds belongs to, and "loading" is simply: what we have is not for
   * the uid being asked about yet. A reload keeps the old rows on screen,
   * which is what a background refresh should do.
   */
  const loading = loadedFor !== uid

  /*
   * Emptied here rather than in the effect.
   *
   * Resetting four pieces of state the moment `uid` goes null is a render
   * triggered by a render, which is what `set-state-in-effect` is about. The
   * signed-out answer is simply "nothing", and that is something to derive,
   * not to store.
   */
  if (uid === null) {
    return {
      students: [],
      invitations: [],
      sent: [],
      coach: null,
      settings: EMPTY_SETTINGS,
      loading: false,
      error: null,
      reload,
    }
  }

  return { students, invitations, sent, coach, settings, loading, error, reload }
}

/* ----------------------------------------------------------------- writes */

export function inviteStudent(email: string, note: string): Promise<unknown> {
  return apiFetch('/api/v1/university/invites', {
    method: 'POST',
    body: { email, note },
  })
}

/**
 * `uid` names the coach who invited you — the API derives the row from that
 * plus your own session, so it can only ever answer your own invitation.
 *
 * Answers with a message, because what accepting *did* depends on the
 * program: with documents outstanding it is "approved, now sign these", and
 * without any it is "you have joined". The caller shows what came back rather
 * than guessing which.
 */
export function acceptInvitation(coachUid: string): Promise<{ message?: string }> {
  return apiFetch(`/api/v1/university/invitations/${coachUid}/accept`, {
    method: 'POST',
  })
}

export function declineInvitation(coachUid: string): Promise<unknown> {
  return apiFetch(`/api/v1/university/invitations/${coachUid}/decline`, {
    method: 'POST',
  })
}

export function endEnrolment(uid: string): Promise<unknown> {
  return apiFetch(`/api/v1/university/students/${uid}`, { method: 'DELETE' })
}

/* -------------------------------------------------- one student's journal */

export type StudentJournal = {
  trades: StoredTrade[]
  loading: boolean
  /** Set when the caller is not this student's coach, among other reasons. */
  error: string | null
}

export function useStudentJournal(uid: string | null): StudentJournal {
  const [trades, setTrades] = useState<StoredTrade[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (uid === null || uid === '') return

    const abort = new AbortController()

    apiFetch<{ items: TradeWire[] }>(`/api/v1/university/students/${uid}/journal`, {
      signal: abort.signal,
    })
      .then((body) => {
        setTrades(body.items.map(toStored))
        setError(null)
        setLoadedFor(uid)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setTrades([])
        setError(readableApiError(cause))
        setLoadedFor(uid)
      })

    return () => abort.abort()
  }, [uid])

  if (uid === null || uid === '') return { trades: [], loading: false, error: null }

  return { trades, loading: loadedFor !== uid, error }
}

/* --------------------------------------------- the program and its mail */

export type EmailTemplate = {
  subject: string
  headerHtml: string
  bodyHtml: string
  footerHtml: string
  accent: string
}

export type Settings = {
  name: string
  blurb: string
  template: EmailTemplate
}

export const EMPTY_SETTINGS: Settings = {
  name: '',
  blurb: '',
  template: { subject: '', headerHtml: '', bodyHtml: '', footerHtml: '', accent: '#6353e8' },
}

function toSettings(wire: Record<string, unknown>): Settings {
  const raw = (wire.template ?? {}) as Record<string, unknown>

  return {
    name: String(wire.name ?? ''),
    blurb: String(wire.blurb ?? ''),
    template: {
      subject: String(raw.subject ?? ''),
      headerHtml: String(raw.header_html ?? ''),
      bodyHtml: String(raw.body_html ?? ''),
      footerHtml: String(raw.footer_html ?? ''),
      accent: String(raw.accent ?? '') || EMPTY_SETTINGS.template.accent,
    },
  }
}

export function fetchSettings(): Promise<Settings> {
  return apiFetch<Record<string, unknown>>('/api/v1/university/settings').then(toSettings)
}

/**
 * Save, and take back what the server kept.
 *
 * The response is the sanitised template, not the one that was sent. Adopting
 * it means a tag the allowlist dropped disappears from the editor there and
 * then, rather than at send time when nobody is looking.
 */
export function saveSettings(settings: Settings): Promise<Settings> {
  return apiFetch<Record<string, unknown>>('/api/v1/university/settings', {
    method: 'PUT',
    body: {
      name: settings.name,
      blurb: settings.blurb,
      template: {
        subject: settings.template.subject,
        header_html: settings.template.headerHtml,
        body_html: settings.template.bodyHtml,
        footer_html: settings.template.footerHtml,
        accent: settings.template.accent,
      },
    },
  }).then(toSettings)
}

/* --------------------------------------------------- joining, and approval */

export type EnrolmentStatus =
  | 'pending'
  | 'applied'
  /** Approved, but not enrolled until the required documents are signed. */
  | 'documents'
  | 'active'
  | 'declined'

export type Intake = {
  /** Null when nothing is waiting on this account. */
  status: EnrolmentStatus | null
  coachUid: string
  coachName: string
  coachEmail: string
  universityName: string
  note: string
  /** Empty when the coach has not set an intake form. */
  documentId: string
  /** In the `documents` state: how many are left, out of how many. */
  outstanding: number
  requiredTotal: number
}

export type Application = {
  studentUid: string
  studentName: string
  studentEmail: string
  appliedAt: Date | null
  documentId: string
}

function toIntake(wire: Record<string, unknown>): Intake {
  return {
    status: (wire.status as EnrolmentStatus | null) ?? null,
    coachUid: String(wire.coach_uid ?? ''),
    coachName: String(wire.coach_name ?? ''),
    coachEmail: String(wire.coach_email ?? ''),
    universityName: String(wire.university_name ?? ''),
    note: String(wire.note ?? ''),
    documentId: String(wire.document_id ?? ''),
    outstanding: Number(wire.outstanding ?? 0),
    requiredTotal: Number(wire.required_total ?? 0),
  }
}

export function fetchIntake(): Promise<Intake> {
  return apiFetch<Record<string, unknown>>('/api/v1/university/intake').then(toIntake)
}

export function fetchApplications(): Promise<Application[]> {
  return apiFetch<{ applications: Record<string, unknown>[] }>(
    '/api/v1/university/applications',
  ).then((page) =>
    page.applications.map((wire) => ({
      studentUid: String(wire.student_uid ?? ''),
      studentName: String(wire.student_name ?? ''),
      studentEmail: String(wire.student_email ?? ''),
      appliedAt: date(wire.applied_at),
      documentId: String(wire.document_id ?? ''),
    })),
  )
}

/** `uid` names the student who applied. */
export function decideApplication(uid: string, approve: boolean): Promise<unknown> {
  return apiFetch(
    `/api/v1/university/applications/${uid}/${approve ? 'approve' : 'reject'}`,
    { method: 'POST' },
  )
}

/**
 * Where this account is in the joining flow, for the notification bell.
 *
 * Small and separate for the same reason `useInvitations` is: the bell is on
 * every screen, and it must not drag a roster behind it.
 */
export function useIntake(uid: string | null): Intake | null {
  const [intake, setIntake] = useState<Intake | null>(null)

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    fetchIntake()
      .then((found) => {
        if (!abort.signal.aborted) setIntake(found)
      })
      // Silent, like the invitations hook: a bell that cannot reach the API
      // should be empty rather than an error on every screen.
      .catch(() => undefined)

    return () => abort.abort()
  }, [uid])

  return uid === null ? null : intake
}

/* ------------------------------------------------------------ the bell */

export type Inbox = {
  /** Student side. */
  invitations: Invitation[]
  intake: Intake
  /** Coach side. */
  applications: Application[]
  /** Approved, still signing. Not on the roster until they finish. */
  signing: Application[]
  declined: SentInvite[]
}

export const EMPTY_INBOX: Inbox = {
  invitations: [],
  intake: {
    status: null,
    coachUid: '',
    coachName: '',
    coachEmail: '',
    universityName: '',
    note: '',
    documentId: '',
    outstanding: 0,
    requiredTotal: 0,
  },
  applications: [],
  signing: [],
  declined: [],
}

/**
 * One call for the notification bell.
 *
 * Replaces the two hooks this grew — the bell sits on every screen, and each
 * one it accumulated was another round trip on every page load. Both sides
 * come back because one account can be both a coach and somebody's student.
 */
export function useInbox(uid: string | null): Inbox {
  const [inbox, setInbox] = useState<Inbox>(EMPTY_INBOX)

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    apiFetch<Record<string, unknown>>('/api/v1/university/inbox', {
      signal: abort.signal,
    })
      .then((wire) => {
        if (abort.signal.aborted) return

        setInbox({
          invitations: (wire.invitations as Record<string, unknown>[]).map((entry) => ({
            coachUid: String(entry.coach_uid ?? ''),
            coachName: String(entry.coach_name ?? ''),
            coachEmail: String(entry.coach_email ?? ''),
            coachPhoto: String(entry.coach_photo ?? ''),
            note: String(entry.note ?? ''),
            invitedAt: date(entry.invited_at),
          })),
          intake: toIntake(wire.intake as Record<string, unknown>),
          applications: (wire.applications as Record<string, unknown>[]).map(
            (entry) => ({
              studentUid: String(entry.student_uid ?? ''),
              studentName: String(entry.student_name ?? ''),
              studentEmail: String(entry.student_email ?? ''),
              appliedAt: date(entry.applied_at),
              documentId: String(entry.document_id ?? ''),
            }),
          ),
          signing: (wire.signing as Record<string, unknown>[]).map((entry) => ({
            studentUid: String(entry.student_uid ?? ''),
            studentName: String(entry.student_name ?? ''),
            studentEmail: String(entry.student_email ?? ''),
            appliedAt: date(entry.applied_at),
            documentId: String(entry.document_id ?? ''),
          })),
          declined: (wire.declined as Record<string, unknown>[]).map((entry) => ({
            studentUid: String(entry.student_uid ?? ''),
            studentName: String(entry.student_name ?? ''),
            studentEmail: String(entry.student_email ?? ''),
            studentPhoto: String(entry.student_photo ?? ''),
            status: 'declined' as EnrolmentStatus,
            note: String(entry.note ?? ''),
            invitedAt: date(entry.invited_at),
            respondedAt: date(entry.responded_at),
          })),
        })
      })
      // Silent: a bell that cannot reach the API should be empty rather than
      // an error message on every screen in the product.
      .catch(() => undefined)

    return () => abort.abort()
  }, [uid])

  return uid === null ? EMPTY_INBOX : inbox
}

/* ------------------------------------------------------ the signing run */

export type NextDocument = {
  /** Empty when there is nothing left to sign. */
  documentId: string
  remaining: number
  total: number
  done: boolean
}

/**
 * Where to send a student next.
 *
 * Asked after accepting and after every signature, rather than fetching the
 * whole list and choosing here — so the order is the same on every device,
 * and somebody who stopped half way resumes instead of starting again.
 */
export function fetchNextDocument(): Promise<NextDocument> {
  return apiFetch<Record<string, unknown>>('/api/v1/university/next').then((wire) => ({
    documentId: String(wire.document_id ?? ''),
    remaining: Number(wire.remaining ?? 0),
    total: Number(wire.total ?? 0),
    done: wire.done === true,
  }))
}
