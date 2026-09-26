import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'

/**
 * Agreements to sign and forms to answer, through the API.
 *
 * One shape for both. An agreement is prose with a signature line; a form is
 * questions with answers. They share a list, a permission model and a
 * submission, so splitting them here would mean two of everything for one
 * difference that a discriminator already carries.
 *
 * Who sees what is decided on the server: a coach gets their own documents
 * including drafts, a student gets their coach's published ones. This file
 * asks the same endpoint either way and renders whatever comes back.
 */

export type DocumentKind = 'agreement' | 'form'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'scale'

export const QUESTION_LABEL: Record<QuestionType, string> = {
  short_text: 'Short answer',
  long_text: 'Long answer',
  single_choice: 'Choose one',
  multi_choice: 'Choose several',
  scale: 'Scale of 1 to 5',
}

export const SCALE_MIN = 1
export const SCALE_MAX = 5

export type Question = {
  id: string
  type: QuestionType
  prompt: string
  helpText: string
  required: boolean
  choices: string[]
}

export type UniversityDocument = {
  id: string
  coachUid: string
  kind: DocumentKind
  title: string
  summary: string
  bodyHtml: string
  questions: Question[]
  required: boolean
  published: boolean
  /** The form an invited trader answers before joining. At most one per coach. */
  isIntake: boolean
  createdAt: Date | null
  updatedAt: Date | null
  /** Coach only: how many students have completed it. */
  submissionCount: number | null
  /** Student only: when they completed it, if they have. */
  submittedAt: Date | null
}

export type Answer = {
  questionId: string
  value: string
  values: string[]
}

export type Submission = {
  documentId: string
  studentUid: string
  studentName: string
  studentEmail: string
  signedName: string
  answers: Answer[]
  submittedAt: Date | null
  documentDigest: string
}

type Wire = Record<string, unknown>

function toQuestion(wire: Wire): Question {
  return {
    id: String(wire.id ?? ''),
    type: (wire.type as QuestionType) ?? 'short_text',
    prompt: String(wire.prompt ?? ''),
    helpText: String(wire.help_text ?? ''),
    required: wire.required === true,
    choices: Array.isArray(wire.choices)
      ? wire.choices.filter((c): c is string => typeof c === 'string')
      : [],
  }
}

function toDocument(wire: Wire): UniversityDocument {
  return {
    id: String(wire.id ?? ''),
    coachUid: String(wire.coach_uid ?? ''),
    kind: wire.kind === 'form' ? 'form' : 'agreement',
    title: String(wire.title ?? ''),
    summary: String(wire.summary ?? ''),
    bodyHtml: String(wire.body_html ?? ''),
    questions: Array.isArray(wire.questions)
      ? wire.questions.map((q) => toQuestion(q as Wire))
      : [],
    required: wire.required !== false,
    published: wire.published === true,
    isIntake: wire.is_intake === true,
    createdAt: date(wire.created_at),
    updatedAt: date(wire.updated_at),
    submissionCount:
      wire.submission_count === null || wire.submission_count === undefined
        ? null
        : Number(wire.submission_count),
    submittedAt: date(wire.submitted_at),
  }
}

function toAnswer(wire: Wire): Answer {
  return {
    questionId: String(wire.question_id ?? ''),
    value: String(wire.value ?? ''),
    values: Array.isArray(wire.values)
      ? wire.values.filter((v): v is string => typeof v === 'string')
      : [],
  }
}

function toSubmission(wire: Wire): Submission {
  return {
    documentId: String(wire.document_id ?? ''),
    studentUid: String(wire.student_uid ?? ''),
    studentName: String(wire.student_name ?? ''),
    studentEmail: String(wire.student_email ?? ''),
    signedName: String(wire.signed_name ?? ''),
    answers: Array.isArray(wire.answers)
      ? wire.answers.map((a) => toAnswer(a as Wire))
      : [],
    submittedAt: date(wire.submitted_at),
    documentDigest: String(wire.document_digest ?? ''),
  }
}

/** A new document, before it has been saved. */
export function blankDocument(kind: DocumentKind): UniversityDocument {
  return {
    id: '',
    coachUid: '',
    kind,
    title: '',
    summary: '',
    bodyHtml: '',
    questions: [],
    required: true,
    published: false,
    isIntake: false,
    createdAt: null,
    updatedAt: null,
    submissionCount: null,
    submittedAt: null,
  }
}

export function blankQuestion(type: QuestionType = 'short_text'): Question {
  return {
    // Empty, so the server mints it. A client-chosen id could collide with
    // one already carrying answers.
    id: '',
    type,
    prompt: '',
    helpText: '',
    required: false,
    choices: type === 'single_choice' || type === 'multi_choice' ? ['', ''] : [],
  }
}

function body(document: UniversityDocument) {
  return {
    kind: document.kind,
    title: document.title,
    summary: document.summary,
    body_html: document.bodyHtml,
    questions: document.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      help_text: question.helpText,
      required: question.required,
      choices: question.choices,
    })),
    required: document.required,
    published: document.published,
    is_intake: document.isIntake,
  }
}

/* ------------------------------------------------------------------ reads */

export type DocumentsState = {
  documents: UniversityDocument[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useDocuments(uid: string | null): DocumentsState {
  const [documents, setDocuments] = useState<UniversityDocument[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    apiFetch<{ documents: Wire[] }>('/api/v1/university/documents', {
      signal: abort.signal,
    })
      .then((page) => {
        setDocuments(page.documents.map(toDocument))
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

  if (uid === null) {
    return { documents: [], loading: false, error: null, reload }
  }

  return { documents, loading: loadedFor !== uid, error, reload }
}

export async function fetchDocument(id: string): Promise<UniversityDocument> {
  return toDocument(await apiFetch<Wire>(`/api/v1/university/documents/${id}`))
}

export async function fetchSubmissions(
  id: string,
): Promise<{ submissions: Submission[]; outstanding: string[] }> {
  const page = await apiFetch<{ submissions: Wire[]; outstanding: string[] }>(
    `/api/v1/university/documents/${id}/submissions`,
  )

  return {
    submissions: page.submissions.map(toSubmission),
    outstanding: page.outstanding,
  }
}

/* ----------------------------------------------------------------- writes */

export async function saveDocument(
  document: UniversityDocument,
): Promise<UniversityDocument> {
  const created = document.id === ''

  return toDocument(
    await apiFetch<Wire>(
      created
        ? '/api/v1/university/documents'
        : `/api/v1/university/documents/${document.id}`,
      { method: created ? 'POST' : 'PUT', body: body(document) },
    ),
  )
}

export function deleteDocument(id: string): Promise<unknown> {
  return apiFetch(`/api/v1/university/documents/${id}`, { method: 'DELETE' })
}

export async function submitDocument(
  id: string,
  signedName: string,
  answers: Answer[],
): Promise<Submission> {
  return toSubmission(
    await apiFetch<Wire>(`/api/v1/university/documents/${id}/submit`, {
      method: 'POST',
      body: {
        signed_name: signedName,
        answers: answers.map((answer) => ({
          question_id: answer.questionId,
          value: answer.value,
          values: answer.values,
        })),
      },
    }),
  )
}
