/**
 * Everything about this site that search engines and social networks read.
 *
 * One file, because the same few facts are otherwise copied into index.html,
 * the sitemap, the robots file and the structured data — and the day they
 * disagree is the day Google starts indexing the wrong address.
 *
 * Nothing in here is secret. It is all public by definition: these values end
 * up in the HTML of a page anyone can view. Do not put keys here — see the
 * "Never" list in CLAUDE.md.
 */

/**
 * The one true address of the site.
 *
 * **Change this the day you buy a domain.** It is the single most important
 * value in this folder: it becomes the canonical URL, which is how you tell
 * Google "this page is the original". Get it wrong and you either point at a
 * page that does not exist or split your ranking across two addresses.
 *
 * No trailing slash — every path below adds its own.
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://trades-eight-vert.vercel.app').replace(
  /\/+$/,
  '',
)

/** The name a person would say out loud. Used in structured data. */
export const BRAND = 'RagDex'

/**
 * The title of the home page.
 *
 * Aim for 50–60 characters. Longer and Google truncates it with an ellipsis,
 * which costs you the end of your own sentence. Put the useful words first:
 * someone scanning results reads the left-hand side.
 */
export const TITLE = 'RagDex — Trading Journal with an AI Coach'

/**
 * The sentence under the title in search results.
 *
 * Aim for 140–160 characters. Google often rewrites it, and that is fine —
 * it is not a ranking factor. It is an advert, and its job is the click.
 */
export const DESCRIPTION =
  'Log every trade with the context and emotion behind it. RagDex turns your journal into an honest read on your edge, your habits and the leaks costing you money.'

/**
 * The picture shown when the link is pasted into Slack, X, Discord, iMessage.
 *
 * 1200×630 is the size every network agrees on. This must be an absolute URL —
 * a relative path works in a browser and fails everywhere else.
 */
export const SOCIAL_IMAGE = '/og-image.png'
export const SOCIAL_IMAGE_ALT =
  'The RagDex dashboard, showing an equity curve and a trade journal'

/** Matches the theme-color already in index.html. */
export const THEME_COLOUR = '#06050f'

/**
 * Every address a search engine should know about.
 *
 * Short, and that is the finding rather than an oversight: the app routes on
 * the URL fragment (`#/journal`), and a fragment is never sent to a server.
 * Google sees one page here. See AUDIT.md, finding 1 — until the marketing
 * pages get real paths, this list cannot honestly grow.
 *
 * `changefreq` and `priority` are advisory and widely ignored; `lastmod` is
 * the one search engines actually use, so it is filled in at build time.
 */
export const PAGES = [
  {
    path: '/',
    /** Rough guide for crawlers. Not a promise, and not a ranking factor. */
    changefreq: 'weekly',
    priority: 1.0,
  },
]

/**
 * Paths no crawler should spend its budget on.
 *
 * The API is proxied through this origin (see vercel.json), so without this
 * a crawler will happily walk into endpoints that answer 401 all day.
 */
export const DISALLOW = ['/api/', '/health']

/** Absolute URL for a site-relative path. */
export function absolute(path) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
