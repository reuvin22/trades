/**
 * What the active plan includes, and where that plan comes from.
 *
 * This is the client's half of plan gating: it hides what a plan does not
 * include and refuses to make the API calls behind it, so a Free account costs
 * nothing it is not paying for. It is not the security boundary — a caller who
 * edits the bundle can still reach the API — so real enforcement has to be
 * added server-side before a paid tier is sold.
 *
 * The feature names match the tier lists on the landing page
 * (`PRICING_TIERS` in data/plans.ts), so the page and the product describe
 * the same product.
 */

import { useSyncExternalStore } from 'react'

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
 * What an account is treated as until its profile has arrived.
 *
 * The most restrictive tier on purpose. The alternative — assume a paid plan
 * and withdraw features once the profile loads — shows somebody a button that
 * then disappears, and would fire a coach or chat request on a plan that does
 * not include one. Guessing low only ever costs a frame, and `App` sets the
 * real plan in a layout effect, so that frame is never painted.
 */
export const DEFAULT_PLAN: PlanId = 'free'

/**
 * What the no-account preview session sees.
 *
 * Preview is the escape hatch for looking round the UI without signing up. It
 * has no profile to read a plan from, and gating it to Free would leave a
 * showcase of an empty shell — so it shows the product. Nothing behind it is
 * reachable anyway: every API call needs a session cookie preview does not
 * have.
 */
export const PREVIEW_PLAN: PlanId = 'pro'

/**
 * The API's plans, mapped onto the tiers this file gates on.
 *
 * Two vocabularies, because they answer different questions. The backend's
 * `PlanId` is what somebody is billed as and is the shorter list — `free`,
 * `individual`, `coach` (see `app/schemas/profile.py`). The tiers here are
 * what the landing page advertises. `individual` is the paid single-trader
 * plan, which is the tier sold as Pro.
 */
const API_PLANS: Record<string, PlanId> = {
  free: 'free',
  individual: 'pro',
  coach: 'coach',
}

/** The tier an account's stored plan entitles it to. Unknown reads as Free. */
export function planFromApi(value: string | null | undefined): PlanId {
  return (value ? API_PLANS[value] : undefined) ?? DEFAULT_PLAN
}

/*
 * The active plan, as a module-level store rather than React state.
 *
 * It has to be readable synchronously from outside React: `apiFetch` is the
 * one outbound surface and checks the plan before every request, and
 * `chat.ts` and `uploads.ts` do the same. A hook cannot be called from any of
 * them. So the plan lives here, `App` pushes the signed-in profile's plan in,
 * and React components subscribe through `usePlan`.
 */
let active: PlanId = DEFAULT_PLAN

const listeners = new Set<() => void>()

export function activePlan(): PlanId {
  return active
}

/** Point the app at a plan. Called by `App` as the profile resolves. */
export function setActivePlan(plan: PlanId): void {
  if (plan === active) return
  active = plan
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * The active plan, for a component that renders something derived from it.
 *
 * Subscribing matters: `traderNav`, `tourSteps` and `catalogue` are plain
 * functions of a plan, and a component that called one without reading the
 * plan through this hook would keep the list it built on the first render.
 */
export function usePlan(): PlanId {
  return useSyncExternalStore(subscribe, activePlan, activePlan)
}

/*
 * Every check below takes the plan as an optional argument, defaulting to the
 * active one. Components and the imperative guards ask the ambient question —
 * "is this included right now" — while the functions that build a navigation
 * tree or a tour take an explicit plan, so they stay pure and memoisable.
 */

export function hasFeature(feature: Feature, plan: PlanId = active): boolean {
  return INCLUDES[plan].includes(feature)
}

/** Screens that belong to a feature, and so disappear with it. */
const ROUTE_FEATURE: Record<string, Feature> = {
  analytics: 'analytics',
  coach: 'coach',
}

export function routeAllowed(route: string, plan: PlanId = active): boolean {
  const feature = ROUTE_FEATURE[route]
  return feature === undefined || hasFeature(feature, plan)
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

export function pathAllowed(path: string, plan: PlanId = active): boolean {
  return PATH_FEATURE.every(
    ([prefix, feature]) => !path.startsWith(prefix) || hasFeature(feature, plan),
  )
}

/** Which feature a stored image belongs to, by its folder. Profile photos belong to none. */
export function uploadAllowed(folder: string, plan: PlanId = active): boolean {
  if (folder === 'charts') return hasFeature('chartScreenshots', plan)
  if (folder === 'ai') return hasFeature('coach', plan)
  if (folder === 'messages') return hasFeature('messages', plan)
  return true
}
