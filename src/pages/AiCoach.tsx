import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { LANGUAGES, useCoach } from '../lib/coach'
import { saveCoachLanguage, type Profile } from '../lib/profile'
import { RobotIcon, SendIcon, UserGlyphIcon } from '../components/Icons'
import {
  BUBBLE,
  BUBBLE_COACH,
  BUBBLE_TRADER,
  CHAT_AVATAR,
  CHAT_AVATAR_COACH,
  CHAT_AVATAR_TRADER,
  COACH_ERROR,
  COACH_GREETING,
  COACH_INTRO,
  COACH_LEDE,
  COACH_PAGE,
  COACH_WARNING,
  COMPOSER,
  LANGUAGE_CHIP,
  LANGUAGE_GATE,
  LANGUAGE_GRID,
  LANGUAGE_LABEL,
  LANGUAGE_NATIVE,
  LANGUAGE_SAVING,
  SUGGESTION,
  SUGGESTION_ROW,
  THREAD,
  TURN,
  TURN_TRADER,
  TYPING,
} from '../components/ui'

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
    <div className={`${TURN} ${LANGUAGE_GATE}`}>
      <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
        <RobotIcon />
      </span>

      <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
        <p>
          Before we start — which language would you like me to use? I&apos;ll stick
          with it from here.
        </p>

        <div className={LANGUAGE_GRID}>
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`${LANGUAGE_CHIP} ${saving === language.code ? LANGUAGE_SAVING : ''}`}
              disabled={saving !== null}
              onClick={() => onChoose(language.code)}
            >
              <span className={LANGUAGE_NATIVE}>{language.native}</span>
              {language.native !== language.label && (
                <span className={LANGUAGE_LABEL}>{language.label}</span>
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
    <div className={COACH_PAGE}>
      <div className={COACH_INTRO}>
        <h2 className={COACH_GREETING}>
          {greeting()}, {name}.
        </h2>
        <p className={COACH_LEDE}>
          {tradeCount === 0
            ? 'Log a few trades and I can start telling you what your numbers actually say.'
            : `I've read your ${tradeCount} logged ${
                tradeCount === 1 ? 'trade' : 'trades'
              }. Ask me anything about how you're doing.`}
        </p>
      </div>

      <div className={THREAD}>
        {language === null ? (
          <LanguagePicker onChoose={chooseLanguage} saving={pendingLanguage} />
        ) : (
          <>
            {!started && (
              <div className={TURN}>
                <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
                  <p>
                    I only talk about your trading here — your results, your habits, and
                    what the journal shows. Ask me why a week went badly, or where your
                    money is actually going.
                  </p>

                  <div className={SUGGESTION_ROW}>
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className={SUGGESTION}
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
                <div className={`${TURN} ${TURN_TRADER}`} key={turn.id}>
                  <div className={`${BUBBLE} ${BUBBLE_TRADER}`}>{turn.text}</div>
                  <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_TRADER}`} aria-hidden="true">
                    <UserGlyphIcon size={17} />
                  </span>
                </div>
              ) : (
                <div className={TURN} key={turn.id}>
                  <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                    <RobotIcon />
                  </span>
                  <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
                    {turn.text.split('\n').map((line, index) =>
                      line.trim() === '' ? null : <p key={index}>{line}</p>,
                    )}
                  </div>
                </div>
              ),
            )}

            {thinking && (
              <div className={TURN}>
                <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className={`${BUBBLE} ${BUBBLE_COACH} px-16 py-14`} aria-label="Coach is thinking">
                  <span className={TYPING}>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className={COACH_ERROR} role="alert">
                {error}
              </p>
            )}
          </>
        )}

        {saveWarning && (
          <p className={COACH_WARNING} role="status">
            {saveWarning}
          </p>
        )}

        <div ref={threadEnd} />
      </div>

      <form className={COMPOSER} onSubmit={handleSubmit}>
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
