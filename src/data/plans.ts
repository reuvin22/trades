/**
 * What RagDex charges for, in one place.
 *
 * The landing page quotes these and the billing page sells them, so they live
 * here rather than in either: a price shown to a visitor that differs from the
 * one on the billing screen is the worst kind of bug to find late.
 */

export type Plan = {
  id: string
  name: string
  monthly: number
  blurb: string
  features: string[]
}

/*
 * Two plans, matching the two kinds of account the app already recognises in
 * ACCOUNT_TYPES: someone trading their own capital, and someone reviewing
 * other traders alongside their own journal.
 */
export const PLANS: Plan[] = [
  {
    id: 'individual',
    name: 'Individual',
    monthly: 19,
    blurb: 'For a trader working their own capital, on their own.',
    features: [
      'Unlimited journal entries and history',
      'Analytics, and a regular read on how you actually trade',
      'The AI coach, on your own trades',
      'CSV export and broker import',
    ],
  },
  {
    id: 'coach',
    name: 'Coach',
    monthly: 49,
    blurb: 'For mentors reviewing other traders as well as themselves.',
    features: [
      'Everything in Individual',
      'Up to 25 linked student journals',
      'Side-by-side review and shared annotations',
      'Cohort reporting across your students',
      'Priority support',
    ],
  },
]

/**
 * The four tiers the landing page advertises.
 *
 * Kept apart from PLANS on purpose. PLANS is what the billing page sends to
 * `PUT /api/v1/me/plan`, and the API accepts exactly `individual` and `coach`
 * — putting "pro" or "expert" in that list would render a button whose request
 * the server refuses. Until the backend knows these tiers, this list is copy,
 * and its prices are set independently of PLANS — they no longer match.
 */
/**
 * A line on a tier card. An object marks something promised but not yet built,
 * so the page can tag it rather than advertise it as if it shipped.
 */
export type TierFeature = string | { label: string; soon: true }

export type Tier = {
  id: 'free' | 'pro' | 'expert' | 'coach'
  name: string
  /** Null for a tier that is quoted rather than listed. */
  monthly: number | null
  blurb: string
  features: TierFeature[]
  cta: string
  /** The tier the page steers a new trader towards. */
  featured?: boolean
  /**
   * Still being built. The card shows its name and price, but its feature
   * list is not rendered at all — only placeholder lines — so an unfinished
   * roadmap is not published to readers, crawlers or the page source.
   */
  inDevelopment?: boolean
}

export const PRICING_TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    blurb: 'Your trading journal, free for as long as you keep it.',
    features: [
      'Permanent, unlimited journal',
      'Net P&L, win rate, average R and profit factor',
      'Equity curve over 7, 30 and 90 days',
      'Calendar view and journal filters',
      'Risk limits and trading rules',
      'CSV export',
    ],
    cta: 'Start for free',
  },
  {
    id: 'pro',
    inDevelopment: true,
    name: 'Pro',
    monthly: 13,
    blurb: 'For a trader working their own capital, every day.',
    features: [
      'Everything in Free',
      'Full analytics, setup ranking and custom date ranges',
      'Chart screenshots on every trade',
      'Behavioural leak detection',
      'AI coach, with a monthly allowance',
      { label: 'Ranked matches against traders at your level', soon: true },
      { label: 'Global leaderboard by rank', soon: true },
      'Messages and PDF export',
    ],
    cta: 'Go Pro',
    featured: true,
  },
  {
    id: 'expert',
    inDevelopment: true,
    name: 'Expert',
    monthly: 25,
    blurb: 'For traders who want the coach on every trade.',
    features: [
      'Everything in Pro',
      'Unlimited AI coach, including chart images',
      { label: 'Custom matches with your own rules and opponents', soon: true },
      'Setup rankings for today, this week and this month',
      'Rule tracking against the limits you set',
      { label: 'Broker import', soon: true },
    ],
    cta: 'Choose Expert',
  },
  {
    id: 'coach',
    inDevelopment: true,
    name: 'Coach',
    monthly: null,
    blurb: 'For mentors reviewing other traders as well as themselves.',
    features: [
      'Everything in Expert',
      { label: 'Linked student journals', soon: true },
      { label: 'Private leaderboards and matches for your students', soon: true },
      { label: 'Side-by-side review and cohort reporting', soon: true },
      'Priority support',
    ],
    cta: 'Contact sales',
  },
]
