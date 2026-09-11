import { readableApiError } from '../lib/api'
import { useState } from 'react'
import type { AuthUser } from '../lib/useAuth'
import { savePlan, type Profile } from '../lib/profile'
import { useToast } from '../lib/toast'
import { currency } from '../data/dashboard'
import {
  CardIcon,
  CheckIcon,
  ReceiptIcon,
  SpinnerIcon,
} from '../components/Icons'
import {
  ACCOUNT_CARD,
  BILLING_GRID,
  CARD,
  DATA_ERROR,
  EMPTY_BLOCK,
  MONO,
  MUTED_NOTE,
  NOTICE,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  PLAN_ACTION,
  PLAN_BLURB,
  PLAN_CARD,
  PLAN_CURRENT,
  PLAN_CYCLE,
  PLAN_FEATURES,
  PLAN_FLAG,
  PLAN_NAME,
  PLAN_PRICE,
  PLAN_ROW,
  SECTION_TITLE,
  SEGMENT,
  SEGMENTED,
  SEGMENT_ACTIVE,
  TABLE,
  TD,
} from '../components/ui'

type BillingProps = {
  user: AuthUser | null
  profile: Profile | null
}

type Plan = {
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
const PLANS: Plan[] = [
  {
    id: 'individual',
    name: 'Individual',
    monthly: 19,
    blurb: 'For a trader working their own capital, on their own.',
    features: [
      'Unlimited journal entries and history',
      'Analytics engine and behavioural leak detection',
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

/** Placeholder history until a payment processor is connected. */
const INVOICES: { id: string; date: string; amount: number; status: string }[] = []

export function Billing({ user, profile }: BillingProps) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const toast = useToast()

  // Plans used to be starter/pro/desk. Anyone still carrying one of those ids
  // is shown the plan it became, so the page never renders with nothing marked
  // as current.
  const LEGACY: Record<string, string> = {
    starter: 'individual',
    pro: 'individual',
    desk: 'coach',
  }
  const stored = profile?.plan ?? 'individual'
  const activePlan = LEGACY[stored] ?? stored

  async function choose(plan: Plan) {
    if (!user || plan.id === activePlan) return

    setPending(plan.id)
    setError('')
    try {
      await savePlan(plan.id)
      toast.success(
        `You are on the ${plan.name} plan`,
        'Nothing was charged — no payment processor is connected yet.',
      )
    } catch (cause) {
      const message = readableApiError(cause)
      setError(message)
      toast.error('Could not change your plan', message)
    } finally {
      setPending(null)
    }
  }

  function priceFor(plan: Plan) {
    // Two months free on the annual cycle.
    const amount = cycle === 'monthly' ? plan.monthly : plan.monthly * 10
    return `${currency.format(amount)}`
  }

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Billing</h2>
          <p className={PAGE_SUB}>Your plan, payment method and invoice history.</p>
        </div>

        <div className={SEGMENTED} role="group" aria-label="Billing cycle">
          {(['monthly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`${SEGMENT} ${cycle === option ? SEGMENT_ACTIVE : ''}`}
              aria-pressed={cycle === option}
              onClick={() => setCycle(option)}
            >
              {option === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
            </button>
          ))}
        </div>
      </div>

      <div className={`${CARD} ${NOTICE}`} role="status">
        <strong>No payment processor is connected yet.</strong> Choosing a plan records
        it against your account so the app can gate features, but nothing is charged and
        no card details are collected or stored.
      </div>

      {error && (
        <p className={DATA_ERROR} role="alert">
          {error}
        </p>
      )}

      <div className={PLAN_ROW}>
        {PLANS.map((plan) => {
          const current = plan.id === activePlan

          return (
            <article key={plan.id} className={`${CARD} ${PLAN_CARD} ${current ? PLAN_CURRENT : ''}`}>
              {current && <span className={PLAN_FLAG}>Current plan</span>}

              <h3 className={PLAN_NAME}>{plan.name}</h3>
              <p className={PLAN_PRICE}>
                {priceFor(plan)}
                {plan.monthly > 0 && (
                  <span className={PLAN_CYCLE}>/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                )}
              </p>
              <p className={PLAN_BLURB}>{plan.blurb}</p>

              <ul className={PLAN_FEATURES}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`${PILL} ${current ? '' : PILL_ACCENT} ${PLAN_ACTION}`}
                disabled={current || pending !== null || !user}
                onClick={() => void choose(plan)}
              >
                {pending === plan.id && <SpinnerIcon className="animate-spin" size={14} />}
                {current ? 'Active' : pending === plan.id ? 'Switching…' : `Choose ${plan.name}`}
              </button>
            </article>
          )
        })}
      </div>

      <div className={BILLING_GRID}>
        <section className={`${CARD} ${ACCOUNT_CARD}`}>
          <h3 className={SECTION_TITLE}>
            <CardIcon size={16} />
            Payment method
          </h3>

          <div className={EMPTY_BLOCK}>
            <p>No card on file.</p>
            <p className={MUTED_NOTE}>
              A card can be added once a payment processor is connected.
            </p>
          </div>
        </section>

        <section className={`${CARD} ${ACCOUNT_CARD}`}>
          <h3 className={SECTION_TITLE}>
            <ReceiptIcon size={16} />
            Invoices
          </h3>

          {INVOICES.length === 0 ? (
            <div className={EMPTY_BLOCK}>
              <p>No invoices yet.</p>
              <p className={MUTED_NOTE}>
                Paid invoices will be listed here with a download link.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <tbody>
                  {INVOICES.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={TD}>{invoice.date}</td>
                    <td className={`${TD} ${MONO} text-right`}>{currency.format(invoice.amount)}</td>
                    <td className={TD}>{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
