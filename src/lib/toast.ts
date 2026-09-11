import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  tone: ToastTone
  title: string
  body?: string
  /** Set while the toast animates out, just before it is dropped. */
  leaving?: boolean
}

export type ToastApi = {
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
  dismiss: (id: number) => void
}

/**
 * How long a toast sits before retiring itself. Errors linger — they are the
 * ones worth reading twice, and the ones a trader may need to act on.
 */
export const TOAST_LIFETIME: Record<ToastTone, number> = {
  success: 4000,
  info: 4500,
  error: 7000,
}

/** Must match the leave animation in index.css, or a toast is yanked mid-slide. */
export const TOAST_LEAVE_MS = 180

/** More than a few stacked is noise rather than feedback. */
export const TOAST_MAX_VISIBLE = 3

export const ToastContext = createContext<ToastApi | null>(null)

/**
 * The app-wide way to report the outcome of something the trader did.
 *
 * Use it for work that finishes away from the control that started it — a save
 * that closes its dialog, a plan change, a delete. Validation that belongs
 * beside a field stays beside the field.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside a ToastProvider.')
  return api
}
