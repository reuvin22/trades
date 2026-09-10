import { PLATFORM_ACTIVITY, type ActivityKind } from '../../data/admin'
import { AlertIcon, FilterIcon, RefreshIcon, ShieldIcon, UserPlusIcon } from '../Icons'

const GLYPHS: Record<ActivityKind, typeof AlertIcon> = {
  signup: UserPlusIcon,
  error: RefreshIcon,
  upgrade: AlertIcon,
  audit: ShieldIcon,
}

export function PlatformActivity() {
  return (
    <section className="card activity-feed">
      <div className="card-head feed-head">
        <h2 className="card-title small">Platform Activity</h2>
        <button type="button" className="icon-button" aria-label="Filter activity">
          <FilterIcon size={16} />
        </button>
      </div>

      <ul className="feed">
        {PLATFORM_ACTIVITY.map((item) => {
          const Glyph = GLYPHS[item.kind]

          return (
            <li key={item.id} className={`feed-item ${item.kind}`}>
              <span className="feed-glyph">
                <Glyph size={16} />
              </span>

              <div className="feed-body">
                <p className="feed-title">{item.title}</p>
                <p className="feed-text">
                  {item.body}
                  {item.highlight && <strong className="pos"> {item.highlight}</strong>}
                  {item.highlight && ' found.'}
                </p>
                {item.action && (
                  <a className="feed-action" href="#/admin/audit">
                    {item.action}
                  </a>
                )}
              </div>

              <span className="feed-age">{item.age}</span>
            </li>
          )
        })}
      </ul>

      <button type="button" className="feed-more">
        Load More Activities
      </button>
    </section>
  )
}
