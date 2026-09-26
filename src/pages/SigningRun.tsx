import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '../components/Icons'
import {
  CARD,
  EMPTY_BLOCK,
  MUTED_NOTE,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  UNI_LOADING,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import { navigate } from '../lib/useHashRoute'
import { fetchNextDocument } from '../lib/university'

/**
 * The signing run: accepted, now sign what the University asks for.
 *
 * A relay rather than a screen. It asks the API what is next and goes there,
 * and every document sends the reader back here when it is submitted — so a
 * student is walked through the set instead of being handed a list and left
 * to work out what is still outstanding.
 *
 * That is also why it exists at all. A student was landing on My University
 * after accepting, where the documents were a section they had to notice; if
 * anything about that list failed to arrive they saw nothing and had no way
 * to tell that something was expected of them. Here, the only thing that can
 * fail is a single lookup, and it says so.
 */
export function SigningRun() {
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const abort = new AbortController()

    fetchNextDocument()
      .then((next) => {
        if (abort.signal.aborted) return

        if (next.documentId !== '') {
          // Replaces this entry rather than stacking, so Back from a document
          // does not land on a relay that immediately forwards again.
          navigate(`university/doc/${next.documentId}`)
          return
        }

        setFinished(true)
      })
      .catch((cause: unknown) => {
        if (!abort.signal.aborted) setError(readableApiError(cause))
      })

    return () => abort.abort()
  }, [])

  if (error !== null) {
    return (
      <>
        <div className={PAGE_HEAD}>
          <div>
            <h2 className={PAGE_TITLE}>Something went wrong</h2>
            <p className={PAGE_SUB}>We could not work out what to show you next.</p>
          </div>
        </div>

        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{error}</p>
          <p className={MUTED_NOTE}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={() => navigate('university')}
            >
              Go to My University
            </button>
          </p>
        </section>
      </>
    )
  }

  if (!finished) {
    return (
      <section className={CARD}>
        <p className={UNI_LOADING}>Finding what is next…</p>
      </section>
    )
  }

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>All done</h2>
          <p className={PAGE_SUB}>
            Everything is signed, so your enrolment is complete.
          </p>
        </div>
      </div>

      <section className={`${CARD} ${EMPTY_BLOCK}`}>
        <p>
          <CheckCircleIcon size={18} /> You are enrolled.
        </p>
        <p className={MUTED_NOTE}>
          Your coach can now see your journal and review your trades with you.
        </p>
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
