import { PLATFORM_ACTIVITY, type ActivityKind } from '../../data/admin'
import { AlertIcon, FilterIcon, RefreshIcon, ShieldIcon, UserPlusIcon } from '../Icons'
import { ICON_BUTTON } from '../TopBar'
import {
  ACTIVITY_FEED,
  CARD,
  CARD_HEAD,
  CARD_TITLE,
  CARD_TITLE_SMALL,
  FEED,
  FEED_ACTION,
  FEED_AGE,
  FEED_GLYPH,
  FEED_GLYPH_TONE,
  FEED_MORE,
  FEED_TEXT,
  FEED_TITLE,
  POS,
} from '../ui'

const GLYPHS: Record<ActivityKind, typeof AlertIcon> = {
  signup: UserPlusIcon,
  error: RefreshIcon,
  upgrade: AlertIcon,
  audit: ShieldIcon,
}

export function PlatformActivity() {
  return (
    <section className={`${CARD} ${ACTIVITY_FEED}`}>
      <div className={`${CARD_HEAD} items-center`}>
        <h2 className={`${CARD_TITLE} ${CARD_TITLE_SMALL}`}>Platform Activity</h2>
        <button type="button" className={ICON_BUTTON} aria-label="Filter activity">
          <FilterIcon size={16} />
        </button>
      </div>

      <ul className={FEED}>
        {PLATFORM_ACTIVITY.map((item) => {
          const Glyph = GLYPHS[item.kind]

          return (
            <li key={item.id} className="group">
              <span className={`${FEED_GLYPH} ${FEED_GLYPH_TONE[item.kind] ?? ''}`}>
                <Glyph size={16} className={item.kind === 'error' ? 'animate-spin-once' : undefined} />
              </span>

              <div className="min-w-0">
                <p className={FEED_TITLE}>{item.title}</p>
                <p className={FEED_TEXT}>
                  {item.body}
                  {item.highlight && <strong className={POS}> {item.highlight}</strong>}
                  {item.highlight && ' found.'}
                </p>
                {item.action && (
                  <a className={FEED_ACTION} href="#/admin/audit">
                    {item.action}
                  </a>
                )}
              </div>

              <span className={FEED_AGE}>{item.age}</span>
            </li>
          )
        })}
      </ul>

      <button type="button" className={FEED_MORE}>
        Load More Activities
      </button>
    </section>
  )
}
