import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AuthUser } from '../lib/useAuth'
import { LANGUAGES, useCoach } from '../lib/coach'
import { saveCoachLanguage, type Profile } from '../lib/profile'
import { coachCopy, type CoachCopy } from '../data/coachCopy'
import { toBlocks } from '../lib/replyBlocks'
import { ACCEPTED, imageFromPaste, prepareChart } from '../lib/chartImage'
import {
  CloseIcon,
  ImageIcon,
  RobotIcon,
  SendIcon,
  UserGlyphIcon,
} from '../components/Icons'
import {
  BUBBLE,
  BUBBLE_COACH,
  BUBBLE_TRADER,
  CHAT_AVATAR,
  CHAT_AVATAR_COACH,
  CHAT_AVATAR_TRADER,
  CHART_DROP,
  CHART_SENT,
  CHART_THUMB,
  CHART_TRAY,
  CHART_TRAY_NAME,
  CHART_TRAY_NOTE,
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
  REPLY_ITEM,
  REPLY_POINTS,
  REPLY_STEPS,
  SUGGESTION,
  SUGGESTION_ROW,
  THREAD,
  THREAD_ANCHOR,
  THREAD_REPLY,
  TURN,
  TURN_TRADER,
  TYPING,
} from '../components/ui'

type AiCoachProps = {
  user: AuthUser | null
  profile: Profile | null
  tradeCount: number
}

function greeting(copy: CoachCopy): string {
  const hour = new Date().getHours()
  if (hour < 12) return copy.morning
  if (hour < 18) return copy.afternoon
  return copy.evening
}

/**
 * The stored code shown the way a speaker of it would read it — `Filipino`
 * displays as `Tagalog`. Falls back to the code itself, so a language saved
 * before it was in the list still renders as something rather than blank.
 */
function nativeName(code: string): string {
  return LANGUAGES.find((language) => language.code === code)?.native ?? code
}

/**
 * One coach reply: paragraphs, and the step lists inside them.
 *
 * Steps are numbered when the order is part of the instruction — do this, then
 * this — and bulleted when it is a set of things that stand on their own. The
 * coach decides which; this only renders what it chose.
 */
