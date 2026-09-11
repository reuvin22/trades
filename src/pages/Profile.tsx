import { useState, type FormEvent } from 'react'
import { Select } from '../components/Select'
import { useToast } from '../lib/toast'
import type { User } from 'firebase/auth'
import {
  ACCOUNT_TYPES,
  DEFAULT_ACCOUNT_TYPE,
  saveProfileDetails,
  type AccountType,
  type Profile as ProfileRecord,
  type ProfileDetails,
} from '../lib/profile'
import { readableFirestoreError } from '../lib/trades'
import { CameraIcon, SpinnerIcon, UserGlyphIcon } from '../components/Icons'
import {
  ACCOUNT_ACTIONS,
  ACCOUNT_CARD,
  ACCOUNT_GRID,
  AVATAR_INITIALS,
  CARD,
  FIELD,
  FIELD_GRID,
  FIELD_HINT,
  FIELD_LABEL,
  IDENTITY,
  IDENTITY_AVATAR,
  META_LIST,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  SAVE_ERROR,
  SAVE_NOTE,
  SECTION_TITLE,
  TAG_ACTIVE,
  TAG_CLOUD,
  TAG_TOGGLE,
} from '../components/ui'

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
  accountType: DEFAULT_ACCOUNT_TYPE,
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
    accountType: record.accountType ?? DEFAULT_ACCOUNT_TYPE,
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
  const toast = useToast()

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
        accountType: form.accountType,
        photoURL: form.photoURL.trim(),
        timezone: form.timezone,
        currency: form.currency,
        openingBalance: form.balanceText.trim() === '' ? null : Number(form.balanceText),
        tradingStyle: form.tradingStyle,
        markets: form.markets,
        bio: form.bio.trim(),
      })
      setStatus('Profile saved.')
      toast.success('Profile saved', 'Your details are up to date.')
    } catch (cause) {
      const message = readableFirestoreError(cause)
      setError(message)
      toast.error('Could not save your profile', message)
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
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>My Profile</h2>
          <p className={PAGE_SUB}>
            How your account is identified, and the defaults your journal uses.
          </p>
        </div>
      </div>

      <form className={ACCOUNT_GRID} onSubmit={handleSubmit}>
        <section className={`${CARD} ${ACCOUNT_CARD}`}>
          <h3 className={SECTION_TITLE}>Identity</h3>

          <div className={IDENTITY}>
            <span className={IDENTITY_AVATAR}>
              {form.photoURL ? (
                <img src={form.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className={AVATAR_INITIALS}>{initial}</span>
              )}
            </span>

            <label className={`${FIELD} min-w-0 flex-1 max-[900px]:w-full [&>span]:justify-start [&>span]:gap-7`}>
              <span className={FIELD_LABEL}>
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

          <div className={FIELD_GRID}>
            <label className={`${FIELD} col-span-2`}>
              <span className={FIELD_LABEL}>Display name</span>
              <input
                value={form.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                placeholder="Alex Moreno"
                autoComplete="name"
              />
            </label>

            <label className={`${FIELD} col-span-2`}>
              <span className={FIELD_LABEL}>Email address</span>
              <input value={user?.email ?? ''} readOnly disabled />
            </label>

            <label className={`${FIELD} col-span-full`}>
              <span className={FIELD_LABEL}>Account type</span>
              <Select
                value={form.accountType}
                onChange={(event) =>
                  update('accountType', event.target.value as AccountType)
                }
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <span className={FIELD_HINT}>
                {ACCOUNT_TYPES.find((type) => type.value === form.accountType)?.blurb}
              </span>
            </label>

            <label className={`${FIELD} col-span-full`}>
              <span className={FIELD_LABEL}>Short bio</span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(event) => update('bio', event.target.value)}
                placeholder="What you trade, and the edge you are building."
              />
            </label>
          </div>
        </section>

        <section className={`${CARD} ${ACCOUNT_CARD}`}>
          <h3 className={SECTION_TITLE}>Journal defaults</h3>

          <div className={FIELD_GRID}>
            <label className={`${FIELD} col-span-2`}>
              <span className={FIELD_LABEL}>Time zone</span>
              <Select
                value={form.timezone}
                onChange={(event) => update('timezone', event.target.value)}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </Select>
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>Base currency</span>
              <Select
                value={form.currency}
                onChange={(event) => update('currency', event.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>Opening balance</span>
              <input
                type="number"
                step="any"
                min="0"
                value={form.balanceText}
                onChange={(event) => update('balanceText', event.target.value)}
                placeholder="10000"
              />
            </label>

            <label className={`${FIELD} col-span-2`}>
              <span className={FIELD_LABEL}>Trading style</span>
              <Select
                value={form.tradingStyle}
                onChange={(event) => update('tradingStyle', event.target.value)}
              >
                {STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </Select>
            </label>

            <div className={`${FIELD} col-span-full`}>
              <span className={FIELD_LABEL}>Markets you trade</span>
              <div className={TAG_CLOUD}>
                {MARKETS.map((market) => (
                  <button
                    key={market}
                    type="button"
                    className={`${TAG_TOGGLE} ${form.markets.includes(market) ? TAG_ACTIVE : ''}`}
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

        <div className={`${CARD} ${ACCOUNT_ACTIONS}`}>
          <p className={`${SAVE_NOTE} ${error ? SAVE_ERROR : ''}`} role="status">
            {error || status || 'Changes are stored against your account.'}
          </p>
          <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={saving || !user}>
            {saving && <SpinnerIcon className="animate-spin" size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className={`${CARD} ${ACCOUNT_CARD}`}>
        <h3 className={SECTION_TITLE}>Account</h3>
        <dl className={META_LIST}>
          <div>
            <dt>
              <UserGlyphIcon size={15} />
              Sign-in method
            </dt>
            <dd>{user?.providerData.map((entry) => entry.providerId).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd>
              {ACCOUNT_TYPES.find((type) => type.value === form.accountType)?.label}
            </dd>
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
