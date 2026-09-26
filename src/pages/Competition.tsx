import {
  AnvilIcon,
  CompetitionIcon,
  StormIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  WAR_AVATAR,
  WAR_AVATAR_LETTERS,
  WAR_BADGE,
  WAR_BADGE_HOT,
  WAR_BADGES,
  WAR_CARD,
  WAR_CARD_SEAM,
  WAR_GRAIN,
  WAR_HANDLE,
  WAR_HERO,
  WAR_INNER,
  WAR_KICKER,
  WAR_LEDE,
  WAR_MAIL,
  WAR_NOTE,
  WAR_PAGE,
  WAR_PIT,
  WAR_PIT_GLYPH,
  WAR_PIT_NAME,
  WAR_PIT_SOON,
  WAR_PIT_TEXT,
  WAR_PITS,
  WAR_PLATE,
  WAR_PLATE_LABEL,
  WAR_PLATE_VALUE,
  WAR_PLATES,
  WAR_RULE,
  WAR_TITLE,
  WAR_TITLE_HOT,
  WAR_WHO,
} from '../components/ui'
import { displayNameFor, initialsFor } from '../data/messages'
import { accountTypeLabel } from '../lib/profile'
import { useImageUrl } from '../lib/useImageUrl'
import type { Profile } from '../lib/profile'

/**
 * The arena — where the competitive side of RagDex will live.
 *
 * Deliberately built as somewhere else. Every other screen is a pale,
 * rounded instrument the trader sets the palette for; this one is dark, cut
 * rather than rounded, and fixed regardless of that preference. A ladder that
 * looked like the journal would read as another tab in the journal, which is
 * the opposite of what a competitive scene is for.
 *
 * **The shell and the profile only.** The four arenas below are named and
 * described because the shape of the place is the thing being decided, but
 * none of them is wired to anything and each says so. Nothing on this page is
 * computed, ranked or invented — the only live thing is the account, which is
 * the same account, name and photo as everywhere else in the product.
 */
export function Competition({ profile }: { profile: Profile | null }) {
  const photo = useImageUrl(profile?.photoURL ?? '')

  const handle = displayNameFor(profile?.displayName ?? '', profile?.email ?? '')
  const initials = initialsFor(handle, profile?.email ?? '')

  return (
    <div className={WAR_PAGE}>
      <span className={WAR_GRAIN} aria-hidden="true" />

      <div className={WAR_INNER}>
        <header className={WAR_HERO}>
          <span className={WAR_KICKER}>
            <CompetitionIcon size={15} />
            Competition
            <span className={WAR_RULE} aria-hidden="true" />
          </span>

          <h2 className={WAR_TITLE}>
            Step into
            <br />
            the <span className={WAR_TITLE_HOT}>forge</span>
          </h2>

          <p className={WAR_LEDE}>
            Tournaments, ladders and open brackets — traders measured against each
            other rather than against themselves. Your account comes with you: the
            same name, the same journal, the same record.
          </p>
        </header>

        {/* -------------------------------------------------- the fighter */}

        <section className={WAR_CARD}>
          <span className={WAR_CARD_SEAM} aria-hidden="true" />

          <span className={WAR_AVATAR}>
            {photo ? (
              <img src={photo} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className={WAR_AVATAR_LETTERS}>{initials}</span>
            )}
          </span>

          <div className={WAR_WHO}>
            <span className={WAR_HANDLE}>{handle}</span>
            <span className={WAR_MAIL}>{profile?.email ?? ''}</span>

            <div className={WAR_BADGES}>
              <span className={`${WAR_BADGE} ${WAR_BADGE_HOT}`}>
                {accountTypeLabel(profile?.accountType)}
              </span>
              {profile?.plan !== undefined && profile.plan !== '' && (
                <span className={WAR_BADGE}>{profile.plan} plan</span>
              )}
              {profile?.marketType != null && (
                <span className={WAR_BADGE}>{profile.marketType}</span>
              )}
              {profile?.tradingStyle !== undefined && profile.tradingStyle !== '' && (
                <span className={WAR_BADGE}>{profile.tradingStyle}</span>
              )}
            </div>

            {/*
              Facts, not figures. Everything here is stored on the account and
              read back — nothing on this page derives a rank, a score or a
              standing, because none of those exist yet and inventing one is
              how a placeholder gets mistaken for a feature.
            */}
            <div className={WAR_PLATES}>
              <Plate label="Fighting since" value={joined(profile)} />
              <Plate
                label="Account"
                value={accountTypeLabel(profile?.accountType)}
              />
              <Plate label="Standing" value="Unranked" />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- the pits */}

        <div className={WAR_PITS}>
          <Pit
            glyph={<TrophyIcon size={20} />}
            name="Tournaments"
            text="Seeded brackets over a fixed window. One run, one result, no second entry."
          />
          <Pit
            glyph={<CompetitionIcon size={20} />}
            name="War"
            text="Desk against desk. A university fields a side and the cohort's numbers are the score."
          />
          <Pit
            glyph={<StormIcon size={20} />}
            name="Chaos"
            text="No setup rules, no session limits. Survive the week with the account intact."
          />
          <Pit
            glyph={<AnvilIcon size={20} />}
            name="Forge"
            text="The practice ground. Run a bracket against yourself before you enter a real one."
          />
        </div>

        <p className={WAR_NOTE}>
          None of the four is open yet — this is the shape of the place, not the
          place. What is real on this page is your account: the profile above is
          the one the rest of RagDex uses, so whatever you enter, you enter as
          yourself.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ parts */

function Plate({ label, value }: { label: string; value: string }) {
  return (
    <div className={WAR_PLATE}>
      <span className={WAR_PLATE_LABEL}>{label}</span>
      <span className={WAR_PLATE_VALUE}>{value}</span>
    </div>
  )
}

function Pit({
  glyph,
  name,
  text,
}: {
  glyph: React.ReactNode
  name: string
  text: string
}) {
  return (
    <section className={WAR_PIT}>
      <span className={WAR_PIT_GLYPH} aria-hidden="true">
        {glyph}
      </span>
      <span className={WAR_PIT_NAME}>{name}</span>
      <p className={WAR_PIT_TEXT}>{text}</p>
      <span className={WAR_PIT_SOON}>Not open yet</span>
    </section>
  )
}

/** When the account was made, or a plain dash rather than a guess. */
function joined(profile: Profile | null): string {
  const when = profile?.createdAt
  if (when == null) return '—'

  return when.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
