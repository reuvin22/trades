/**
 * What the active plan includes, and the one switch that sets it.
 *
 * This is the client's half of plan gating: it hides what a plan does not
 * include and refuses to make the API calls behind it, so a Free account costs
 * nothing it is not paying for. It is not the security boundary — a caller who
 * edits the bundle can still reach the API — so real enforcement has to be
 * added server-side before a paid tier is sold. Until then this is a switch
 * for testing what each plan feels like.
 *
 * The feature names match the tier lists on the landing page
 * (`PRICING_TIERS` in data/plans.ts), so the page and the product describe
 * the same product.
 */

export type PlanId = 'free' | 'pro' | 'expert' | 'coach'

export type Feature =
  /** The Analytics page. */
  | 'analytics'
  /** Setup performance and "what's working" rankings. */
  | 'setupRanking'
  /** A picked start and end date, beyond the preset windows. */
  | 'customRange'
  /** Chart images attached to a trade. */
  | 'chartScreenshots'
  /** The model-written behavioural leak read. */
  | 'leakDetection'
  /** The AI coach. */
  | 'coach'
  /** Live chat with other traders. */
  | 'messages'
  | 'pdfExport'
  /** The discipline score: execution measured against your own rules. */
  | 'ruleTracking'
  | 'brokerImport'

const PRO: readonly Feature[] = [
  'analytics',
  'setupRanking',
  'customRange',
  'chartScreenshots',
  'leakDetection',
  'coach',
  'messages',
  'pdfExport',
]

const EXPERT: readonly Feature[] = [...PRO, 'ruleTracking', 'brokerImport']

const INCLUDES: Record<PlanId, readonly Feature[]> = {
  // Free is the journal and the numbers computed from it — nothing that costs
  // a model call or a stored image per user.
  free: [],
  pro: PRO,
  expert: EXPERT,
  coach: EXPERT,
}

/**
 * The plan every account is treated as, for now.
 *
 * A constant rather than the profile's own plan because the API does not yet
 * accept "free" as a plan at all — see PlanId in ragdex-be's schemas. Once it
 * does and accounts carry their tier, this becomes a read of the signed-in
 * profile instead.
 */
export const ACTIVE_PLAN: PlanId = 'free'

export function hasFeature(feature: Feature): boolean {
  return INCLUDES[ACTIVE_PLAN].includes(feature)
}

/** Screens that belong to a feature, and so disappear with it. */
const ROUTE_FEATURE: Record<string, Feature> = {
  analytics: 'analytics',
  coach: 'coach',
}

export function routeAllowed(route: string): boolean {
  const feature = ROUTE_FEATURE[route]
  return feature === undefined || hasFeature(feature)
}

/**
 * API paths that belong to a feature. Checked in apiFetch, the one outbound
 * surface, so a locked feature makes no request even if some screen still
 * tries to — hiding the button is the courtesy, this is the guarantee.
 *
 * Uploads are not here: the same endpoint carries profile photos, which every
 * plan keeps, so uploads.ts checks the folder instead.
 */
const PATH_FEATURE: [prefix: string, feature: Feature][] = [
  ['/api/v1/coach', 'coach'],
  ['/api/v1/insights', 'leakDetection'],
  ['/api/v1/chat', 'messages'],
]

export function pathAllowed(path: string): boolean {
  return PATH_FEATURE.every(([prefix, feature]) => !path.startsWith(prefix) || hasFeature(feature))
}

/** Which feature a stored image belongs to, by its folder. Profile photos belong to none. */
export function uploadAllowed(folder: string): boolean {
  if (folder === 'charts') return hasFeature('chartScreenshots')
  if (folder === 'ai') return hasFeature('coach')
  if (folder === 'messages') return hasFeature('messages')
  return true
}
