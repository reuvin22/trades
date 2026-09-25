/**
 * The coaching roster, as fixtures.
 *
 * Same standing as `data/community.ts`: there is no enrolment endpoint yet,
 * so this is the shape the screen needs rather than anything the API returns.
 *
 * Every figure here is the kind the backend derives and the client never
 * supplies — win rate, trade count, discipline. They are written out as plain
 * numbers because nothing computes them yet; when the API grows a roster
 * these become a response and the page stops importing this file.
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
  /** Trades logged since enrolling. */
  trades: number
  winRate: number
  /** How much of the programme is behind them, 0–100. */
  progress: number
  /** Rules followed as a share of trades — the number the coach reads first. */
  discipline: number
  lastActive: string
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
    trades: 128,
    winRate: 54,
    progress: 74,
    discipline: 91,
    lastActive: '2h',
  },
  {
    uid: 's-ade',
    name: 'Ade Fashola',
    email: 'ade.f@example.com',
    level: 'funded',
    trades: 203,
    winRate: 49,
    progress: 96,
    discipline: 88,
    lastActive: '5h',
    awaitingReview: true,
  },
  {
    uid: 's-priya',
    name: 'Priya Raman',
    email: 'priya.r@example.com',
    level: 'developing',
    trades: 61,
    winRate: 44,
    progress: 48,
    discipline: 62,
    lastActive: '1d',
    awaitingReview: true,
  },
  {
    uid: 's-jae',
    name: 'Jae Kwon',
    email: 'jae.kwon@example.com',
    level: 'developing',
    trades: 37,
    winRate: 51,
    progress: 35,
    discipline: 77,
    lastActive: '2d',
  },
  {
    uid: 's-nadia',
    name: 'Nadia Haddad',
    email: 'nadia.h@example.com',
    level: 'foundation',
    trades: 12,
    winRate: 33,
    progress: 14,
    discipline: 58,
    lastActive: '4d',
  },
  {
    uid: 's-tom',
    name: 'Tom Whitfield',
    email: 't.whitfield@example.com',
    level: 'foundation',
    trades: 4,
    winRate: 25,
    progress: 6,
    discipline: 41,
    lastActive: '9d',
  },
]

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

/** What a student sees instead of a roster: the person teaching them. */
export const MY_COACH = {
  uid: 'p-dan',
  name: 'Daniel Okafor',
  email: 'd.okafor@example.com',
  note: 'Reviews your journal every Friday. Message him anything before Thursday evening and it goes in that week.',
}

/** And who else is in the cohort with them. */
export const CLASSMATES = STUDENTS.slice(0, 4)
