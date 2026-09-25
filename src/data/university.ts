/**
 * The coaching roster, as fixtures.
 *
 * Same standing as `data/community.ts`: there is no enrolment endpoint yet,
 * so this is the shape the screen needs rather than anything the API returns.
 *
 * What is deliberately *not* here: trade counts, win rates, P&L, discipline.
 * Those are derived from `data/studentJournal.ts` by the product's own
 * `deriveStats` and `disciplineScore`, the same functions the trader's own
 * dashboard uses. A number typed here would be a number that could disagree
 * with the student's page, and the roster exists to be clicked through.
 *
 * What stays here is what a journal cannot tell you: who someone is, where
 * they are in the programme, and what the coach has done with them.
 */

export type StudentLevel = 'foundation' | 'developing' | 'consistent' | 'funded'

export const LEVEL_LABEL: Record<StudentLevel, string> = {
  foundation: 'Foundation',
  developing: 'Developing',
  consistent: 'Consistent',
  funded: 'Funded',
}

export type Student = {
  uid: string
  name: string
  email: string
  level: StudentLevel
  /** How much of the programme is behind them, 0–100. */
  progress: number
  lastActive: string
  enrolled: string
  /** Set when the student has asked for a journal review and not had one. */
  awaitingReview?: boolean
}

export type EnrolmentRequest = {
  uid: string
  name: string
  email: string
  note: string
  age: string
}

export const UNIVERSITY = {
  name: 'Hernandez Trading Desk',
  blurb: 'Process-first coaching. Twelve weeks, one journal, no signals.',
  cohort: 'Autumn cohort',
}

export const STUDENTS: Student[] = [
  {
    uid: 's-mia',
    name: 'Mia Torres',
    email: 'mia.torres@example.com',
    level: 'consistent',
    progress: 74,
    lastActive: '2h',
    enrolled: 'March 2026',
  },
  {
    uid: 's-ade',
    name: 'Ade Fashola',
    email: 'ade.f@example.com',
    level: 'funded',
    progress: 96,
    lastActive: '5h',
    enrolled: 'January 2026',
    awaitingReview: true,
  },
  {
    uid: 's-priya',
    name: 'Priya Raman',
    email: 'priya.r@example.com',
    level: 'developing',
    progress: 48,
    lastActive: '1d',
    enrolled: 'May 2026',
    awaitingReview: true,
  },
  {
    uid: 's-jae',
    name: 'Jae Kwon',
    email: 'jae.kwon@example.com',
    level: 'developing',
    progress: 35,
    lastActive: '2d',
    enrolled: 'June 2026',
  },
  {
    uid: 's-nadia',
    name: 'Nadia Haddad',
    email: 'nadia.h@example.com',
    level: 'foundation',
    progress: 14,
    lastActive: '4d',
    enrolled: 'August 2026',
  },
  {
    uid: 's-tom',
    name: 'Tom Whitfield',
    email: 't.whitfield@example.com',
    level: 'foundation',
    progress: 6,
    lastActive: '9d',
    enrolled: 'September 2026',
  },
]

export const STUDENT_BY_UID: Record<string, Student> = Object.fromEntries(
  STUDENTS.map((student) => [student.uid, student]),
)

export const REQUESTS: EnrolmentRequest[] = [
  {
    uid: 'r-elena',
    name: 'Elena Duarte',
    email: 'elena.d@example.com',
    note: 'Two years on FX, no written plan. Want the process side.',
    age: '1d',
  },
  {
    uid: 'r-marcus',
    name: 'Marcus Bell',
    email: 'm.bell@example.com',
    note: 'Failed two prop challenges on the same mistake.',
    age: '3d',
  },
]

/* --------------------------------------------------------- coaching notes */

export type CoachingEventKind = 'review' | 'milestone' | 'flag' | 'note'

export type CoachingEvent = {
  id: string
  kind: CoachingEventKind
  title: string
  body: string
  age: string
}

export const EVENT_LABEL: Record<CoachingEventKind, string> = {
  review: 'Review',
  milestone: 'Milestone',
  flag: 'Flag',
  note: 'Note',
}

/**
 * What the coach has done, which a journal cannot show.
 *
 * The rest of a student's timeline — trades, wins, breaks — is read off their
 * journal rather than written here, so it can never drift from the numbers on
 * the same page.
 */
export const COACHING_EVENTS: Record<string, CoachingEvent[]> = {
  's-mia': [
    {
      id: 'e-mia-1',
      kind: 'milestone',
      title: 'Moved up to Consistent',
      body: 'Four straight weeks inside the risk plan with no rule breaks on entry.',
      age: '6d',
    },
    {
      id: 'e-mia-2',
      kind: 'review',
      title: 'Weekly journal review',
      body: 'Cutting the 09:45 continuation was the whole change. Told her to leave it alone for another month before adding anything back.',
      age: '13d',
    },
  ],
  's-ade': [
    {
      id: 'e-ade-1',
      kind: 'milestone',
      title: 'Passed phase 2',
      body: 'Funded on the 50k account. Risk drops to 0.5% per trade from here.',
      age: '3d',
    },
    {
      id: 'e-ade-2',
      kind: 'note',
      title: 'Asked for a review',
      body: 'Wants a second read on the Thursday session before next week.',
      age: '5h',
    },
  ],
  's-priya': [
    {
      id: 'e-priya-1',
      kind: 'flag',
      title: 'Size, not direction',
      body: 'Three of five losses last week were oversized on the same setup. Same trades at half risk is a flat week.',
      age: '2d',
    },
    {
      id: 'e-priya-2',
      kind: 'review',
      title: 'Weekly journal review',
      body: 'Asked her to log a rule break even when the trade closes green.',
      age: '9d',
    },
  ],
  's-jae': [
    {
      id: 'e-jae-1',
      kind: 'note',
      title: 'Session focus',
      body: 'Sticking to London only for the next fortnight. New York entries were the bulk of the damage.',
      age: '4d',
    },
  ],
  's-nadia': [
    {
      id: 'e-nadia-1',
      kind: 'flag',
      title: 'Journalling gaps',
      body: 'Half the entries have no rule answers filled in, so discipline cannot be read yet.',
      age: '4d',
    },
  ],
  's-tom': [
    {
      id: 'e-tom-1',
      kind: 'note',
      title: 'Just started',
      body: 'Four trades in. Nothing to read yet — the point of this month is the habit, not the numbers.',
      age: '9d',
    },
  ],
}

/** What a student sees instead of a roster: the person teaching them. */
export const MY_COACH = {
  uid: 'p-dan',
  name: 'Daniel Okafor',
  email: 'd.okafor@example.com',
  note: 'Reviews your journal every Friday. Message him anything before Thursday evening and it goes in that week.',
}

/** And who else is in the cohort with them. */
export const CLASSMATES = STUDENTS.slice(0, 4)