function Reply({
  text,
  onChoose,
}: {
  text: string
  /** Absent on older turns: a fork the coach put two messages ago has already
   *  been answered, and leaving it live invites the trader to re-answer it. */
  onChoose?: (option: string) => void
}) {
  return (
    <>
      {toBlocks(text).map((block, index) => {
        if (block.kind === 'paragraph') return <p key={index}>{block.text}</p>

        if (block.kind === 'choice') {
          return (
            <div className={SUGGESTION_ROW} key={index}>
              {block.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={SUGGESTION}
                  disabled={!onChoose}
                  // Sent as if they had typed it. The whole conversation and
                  // persistence path then works unchanged, and the answer
                  // reads back in the thread as something they said.
                  onClick={() => onChoose?.(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )
        }

        const List = block.kind === 'steps' ? 'ol' : 'ul'
        return (
          <List
            key={index}
            className={block.kind === 'steps' ? REPLY_STEPS : REPLY_POINTS}
          >
            {block.items.map((item, position) => (
              <li key={position} className={REPLY_ITEM}>
                {item}
              </li>
            ))}
          </List>
        )
      })}
    </>
  )
}

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
  copy,
}: {
  onChoose: (language: string) => void
  saving: string | null
  current: string | null
  copy: CoachCopy
}) {
  return (
    <div className={`${TURN} ${LANGUAGE_GATE}`}>
      <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
        <RobotIcon />
      </span>

      <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
        <p>{current === null ? copy.pickFirst : copy.pickAgain}</p>

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

  // The chart waiting to go with the next message, already downscaled.
  const [chart, setChart] = useState<string | null>(null)
  const [chartError, setChartError] = useState('')

  // Reopens the picker on a profile that already has a language. Without it
  // the first choice was permanent: the picker rendered only while the
  // language was null, so there was no way back to it, and asking the coach in
  // conversation could not work either — the language is pinned per request,
  // so any switch it agreed to was undone on the next turn.
  const [changing, setChanging] = useState(false)

  const language = chosenLanguage ?? profile?.coachLanguage ?? null

  // Every fixed string on this page, in the chosen language. The coach's
  // replies were always translated; the page around them was not, so a Korean
  // coach used to sit inside an English page offering English questions.
  const copy = coachCopy(language)

  const { turns, thinking, error, loading, send } = useCoach(language ?? 'English')
  const threadEnd = useRef<HTMLDivElement>(null)
  const newestReply = useRef<HTMLDivElement>(null)

  /*
   * Keep the newest turn in view as the conversation grows.
   *
   * Two things were wrong with doing this on its own. The scroll ran in the
   * effect, before the browser had laid out a reply that had just made the
   * page several hundred pixels taller, so it landed short of the bottom it
   * was aiming at — hence the frame.
   *
   * And the bottom is not always where to land. The coach answers in
   * paragraphs now; dropping someone at the end of one means scrolling back up
   * to find where it started. So a reply too tall to take in at a glance gets
   * its first line put at the top of the screen instead, and everything else —
   * short answers, the trader's own message, the thinking dots — stays pinned
   * to the bottom the way a conversation should be.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reply = newestReply.current
      const tall =
        !thinking &&
        reply !== null &&
        reply.getBoundingClientRect().height > window.innerHeight * 0.7

      if (tall) {
        reply.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    })

    return () => cancelAnimationFrame(frame)
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
        // In the language they just picked, not the one they are leaving.
        setSaveWarning(coachCopy(choice).saveWarning)
      }
    }

    setPendingLanguage(null)
  }

  /**
   * Take one image from a paste or a file picker.
   *
   * Shrunk before it is held, not at send time: the trader sees the thumbnail
   * only once it is something the API will actually accept, so a photograph
   * too big to send fails here rather than after they have written a question
   * to go with it.
   */
  async function attach(file: File | null) {
    if (!file) return
    setChartError('')

    try {
      setChart(await prepareChart(file))
    } catch (cause) {
      setChartError(cause instanceof Error ? cause.message : copy.chartFailed)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const message = draft.trim()
    if ((message === '' && !chart) || thinking) return

    const attached = chart
    setDraft('')
    setChart(null)
    setChartError('')
    await send(message, attached ?? undefined)
  }

  const name = user?.displayName?.split(' ')[0] ?? 'there'
  // Also while the stored conversation is still arriving, so the opening
  // bubble does not flash up and get replaced by history a moment later.
  const started = turns.length > 0 || loading

  return (
    <div className={COACH_PAGE}>
      <div className={COACH_INTRO}>
        <h2 className={COACH_GREETING}>
          {greeting(copy)}, {name}.
        </h2>
        <p className={COACH_LEDE}>
          {tradeCount === 0 ? copy.ledeEmpty : copy.lede(tradeCount)}
        </p>

        {language !== null && !changing && (
          <button
            type="button"
            className={LANGUAGE_CHANGE}
            onClick={() => setChanging(true)}
          >
            {copy.replyingIn}{' '}
            <span className={LANGUAGE_CHANGE_NAME}>{nativeName(language)}</span> —{' '}
            {copy.change}
          </button>
        )}
      </div>

      <div className={THREAD}>
        {language === null ? (
          <LanguagePicker
            onChoose={chooseLanguage}
            saving={pendingLanguage}
            current={null}
            copy={copy}
          />
        ) : (
          <>
            {!started && (
              <div className={TURN}>
                <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
                  <p>{copy.intro}</p>

                  <div className={SUGGESTION_ROW}>
                    {copy.suggestions.map((suggestion) => (
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
                  <div className={`${BUBBLE} ${BUBBLE_TRADER}`}>
                    {turn.text}
                    {turn.image && (
                      <img className={CHART_SENT} src={turn.image} alt="Chart you sent" />
                    )}
                  </div>
                  <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_TRADER}`} aria-hidden="true">
                    <UserGlyphIcon size={17} />
                  </span>
                </div>
              ) : (
                <div
                  className={`${TURN} ${THREAD_REPLY}`}
                  key={turn.id}
                  // Only the newest, and only if it is the last thing in the
                  // thread — that is the one the scroll may need to align to.
                  ref={turn.id === turns[turns.length - 1]?.id ? newestReply : null}
                >
                  <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                    <RobotIcon />
                  </span>
                  <div className={`${BUBBLE} ${BUBBLE_COACH}`}>
                    <Reply
                      text={turn.text}
                      onChoose={
                        turn.id === turns[turns.length - 1]?.id && !thinking
                          ? (option) => void send(option)
                          : undefined
                      }
                    />
                  </div>
                </div>
              ),
            )}

            {thinking && (
              <div className={TURN}>
                <span className={`${CHAT_AVATAR} ${CHAT_AVATAR_COACH}`} aria-hidden="true">
                  <RobotIcon />
                </span>
                <div className={`${BUBBLE} ${BUBBLE_COACH} px-16 py-14`} aria-label={copy.thinkingLabel}>
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
                copy={copy}
              />
            )}
          </>
        )}

        {saveWarning && (
          <p className={COACH_WARNING} role="status">
            {saveWarning}
          </p>
        )}

        <div ref={threadEnd} className={THREAD_ANCHOR} />
      </div>

      <div className="sticky bottom-16 flex flex-col gap-8">
        {chart && (
          <div className={CHART_TRAY}>
            <img className={CHART_THUMB} src={chart} alt="" />
            <span className={CHART_TRAY_NAME}>
              {copy.chartReady}
              <span className={CHART_TRAY_NOTE}>{copy.chartHint}</span>
            </span>
            <button
              type="button"
              className={CHART_DROP}
              onClick={() => setChart(null)}
              aria-label={copy.chartRemove}
            >
              <CloseIcon size={15} />
            </button>
          </div>
        )}

        {chartError && (
          <p className={COACH_WARNING} role="status">
            {chartError}
          </p>
        )}

        <form
          data-tour="coach"
          className={COMPOSER}
          onSubmit={handleSubmit}
          // On the form, not the input: a paste lands wherever the caret is,
          // and a trader who has just taken a screenshot has usually not
          // clicked into the text field first.
          onPaste={(event) => void attach(imageFromPaste(event.clipboardData.items))}
        >
          <label className={CHART_DROP} title={copy.chartAdd}>
            <ImageIcon />
            <span className="sr-only">{copy.chartAdd}</span>
            <input
              type="file"
              accept={ACCEPTED}
              className="hidden"
              disabled={language === null || thinking}
              onChange={(event) => {
                void attach(event.target.files?.[0] ?? null)
                // Cleared so picking the same file twice still fires change.
                event.target.value = ''
              }}
            />
          </label>

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              language === null
                ? copy.placeholderLocked
                : chart
                  ? copy.placeholderChart
                  : copy.placeholder
            }
            aria-label={copy.composerLabel}
            disabled={language === null || thinking}
          />
          <button
            type="submit"
            aria-label={copy.sendLabel}
            disabled={
              language === null || thinking || (draft.trim() === '' && !chart)
            }
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  )
}
