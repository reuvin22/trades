import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AuthUser } from '../lib/useAuth'
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
  LANGUAGE_CHANGE,
  LANGUAGE_CHANGE_NAME,
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
  user: AuthUser | null
  profile: Profile | null
  tradeCount: number
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * The stored code shown the way a speaker of it would read it — `Filipino`
 * displays as `Tagalog`. Falls back to the code itself, so a language saved
 * before it was in the list still renders as something rather than blank.
 */
function nativeName(code: string): string {
  return LANGUAGES.find((language) => language.code === code)?.native ?? code
}

const SUGGESTIONS = [
  'How am I actually doing?',
  'Where is my money going?',
  'What should I stop doing?',
]

/**
 * Shown before the first message, and again whenever the trader reopens it.
 *
 * `current` is the language already in force, or null on the first visit — it
 * changes the wording and marks the active chip, so reopening the picker reads
 * as changing a setting rather than being asked the same question twice.
 */
function LanguagePicker({
  onChoose,
  saving,
  current,
}: {
  onChoose: (language: string) => void
  saving: string | null
  current: string | null
}) {
  return (
    <div className={`${TURN} ${LANGUAGE_GATE}`}>
      <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
        <RobotIcon />
      </span>

      <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
        <p>
          {current === null
            ? "Before we start — which language would you like me to use? I'll stick with it from here."
            : "Which language would you like me to use? I'll switch from my next reply onwards."}
        </p>

        <div className={LANGUAGE_GRID}>
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`${LANGUAGE_CHIP} ${
                saving === language.code || (saving === null && current === language.code)
                  ? LANGUAGE_SAVING
                  : ''
              }`}
              disabled={saving !== null}
              aria-current={current === language.code ? 'true' : undefined}
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
  // Held locally as well as on the profile. The save can fail — most
  // often because the security rules have not been published yet — and when it
  // does the conversation must still open rather than stranding the user on a
  // language picker that never advances.
  const [chosenLanguage, setChosenLanguage] = useState<string | null>(null)
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null)
  const [saveWarning, setSaveWarning] = useState('')
  const [draft, setDraft] = useState('')

  // Reopens the picker on a profile that already has a language. Without it
  // the first choice was permanent: the picker rendered only while the
  // language was null, so there was no way back to it, and asking the coach in
  // conversation could not work either — the language is pinned per request,
  // so any switch it agreed to was undone on the next turn.
  const [changing, setChanging] = useState(false)

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
    setChanging(false)
    setSaveWarning('')

    if (user) {
      try {
        await saveCoachLanguage(choice)
      } catch {
        setSaveWarning(
          "I couldn't save that preference, so I'll ask again next time.",
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

        {language !== null && !changing && (
          <button
            type="button"
            className={LANGUAGE_CHANGE}
            onClick={() => setChanging(true)}
          >
            Replying in{' '}
            <span className={LANGUAGE_CHANGE_NAME}>{nativeName(language)}</span> —
            change
          </button>
        )}
      </div>

      <div className={THREAD}>
        {language === null ? (
          <LanguagePicker
            onChoose={chooseLanguage}
            saving={pendingLanguage}
            current={null}
          />
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

            {/* Appended rather than replacing the thread, so changing the
                language does not make the conversation vanish. */}
            {changing && (
              <LanguagePicker
                onChoose={chooseLanguage}
                saving={pendingLanguage}
                current={language}
              />
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

      <form data-tour="coach" className={COMPOSER} onSubmit={handleSubmit}>
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
