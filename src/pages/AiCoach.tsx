import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { LANGUAGES, useCoach } from '../lib/coach'
import { saveCoachLanguage, type Profile } from '../lib/profile'
import { RobotIcon, SendIcon, UserGlyphIcon } from '../components/Icons'
import '../styles/coach.css'

type AiCoachProps = {
  user: User | null
  profile: Profile | null
  tradeCount: number
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const SUGGESTIONS = [
  'How am I actually doing?',
  'Where is my money going?',
  'What should I stop doing?',
]

/** Shown once, before the first message, until a language has been chosen. */
function LanguagePicker({
  onChoose,
  saving,
}: {
  onChoose: (language: string) => void
  saving: string | null
}) {
  return (
    <div className="turn is-coach language-gate">
      <span className="chat-avatar coach" aria-hidden="true">
        <RobotIcon />
      </span>

      <div className="bubble coach">
        <p>
          Before we start — which language would you like me to use? I&apos;ll stick
          with it from here.
        </p>

        <div className="language-grid">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`language-chip${saving === language.code ? ' is-saving' : ''}`}
              disabled={saving !== null}
              onClick={() => onChoose(language.code)}
            >
              <span className="language-native">{language.native}</span>
              {language.native !== language.label && (
                <span className="language-label">{language.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AiCoach({ user, profile, tradeCount }: AiCoachProps) {
  // Held locally as well as on the profile. A Firestore write can fail — most
  // often because the security rules have not been published yet — and when it
  // does the conversation must still open rather than stranding the user on a
  // language picker that never advances.
  const [chosenLanguage, setChosenLanguage] = useState<string | null>(null)
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null)
  const [saveWarning, setSaveWarning] = useState('')
  const [draft, setDraft] = useState('')

  const language = chosenLanguage ?? profile?.coachLanguage ?? null
  const { turns, thinking, error, send } = useCoach(language ?? 'English')
  const threadEnd = useRef<HTMLDivElement>(null)

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, thinking])

  async function chooseLanguage(choice: string) {
    // Advance immediately; persistence is a nice-to-have, not a gate.
    setChosenLanguage(choice)
    setPendingLanguage(choice)
    setSaveWarning('')

    if (user) {
      try {
        await saveCoachLanguage(user.uid, choice)
      } catch {
        setSaveWarning(
          "I couldn't save that preference, so I'll ask again next time. Publishing firestore.rules fixes it.",
        )
      }
    }

    setPendingLanguage(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const message = draft.trim()
    if (message === '' || thinking) return
    setDraft('')
    await send(message)
  }

  const name = user?.displayName?.split(' ')[0] ?? 'there'
  const started = turns.length > 0

  return (
    <div className="coach-page">
      <div className="coach-intro">
        <h2 className="coach-greeting">
          {greeting()}, {name}.
        </h2>
        <p className="coach-lede">
          {tradeCount === 0
            ? 'Log a few trades and I can start telling you what your numbers actually say.'
            : `I've read your ${tradeCount} logged ${
                tradeCount === 1 ? 'trade' : 'trades'
              }. Ask me anything about how you're doing.`}
        </p>
      </div>

      <div className="thread">
        {language === null ? (
          <LanguagePicker onChoose={chooseLanguage} saving={pendingLanguage} />
        ) : (
          <>
            {!started && (
              <div className="turn is-coach">
                <span className="chat-avatar coach" aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className="bubble coach">
                  <p>
                    I only talk about your trading here — your results, your habits, and
                    what the journal shows. Ask me why a week went badly, or where your
                    money is actually going.
                  </p>

                  <div className="suggestions">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="suggestion"
                        onClick={() => void send(suggestion)}
                        disabled={thinking}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {turns.map((turn) =>
              turn.role === 'user' ? (
                <div className="turn is-trader" key={turn.id}>
                  <div className="bubble trader">{turn.text}</div>
                  <span className="chat-avatar trader" aria-hidden="true">
                    <UserGlyphIcon size={17} />
                  </span>
                </div>
              ) : (
                <div className="turn is-coach" key={turn.id}>
                  <span className="chat-avatar coach" aria-hidden="true">
                    <RobotIcon />
                  </span>
                  <div className="bubble coach">
                    {turn.text.split('\n').map((line, index) =>
                      line.trim() === '' ? null : <p key={index}>{line}</p>,
                    )}
                  </div>
                </div>
              ),
            )}

            {thinking && (
              <div className="turn is-coach">
                <span className="chat-avatar coach" aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className="bubble coach is-typing" aria-label="Coach is thinking">
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="coach-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}

        {saveWarning && (
          <p className="coach-warning" role="status">
            {saveWarning}
          </p>
        )}

        <div ref={threadEnd} />
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            language === null
              ? 'Pick a language to begin…'
              : 'Ask about a session, a habit, or a losing streak…'
          }
          aria-label="Message the AI coach"
          disabled={language === null || thinking}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={language === null || thinking || draft.trim() === ''}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  )
}
