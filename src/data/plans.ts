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
