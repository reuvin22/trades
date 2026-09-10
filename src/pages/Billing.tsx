import { useState } from 'react'
import type { User } from 'firebase/auth'
import { savePlan, type Profile } from '../lib/profile'
import { readableFirestoreError } from '../lib/trades'
import { currency } from '../data/dashboard'
import {
  CardIcon,
  CheckIcon,
  ReceiptIcon,
  SpinnerIcon,
} from '../components/Icons'
import '../styles/account.css'

type BillingProps = {
  user: User | null
  profile: Profile | null
}

type Plan = {
  id: string
  name: string
  monthly: number
  blurb: string
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 0,
    blurb: 'Journal by hand, keep the last 90 days.',
    features: ['Unlimited manual entries', '90 days of history', 'Core dashboard'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 19,
    blurb: 'Full analytics and the behavioural coach.',
    features: [
      'Everything in Starter',
      'Unlimited history',
      'Analytics engine + AI coach',
      'CSV export',
    ],
  },
  {
    id: 'desk',
    name: 'Desk',
    monthly: 49,
    blurb: 'For funded traders running several accounts.',
    features: [
      'Everything in Pro',
      'Up to 10 broker connections',
      'Multi-account rollups',
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

  const activePlan = profile?.plan ?? 'starter'

  async function choose(plan: Plan) {
    if (!user || plan.id === activePlan) return

    setPending(plan.id)
    setError('')
    try {
      await savePlan(user.uid, plan.id)
    } catch (cause) {
      setError(readableFirestoreError(cause))
    } finally {
      setPending(null)
    }
  }

  function priceFor(plan: Plan) {
    if (plan.monthly === 0) return 'Free'
    // Two months free on the annual cycle.
    const amount = cycle === 'monthly' ? plan.monthly : plan.monthly * 10
    return `${currency.format(amount)}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Billing</h2>
          <p className="page-sub">Your plan, payment method and invoice history.</p>
        </div>

        <div className="segmented" role="group" aria-label="Billing cycle">
          {(['monthly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`segment${cycle === option ? ' is-active' : ''}`}
              aria-pressed={cycle === option}
              onClick={() => setCycle(option)}
            >
              {option === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
            </button>
          ))}
        </div>
      </div>

      <div className="notice card" role="status">
        <strong>No payment processor is connected yet.</strong> Choosing a plan records
        it against your account so the app can gate features, but nothing is charged and
        no card details are collected or stored.
      </div>

      {error && (
        <p className="data-error" role="alert">
          {error}
        </p>
      )}

      <div className="plan-row">
        {PLANS.map((plan) => {
          const current = plan.id === activePlan

          return (
            <article key={plan.id} className={`card plan-card${current ? ' is-current' : ''}`}>
              {current && <span className="plan-flag">Current plan</span>}

              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">
                {priceFor(plan)}
                {plan.monthly > 0 && (
                  <span className="plan-cycle">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                )}
              </p>
              <p className="plan-blurb">{plan.blurb}</p>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`pill${current ? '' : ' is-accent'} plan-action`}
                disabled={current || pending !== null || !user}
                onClick={() => void choose(plan)}
              >
                {pending === plan.id && <SpinnerIcon className="spinner" size={14} />}
                {current ? 'Active' : pending === plan.id ? 'Switching…' : `Choose ${plan.name}`}
              </button>
            </article>
          )
        })}
      </div>

      <div className="billing-grid">
        <section className="card account-card">
          <h3 className="section-title">
            <CardIcon size={16} />
            Payment method
          </h3>

          <div className="empty-block">
            <p>No card on file.</p>
            <p className="muted-note">
              A card can be added once a payment processor is connected.
            </p>
          </div>
        </section>

        <section className="card account-card">
          <h3 className="section-title">
            <ReceiptIcon size={16} />
            Invoices
          </h3>

          {INVOICES.length === 0 ? (
            <div className="empty-block">
              <p>No invoices yet.</p>
              <p className="muted-note">
                Paid invoices will be listed here with a download link.
              </p>
            </div>
          ) : (
            <table className="trades">
              <tbody>
                {INVOICES.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.date}</td>
                    <td className="num mono">{currency.format(invoice.amount)}</td>
                    <td>{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  )
}
