import { useEffect, useState } from 'react'
import { ChevronLeftIcon, SpinnerIcon } from '../components/Icons'
import { RichTextEditor } from '../components/RichTextEditor'
import {
  CARD,
  EMPTY_BLOCK,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  MUTED_NOTE,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  SAVE_BAR,
  SET_ABOUT,
  SET_GRID,
  SET_HEAD,
  SET_PREVIEW,
  SET_PREVIEW_PAGE,
  SET_SECTION,
  SET_SWATCH,
  SET_TITLE,
  TOKEN_CHIP,
  TOKEN_EXAMPLE,
  TOKEN_SOURCE,
  TOKEN_TABLE,
  UNI_BACK,
  UNI_LOADING,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import {
  EMPTY_SETTINGS,
  fetchSettings,
  saveSettings,
  type Settings,
} from '../lib/university'
import type { Profile } from '../lib/profile'

/**
 * What each placeholder becomes, and where that value comes from.
 *
 * Written out because the chips on their own read as fields somebody had
 * forgotten to fill in. None of these is editable — that is the point of
 * them — so the screen has to say what fills them instead.
 */
const TOKENS: {
  token: string
  source: string
  example: (settings: Settings, profile: Profile | null) => string
}[] = [
  {
    token: '{{coach}}',
    source: 'Your display name, from your profile',
    example: (_settings, profile) =>
      (profile?.displayName ?? '').trim() || 'set a display name on your profile',
  },
  {
    token: '{{student}}',
    source: "The name on the account you are inviting",
    example: () => 'Alex Moreno',
  },
  {
    token: '{{note}}',
    source: 'The note you type in the invite dialog, each time you invite',
    example: () => 'Saw your journal — come and train with us.',
  },
]

/**
 * A coach's program, and the invitation it sends.
 *
 * The editor here writes the email that goes out when a student is invited.
 * Three sections rather than one document, because the mail shell owns the
 * outer table and the accept button — a coach writes what surrounds those,
 * not the envelope itself. That is also what stops an invitation from this
 * domain being made to look like it came from somewhere else.
 *
 * What is saved is what will be sent. The API sanitises the markup against an
 * allowlist and answers with what it kept, and this adopts that answer — so a
 * tag that was dropped is visibly gone the moment you save, not silently gone
 * when somebody receives it.
 */
export function UniversitySettings({ profile }: { profile: Profile | null }) {
  const toast = useToast()
  const isCoach = (profile?.accountType ?? 'individual') === 'coach'

  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isCoach) return

    const abort = new AbortController()

    fetchSettings()
      .then((found) => {
        if (abort.signal.aborted) return
        setSettings(found)
        setLoaded(true)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoaded(true)
      })

    return () => abort.abort()
  }, [isCoach])

  function edit(patch: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...patch }))
  }

  function editTemplate(patch: Partial<Settings['template']>) {
    setSettings((current) => ({
      ...current,
      template: { ...current.template, ...patch },
    }))
  }

  async function save() {
    setSaving(true)
    try {
      // Adopting the response is the point: it is the sanitised version.
      setSettings(await saveSettings(settings))
      toast.success('Program saved.', 'New invitations will use this template.')
    } catch (cause) {
      toast.error('Could not save that', readableApiError(cause))
    } finally {
      setSaving(false)
    }
  }

  if (!isCoach) {
    return (
      <>
        <Back />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Only a Coach account has a program to configure.</p>
          <p className={MUTED_NOTE}>
            Change your account type on the Profile page and this screen opens.
          </p>
        </section>
      </>
    )
  }

  if (!loaded) {
    return (
      <>
        <Back />
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading your program…</p>
        </section>
      </>
    )
  }

  return (
    <>
      <Back />

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>University settings</h2>
          <p className={PAGE_SUB}>
            What your program is called, and the email a trader gets when you
            invite them.
          </p>
        </div>
      </div>

      {error !== null && (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{error}</p>
        </section>
      )}

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SET_HEAD}>
            <div>
              <h3 className={SET_TITLE}>Your University</h3>
              <p className={SET_ABOUT}>
                What you register here is the name used everywhere else — the
                heading on your roster, the subject of an invitation, and the line
                telling a recipient where they were invited to. There is no second
                Program name anywhere.
              </p>
            </div>
          </div>

          <div className={SET_GRID}>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>University name</span>
              <input
                value={settings.name}
                maxLength={120}
                placeholder="Hernandez Trading Desk"
                onChange={(event) => edit({ name: event.target.value })}
              />
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>One line about it</span>
              <input
                value={settings.blurb}
                maxLength={300}
                placeholder="Process-first coaching. Twelve weeks, one journal."
                onChange={(event) => edit({ blurb: event.target.value })}
              />
            </label>
          </div>
        </div>
      </section>

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SET_HEAD}>
            <div>
              <h3 className={SET_TITLE}>The invitation email</h3>
              <p className={SET_ABOUT}>
                Sent from RagDex on your behalf — the sender name stays ours so the
                message cannot be made to look like it came from somewhere else. The
                accept button and the line explaining who invited them are added
                automatically, between the body and the footer.
              </p>
            </div>
          </div>

          <div className={SET_GRID}>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>Subject</span>
              <input
                value={settings.template.subject}
                maxLength={200}
                placeholder="Come and train with me on RagDex"
                onChange={(event) => editTemplate({ subject: event.target.value })}
              />
              <span className={FIELD_HINT}>
                Left empty, it becomes &ldquo;Your name invited you to
                {' '}
                {settings.name.trim() || 'your University'}&rdquo;.
              </span>
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>Accent colour</span>
              <span className="flex items-center gap-10">
                <input
                  type="color"
                  className={SET_SWATCH}
                  value={/^#[0-9a-f]{6}$/i.test(settings.template.accent)
                    ? settings.template.accent
                    : '#6353e8'}
                  onChange={(event) => editTemplate({ accent: event.target.value })}
                  aria-label="Accent colour"
                />
                <input
                  value={settings.template.accent}
                  maxLength={32}
                  onChange={(event) => editTemplate({ accent: event.target.value })}
                />
              </span>
              <span className={FIELD_HINT}>
                Used for the accept button. Anything that is not a hex colour falls
                back to the RagDex purple.
              </span>
            </label>
          </div>

          <div className={SET_HEAD} style={{ marginTop: 22 }}>
            <div>
              <h3 className={SET_TITLE}>Placeholders</h3>
              <p className={SET_ABOUT}>
                There is nothing to fill in here — each one is replaced when an
                invitation is sent, with the value in the middle column. Click a
                placeholder to copy it, then paste it into any of the three
                sections below.
              </p>
            </div>
          </div>

          <table className={TOKEN_TABLE}>
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Becomes</th>
                <th>For example</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((token) => (
                <tr key={token.token}>
                  <td>
                    <button
                      type="button"
                      className={TOKEN_CHIP}
                      title="Copy"
                      onClick={() => {
                        void navigator.clipboard?.writeText(token.token)
                        toast.info(`${token.token} copied.`)
                      }}
                    >
                      {token.token}
                    </button>
                  </td>
                  <td className={TOKEN_SOURCE}>{token.source}</td>
                  <td className={TOKEN_EXAMPLE}>{token.example(settings, profile)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Section
        title="Header"
        about="Sits at the very top. A logo, a banner image, or the name of your desk."
        value={settings.template.headerHtml}
        placeholder="Your desk name, or a banner image…"
        onChange={(headerHtml) => editTemplate({ headerHtml })}
      />

      <Section
        title="Body"
        about="The message itself. Left empty, a sensible default explains what accepting means."
        value={settings.template.bodyHtml}
        placeholder="Why you are inviting them, and what the program involves…"
        onChange={(bodyHtml) => editTemplate({ bodyHtml })}
      />

      <Section
        title="Footer"
        about="The small print, under the accept button. Where to find you, or what happens next."
        value={settings.template.footerHtml}
        placeholder="How to reach you, or anything else worth saying…"
        onChange={(footerHtml) => editTemplate({ footerHtml })}
      />

      <section className={CARD}>
        <div className={SET_SECTION}>
          <div className={SET_HEAD}>
            <div>
              <h3 className={SET_TITLE}>Preview</h3>
              <p className={SET_ABOUT}>
                Roughly what a recipient sees. Their mail client decides the rest.
              </p>
            </div>
          </div>

          <div className={SET_PREVIEW}>
            <Preview settings={settings} coach={profile?.displayName ?? 'Your name'} />
          </div>
        </div>

        <div className={SET_SECTION}>
          <div className={SAVE_BAR}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={save}
              disabled={saving}
            >
              {saving && <SpinnerIcon size={14} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save program'}
            </button>
            <span className={MUTED_NOTE}>
              Markup that a mail client cannot be trusted with is removed when you
              save, and what you see afterwards is what will be sent.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ parts */

function Back() {
  return (
    <button type="button" className={UNI_BACK} onClick={() => navigate('university')}>
      <ChevronLeftIcon size={15} />
      My University
    </button>
  )
}

function Section({
  title,
  about,
  value,
  placeholder,
  onChange,
}: {
  title: string
  about: string
  value: string
  placeholder: string
  onChange: (html: string) => void
}) {
  return (
    <section className={CARD}>
      <div className={SET_SECTION}>
        <div className={SET_HEAD}>
          <div>
            <h3 className={SET_TITLE}>{title}</h3>
            <p className={SET_ABOUT}>{about}</p>
          </div>
        </div>

        <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} />
      </div>
    </section>
  )
}

/**
 * The shell, approximately.
 *
 * Deliberately not the real one: the server owns that markup, and a second
 * copy here would drift. This shows the order of the parts and the button,
 * which is what somebody laying out a template needs to see.
 */
function Preview({ settings, coach }: { settings: Settings; coach: string }) {
  const accent = /^#[0-9a-f]{6}$/i.test(settings.template.accent)
    ? settings.template.accent
    : '#6353e8'

  const fill = (markup: string) =>
    markup
      .replaceAll('{{coach}}', coach)
      .replaceAll('{{student}}', 'Alex Moreno')
      .replaceAll('{{note}}', 'A note you write when inviting them.')

  const body =
    settings.template.bodyHtml.trim() ||
    `<p>${coach} has invited you to join their trading program on RagDex.</p>`

  return (
    <div className={SET_PREVIEW_PAGE}>
      {/*
        The three sections are already sanitised server-side on save. Before a
        first save they are this editor's own output, which is the same markup
        the surface above is showing — so nothing arrives here from anywhere
        the author did not type.
      */}
      {settings.template.headerHtml.trim() !== '' && (
        <div dangerouslySetInnerHTML={{ __html: fill(settings.template.headerHtml) }} />
      )}

      <div dangerouslySetInnerHTML={{ __html: fill(body) }} />

      <p style={{ margin: '22px 0 0' }}>
        <span
          style={{
            display: 'inline-block',
            background: accent,
            color: '#fff',
            fontWeight: 600,
            padding: '13px 26px',
            borderRadius: 8,
          }}
        >
          Open RagDex to accept
        </span>
      </p>

      {settings.template.footerHtml.trim() !== '' && (
        <div
          style={{
            marginTop: 22,
            paddingTop: 22,
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: 13,
          }}
          dangerouslySetInnerHTML={{ __html: fill(settings.template.footerHtml) }}
        />
      )}

      <p style={{ marginTop: 18, color: '#9ca3af', fontSize: 12, lineHeight: 1.55 }}>
        You are reading this because {coach} invited you to{' '}
        {settings.name.trim() || 'their University'} on RagDex.
      </p>
    </div>
  )
}
