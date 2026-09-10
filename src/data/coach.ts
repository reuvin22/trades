export type ChatMessage =
  | { id: string; from: 'coach'; paragraphs: string[]; chart?: true }
  | { id: string; from: 'trader'; text: string }

export const TRADER_NAME = 'Alex'

export const CONVERSATION: ChatMessage[] = [
  {
    id: 'review',
    from: 'coach',
    chart: true,
    paragraphs: [
      "I've completed a review of your SPY trading performance for the first two weeks of October. I noticed your revenge trades on SPY cost you $1,850 this month. Specifically, following a loss greater than $400, your next entry occurs on average within 4 minutes, with a 12% win rate.",
      'Would you like me to generate a specific rule for your "Stitch Journal" to prevent over-trading after a major drawdown?',
    ],
  },
  {
    id: 'reply',
    from: 'trader',
    text: 'Actually, can you analyze my losses on NQ today first? I felt like my entries were late.',
  },
]

/** Account equity after each revenge trade, in dollars. */
export const REVENGE_PHASE = [
  29800, 30400, 29600, 29100, 27400, 26900, 25200, 21600,
  19900, 18400, 17800, 16100, 15600, 14200, 13800, 12600,
]

export const REVENGE_TOTAL = -1850

export const REVENGE_TICKS = REVENGE_PHASE.map((_, index) => `T${index + 1}`)
