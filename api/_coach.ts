import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TradeSummary } from './_trade-summary'
import { complete, type ChatMessage } from './_openrouter'

/**
 * The AI Coach conversation.
 *
 * Two constraints shape the prompt. It must stay inside this app — a trading
 * journal is not a general assistant, and a coach that answers anything at all
 * invites questions it has no business answering, like what to buy next. And it
 * must sound like a person, because the numbers are already on the dashboard;
 * what the trader needs here is someone explaining what they mean.
 *
 * The second constraint is not settled here. The coach's voice, attitude and
 * bedside manner live in coach.md at the project root, which this module loads
 * into the prompt — tuning the coach is editing prose, not code.
 */

export type CoachTurn = {
  role: 'user' | 'coach'
  text: string
}

const REFUSAL_GUIDANCE = `You only discuss this trader's own journal: their logged
trades, their results, their habits, their psychology around trading, and how to
use this app.

If asked about anything else — general knowledge, news, coding, other people,
what to buy, where a market is heading, homework, recipes, anything at all
outside their own trading — decline warmly in one short sentence and offer
something you can help with instead. Do not answer the question even partially.
Do not explain that you are an AI or describe your restrictions in detail. Just
be a coach who talks about their trading and nothing else.

You never predict prices, never recommend a specific trade, and never tell them
what to buy or sell. You talk about patterns in what they have already done.`

/**
 * How the reply has to be shaped, as opposed to how it should sound.
 *
 * These stay in code because the UI depends on them: the chat bubble renders
 * plain text, so markdown arrives as literal asterisks, and some free models
 * narrate their own reasoning unless told not to. Voice and attitude live in
 * coach.md, which anyone can rewrite.
 */
const OUTPUT_RULES = `How to format the reply:

- Plain conversational sentences only. Never use bullet points, headings, bold
  text, numbered lists, tables or markdown of any kind, however the playbook
  above is laid out — that is a document for you to read, not a style to copy.
- At most three or four sentences unless they ask for more.
- Never show your reasoning or think out loud. Give the reply only.`

/** The coach's voice lives in coach.md at the project root so it can be
 *  rewritten without touching code. vercel.json ships it with the function. */
const PLAYBOOK_PATH = resolve(process.cwd(), 'coach.md')

/** Used when coach.md cannot be read, so a missing file degrades the coach
 *  rather than taking it down. */
const FALLBACK_VOICE = `Talk like a real person who happens to coach traders.
Warm, direct, a little dry. Short sentences, ordinary words, their real numbers
rounded the way someone says them out loud. Grade how they executed, not what
they made. Never moralise, never guess, and never predict a price.`

let cached: string | null = null

function playbook(): string {
  if (cached !== null) return cached

  try {
    // Notes to the file's human readers are wrapped in HTML comments; the model
    // has no use for them and they cost tokens on every turn.
    const text = readFileSync(PLAYBOOK_PATH, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()

    cached = text === '' ? FALLBACK_VOICE : text
  } catch {
    console.warn('coach.md could not be read; falling back to the built-in voice.')
    cached = FALLBACK_VOICE
  }

  return cached
}

/**
 * A flat digest of the figures a coach reaches for most.
 *
 * Smaller models derive these unreliably from the nested JSON — one produced a
 * confident "two out of three" for a 50% win rate — so the arithmetic is done
 * here and handed over already computed. The full JSON still follows for
 * anything this does not cover.
 */
function headlineFacts(summary: TradeSummary): string {
  const money = (value: number) =>
    `${value < 0 ? '-' : ''}${Math.abs(Math.round(value)).toLocaleString('en-US')}`

  const wins = Math.round((summary.winRate / 100) * summary.closedCount)
  const lines = [
    `Total trades logged: ${summary.tradeCount} (${summary.closedCount} closed)`,
    `Wins: ${wins}. Losses: ${summary.closedCount - wins}.`,
    `Win rate: ${Math.round(summary.winRate)}%`,
    `Net P&L overall: ${money(summary.netPl)}`,
    `Average winning trade: ${money(summary.avgWin)}`,
    `Average losing trade: -${money(summary.avgLoss)}`,
    summary.profitFactor === null
      ? 'Profit factor: not computable (no losses yet)'
      : `Profit factor: ${summary.profitFactor}`,
    summary.avgHoldMinutes === null
      ? 'Average hold time: not recorded'
      : `Average hold time: ${Math.round(summary.avgHoldMinutes)} minutes`,
    `Worst losing streak: ${summary.worstStreak} in a row`,
    `Trades taken right after a loss: ${summary.afterLoss.count}, together ${money(
      summary.afterLoss.netPl,
    )}, winning ${Math.round(summary.afterLoss.winRate)}% of the time`,
    summary.afterLoss.medianMinutesToReentry === null
      ? 'Median time back in after a loss: not enough same-session data'
      : `Median time back in after a loss (same session): ${summary.afterLoss.medianMinutesToReentry} minutes`,
    summary.afterLoss.avgSizeChangePct === null
      ? 'Position size change after a loss: not recorded'
      : `Position size change after a loss: ${summary.afterLoss.avgSizeChangePct}%`,
    `Plan compliance: entry ${summary.planCompliance.entry}%, exit ${summary.planCompliance.exit}%, management ${summary.planCompliance.management}%`,
  ]

  const worstSetup = summary.bySetup[0]
  if (worstSetup) {
    lines.push(
      `Worst setup by money: ${worstSetup.label} — ${worstSetup.trades} trades, ${money(
        worstSetup.netPl,
      )}`,
    )
  }

  const worstHour = summary.byHour[0]
  if (worstHour) {
    lines.push(
      `Worst hour of the day: ${worstHour.label} — ${worstHour.trades} trades, ${money(
        worstHour.netPl,
      )}`,
    )
  }

  return lines.map((line) => `- ${line}`).join('\n')
}

export function buildSystemPrompt(
  summary: TradeSummary | null,
  language: string,
  displayName: string,
): string {
  const who = displayName ? `The trader's name is ${displayName}.` : ''

  const data = summary
    ? `Here is everything you know about their trading, computed from the trades
they logged in this app. It is the only source you may draw on. These headline
figures are already worked out — quote them, do not recalculate them:

${headlineFacts(summary)}

Full breakdown, for anything the headlines do not cover:

${JSON.stringify(summary, null, 1)}`
    : `They have not logged enough trades yet for you to analyse anything. Be
honest about that. Encourage them to log a few and tell them what you will be
able to see once they do.`

  return `You are the AI Coach inside RagDex, a trading journal app. ${who}

${REFUSAL_GUIDANCE}

This is the coaching playbook you work from. It is who you are:

${playbook()}

${OUTPUT_RULES}

Reply in ${language}. Every word of it. If they write to you in a different
language, still reply in ${language} unless they explicitly ask you to switch.

${data}`
}

export async function askCoach(
  history: CoachTurn[],
  systemPrompt: string,
  apiKey: string,
  models?: string[],
): Promise<{ text: string; model: string }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(
      (turn): ChatMessage => ({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.text,
      }),
    ),
  ]

  return complete({
    messages,
    apiKey,
    models,
    temperature: 0.7,
    maxTokens: 1200,
  })
}
