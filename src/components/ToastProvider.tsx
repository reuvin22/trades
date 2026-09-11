import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ToastContext,
  TOAST_LEAVE_MS,
  TOAST_LIFETIME,
  TOAST_MAX_VISIBLE,
  type Toast,
  type ToastApi,
  type ToastTone,
} from '../lib/toast'
import { AlertIcon, CheckIcon, CloseIcon, SparkleIcon } from './Icons'
import {
  TOAST,
  TOAST_BODY,
  TOAST_CLOSE,
  TOAST_ENTER,
  TOAST_GLYPH,
  TOAST_GLYPH_TONE,
  TOAST_LEAVE,
  TOAST_TITLE,
  TOAST_TONE,
  TOAST_VIEWPORT,
} from './ui'

const GLYPHS: Record<ToastTone, typeof AlertIcon> = {
  success: CheckIcon,
  error: AlertIcon,
  info: SparkleIcon,
}

/**
 * Outcome notifications for anything that writes.
 *
 * A toast is the right shape for this because the thing that started the work
 * is often gone by the time it finishes — the dialog has closed, the page has
 * moved on. It says what happened, in the app's own colours rather than a
 * browser alert, and gets out of the way on its own.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<number, number>())
  const nextId = useRef(0)

  const drop = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    timers.current.delete(id)
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      // Flag it first so the exit animation can run, then remove it.
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      )

      window.clearTimeout(timers.current.get(id))
      timers.current.set(id, window.setTimeout(() => drop(id), TOAST_LEAVE_MS))
    },
    [drop],
  )

  const push = useCallback(
    (tone: ToastTone, title: string, body?: string) => {
      const id = nextId.current++

      setToasts((current) => [
        ...current.slice(-(TOAST_MAX_VISIBLE - 1)),
        { id, tone, title, body },
      ])
      timers.current.set(id, window.setTimeout(() => dismiss(id), TOAST_LIFETIME[tone]))
    },
    [dismiss],
  )

  // Clear every pending timer if the tree goes away mid-flight.
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, body) => push('success', title, body),
      error: (title, body) => push('error', title, body),
      info: (title, body) => push('info', title, body),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* aria-live so the outcome is announced without stealing focus. */}
      <div className={TOAST_VIEWPORT} role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Glyph = GLYPHS[toast.tone]

          return (
            <div
              key={toast.id}
              className={`${TOAST} ${TOAST_TONE[toast.tone]} ${
                toast.leaving ? TOAST_LEAVE : TOAST_ENTER
              }`}
            >
              <span className={`${TOAST_GLYPH} ${TOAST_GLYPH_TONE[toast.tone]}`}>
                <Glyph size={13} />
              </span>

              <div className="min-w-0 flex-1">
                <p className={TOAST_TITLE}>{toast.title}</p>
                {toast.body && <p className={TOAST_BODY}>{toast.body}</p>}
              </div>

              <button
                type="button"
                className={TOAST_CLOSE}
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                <CloseIcon size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
