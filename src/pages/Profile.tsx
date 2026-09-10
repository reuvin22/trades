import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import {
  saveProfileDetails,
  type Profile as ProfileRecord,
  type ProfileDetails,
} from '../lib/profile'
import { readableFirestoreError } from '../lib/trades'
import { CameraIcon, SpinnerIcon, UserGlyphIcon } from '../components/Icons'
import '../styles/account.css'

type ProfileProps = {
  user: User | null
  profile: ProfileRecord | null
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Manila',
  'Australia/Sydney',
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'PHP']
const MARKETS = ['Equities', 'Futures', 'Forex', 'Crypto', 'Options']
const STYLES = ['Scalper', 'Day trader', 'Swing trader', 'Position trader']

type Form = ProfileDetails & { openingBalance: number | null; balanceText: string }

const BLANK: Form = {
  displayName: '',
  photoURL: '',
  timezone: '',
  currency: 'USD',
  openingBalance: null,
  balanceText: '',
  tradingStyle: 'Day trader',
  markets: [],
  bio: '',
}

function fromRecord(record: ProfileRecord): Form {
  return {
    displayName: record.displayName ?? '',
    photoURL: record.photoURL ?? '',
    timezone: record.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: record.currency ?? 'USD',
    openingBalance: record.openingBalance ?? null,
    balanceText: record.openingBalance != null ? String(record.openingBalance) : '',
    tradingStyle: record.tradingStyle ?? 'Day trader',
    markets: record.markets ?? [],
    bio: record.bio ?? '',
  }
}

export function Profile({ user, profile }: ProfileProps) {
  const [form, setForm] = useState<Form>(BLANK)
  const [seededFor, setSeededFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // Seeding during render is React's documented way to adjust state when props
  // arrive; doing it in an effect would render once with empty fields first.
  if (profile && seededFor !== profile.uid) {
    setSeededFor(profile.uid)
    setForm(fromRecord(profile))
  }

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setStatus('')
  }

  function toggleMarket(market: string) {
    setForm((current) => ({
      ...current,
      markets: current.markets.includes(market)
        ? current.markets.filter((entry) => entry !== market)
        : [...current.markets, market],
    }))
    setStatus('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    setSaving(true)
    setStatus('')
    setError('')

    try {
      await saveProfileDetails(user, {
        displayName: form.displayName.trim(),
        photoURL: form.photoURL.trim(),
        timezone: form.timezone,
        currency: form.currency,
        openingBalance: form.balanceText.trim() === '' ? null : Number(form.balanceText),
        tradingStyle: form.tradingStyle,
        markets: form.markets,
        bio: form.bio.trim(),
      })
      setStatus('Profile saved.')
    } catch (cause) {
      setError(readableFirestoreError(cause))
    } finally {
      setSaving(false)
    }
  }

  const initial = (form.displayName || user?.email || 'T').slice(0, 1).toUpperCase()
  const zones = [form.timezone, ...TIMEZONES.filter((zone) => zone !== form.timezone)].filter(
    Boolean,
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-sub">
            How your account is identified, and the defaults your journal uses.
          </p>
        </div>
      </div>

      <form className="account-grid" onSubmit={handleSubmit}>
        <section className="card account-card">
          <h3 className="section-title">Identity</h3>

          <div className="identity">
            <span className="identity-avatar">
              {form.photoURL ? (
                <img src={form.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar-initials">{initial}</span>
              )}
            </span>

            <label className="field identity-field">
              <span className="field-label">
                <CameraIcon />
                Avatar image URL
              </span>
              <input
                type="url"
                value={form.photoURL}
                onChange={(event) => update('photoURL', event.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          <div className="field-grid">
            <label className="field span-2">
              <span className="field-label">Display name</span>
              <input
                value={form.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                placeholder="Alex Moreno"
                autoComplete="name"
              />
            </label>

            <label className="field span-2">
              <span className="field-label">Email address</span>
              <input value={user?.email ?? ''} readOnly disabled />
            </label>

            <label className="field span-4">
              <span className="field-label">Short bio</span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) => update('bio', event.target.value)}
                placeholder="What you trade, and the edge you are building."
              />
            </label>
          </div>
        </section>

        <section className="card account-card">
          <h3 className="section-title">Journal defaults</h3>

          <div className="field-grid">
            <label className="field span-2">
              <span className="field-label">Time zone</span>
              <select
                value={form.timezone}
                onChange={(event) => update('timezone', event.target.value)}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Base currency</span>
              <select
                value={form.currency}
                onChange={(event) => update('currency', event.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Opening balance</span>
              <input
                type="number"
                step="any"
                min="0"
                value={form.balanceText}
                onChange={(event) => update('balanceText', event.target.value)}
                placeholder="10000"
              />
            </label>

            <label className="field span-2">
              <span className="field-label">Trading style</span>
              <select
                value={form.tradingStyle}
                onChange={(event) => update('tradingStyle', event.target.value)}
              >
                {STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>

            <div className="field span-4">
              <span className="field-label">Markets you trade</span>
              <div className="tag-cloud">
                {MARKETS.map((market) => (
                  <button
                    key={market}
                    type="button"
                    className={`tag-toggle${form.markets.includes(market) ? ' is-active' : ''}`}
                    aria-pressed={form.markets.includes(market)}
                    onClick={() => toggleMarket(market)}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="account-actions card">
          <p className={`save-note${error ? ' is-error' : ''}`} role="status">
            {error || status || 'Changes are stored against your account.'}
          </p>
          <button type="submit" className="pill is-accent" disabled={saving || !user}>
            {saving && <SpinnerIcon className="spinner" size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className="card account-card">
        <h3 className="section-title">Account</h3>
        <dl className="meta-list">
          <div>
            <dt>
              <UserGlyphIcon size={15} />
              Sign-in method
            </dt>
            <dd>{user?.providerData.map((entry) => entry.providerId).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Account created</dt>
            <dd>{profile?.createdAt ? profile.createdAt.toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt>Email confirmed</dt>
            <dd>{user?.emailVerified ? 'Yes' : 'Not yet'}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}
