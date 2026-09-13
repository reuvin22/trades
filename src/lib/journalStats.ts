import type { StoredTrade } from './trades'

/**
 * The journal's summary cards, worked out from the rows on screen.
 *
 * Everything here is derived from the trades passed in, which are the
 * *filtered* ones — so changing the setup, session, result or date range
 * changes these figures too. A summary that ignored the filters above it would
 * be answering a question nobody asked.
 *
 * Nothing is estimated. Where the journal does not hold enough to answer, the
 * answer is null and the card says so, because a plausible-looking number with
 * nothing behind it is worse than an empty one.
 */
export type Volume = { unit: string; total: number }

export type JournalSummary = {
  /** Percent, or null when no trade has a recorded result yet. */
  winRate: number | null
  wins: number
  losses: number
  grossProfit: number
  grossLoss: number
  /**
   * Gross profit over gross loss.
   *
   * Null when it cannot be stated: no closed trades at all, or profit with no
   * losses to divide by — which is not an enormous profit factor, it is an
   * undefined one, and `Infinity` rendered in a card helps nobody.
   */
  profitFactor: number | null
  /** True for the specific case of winners and no losers. */
  unbeaten: boolean
  /** The state recorded most often, and how many entries named it. */
  topEmotion: string | null
  emotionCount: number
  emotionTotal: number
  /**
   * Size traded, totalled per unit.
   *
   * Per unit and not one figure, because lots, shares and contracts do not add
   * up to anything. A trader who works in one unit sees one entry, which is the
   * normal case; a trader who works in two sees two, which is the honest answer
   * rather than a sum of unlike things.
   */
  volume: Volume[]
}

export function summarise(trades: StoredTrade[]): JournalSummary {
  let wins = 0
  let losses = 0
  let grossProfit = 0
  let grossLoss = 0

  const emotions = new Map<string, number>()
  const volumes = new Map<string, number>()

  for (const trade of trades) {
    const pl = trade.netPl

    /*
     * Break-even is neither. Counting a scratch as a loss would push the win
     * rate down for a trade that cost nothing, and counting it as a win would
     * do the reverse; leaving it out of both is what every platform means by
     * the figure.
     */
    if (pl !== null && pl > 0) {
      wins += 1
      grossProfit += pl
    } else if (pl !== null && pl < 0) {
      losses += 1
      grossLoss += Math.abs(pl)
    }

    // Both fields: the card is about the trader's state around the trade, and
    // going in calm then panicking halfway is two facts, not one.
    for (const feeling of [trade.emotionBefore, trade.emotionDuring]) {
      const name = feeling.trim()
      if (name === '') continue
      emotions.set(name, (emotions.get(name) ?? 0) + 1)
    }

    if (trade.size !== null && trade.size > 0) {
      const unit = trade.sizeUnit.trim() || 'Units'
      volumes.set(unit, (volumes.get(unit) ?? 0) + trade.size)
    }
  }

  const decided = wins + losses

  let topEmotion: string | null = null
  let emotionCount = 0
  let emotionTotal = 0

  for (const [name, count] of emotions) {
    emotionTotal += count
    if (count > emotionCount) {
      topEmotion = name
      emotionCount = count
    }
  }

  return {
    winRate: decided === 0 ? null : (wins / decided) * 100,
    wins,
    losses,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    unbeaten: grossLoss === 0 && grossProfit > 0,
    topEmotion,
    emotionCount,
    emotionTotal,
    volume: [...volumes]
      .map(([unit, total]) => ({ unit, total }))
      .sort((a, b) => b.total - a.total),
  }
}

/**
 * A size, short enough for a card.
 *
 * Thousands and millions only. A trader in lots deals in tens and wants to see
 * `12.5`; a trader in shares deals in hundreds of thousands and does not want
 * to count the digits.
 */
export function compactSize(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  // Rounded to two, then back through Number so the trailing zeros go: 3
  // lots reads as "3" and twelve and a half as "12.5", not "3.00" and
  // "12.50". Nobody writes a lot size with a trailing zero.
  return String(Number(value.toFixed(2)))
}

/** Every unit traded, or a dash when nothing has a size recorded. */
export function volumeLabel(volume: Volume[]): string {
  if (volume.length === 0) return '—'
  return volume.map((entry) => `${compactSize(entry.total)} ${entry.unit}`).join(' · ')
}

/**
 * A money formatter in the trader's own currency.
 *
 * Built rather than imported, because the one in `data/dashboard` is fixed to
 * dollars and these figures are the trader's own P&L. Cents are dropped above
 * a thousand: "$12,480 won against $5,150 lost" is the sentence, and the
 * pennies in it are noise.
 *
 * Falls back to USD if the stored code is not one Intl recognises — a bad
 * value in one profile field should not take the page down.
 */
export function moneyIn(code: string): (value: number) => string {
  function build(currency: string, decimals: number): Intl.NumberFormat {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  let whole: Intl.NumberFormat
  let precise: Intl.NumberFormat

  try {
    whole = build(code || 'USD', 0)
    precise = build(code || 'USD', 2)
  } catch {
    whole = build('USD', 0)
    precise = build('USD', 2)
  }

  return (value) => (Math.abs(value) >= 1_000 ? whole : precise).format(value)
}
