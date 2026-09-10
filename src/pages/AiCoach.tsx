import { useState } from 'react'
import { RevengeChart } from '../components/RevengeChart'
import { CONVERSATION, TRADER_NAME, type ChatMessage } from '../data/coach'
import { RobotIcon, SendIcon, UserGlyphIcon } from '../components/Icons'
import '../styles/coach.css'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Message({ message }: { message: ChatMessage }) {
  if (message.from === 'trader') {
    return (
      <div className="turn is-trader">
        <div className="bubble trader">{message.text}</div>
        <span className="chat-avatar trader" aria-hidden="true">
          <UserGlyphIcon size={17} />
        </span>
      </div>
    )
  }

  return (
    <div className="turn is-coach">
      <span className="chat-avatar coach" aria-hidden="true">
        <RobotIcon />
      </span>
      <div className="bubble coach">
        {message.paragraphs.map((paragraph, index) => (
          <div key={index}>
            <p>{paragraph}</p>
            {message.chart && index === 0 && <RevengeChart />}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AiCoach() {
  const [draft, setDraft] = useState('')

  return (
    <div className="coach-page">
      <div className="coach-intro">
        <h2 className="coach-greeting">
          {greeting()}, {TRADER_NAME}.
        </h2>
        <p className="coach-lede">
          Your trading sessions are fully indexed. I&apos;m ready to analyze your last 30
          trades on SPY and NQ.
        </p>
      </div>

      <div className="thread">
        {CONVERSATION.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        <div className="turn is-coach">
          <span className="chat-avatar coach" aria-hidden="true">
            <RobotIcon />
          </span>
          <div className="bubble coach is-typing" aria-label="Coach is typing">
            <span className="typing">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          setDraft('')
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about a session, a ticker, or a habit..."
          aria-label="Message the AI coach"
        />
        <button type="submit" aria-label="Send message" disabled={draft.trim() === ''}>
          <SendIcon />
        </button>
      </form>
    </div>
  )
}
