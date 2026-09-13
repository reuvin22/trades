# Checklists

Short lists you actually run, rather than a long one you skim.

---

## Once, at setup

- [ ] Domain bought and pointed at Vercel
- [ ] `SITE_URL` updated in [`site.config.mjs`](site.config.mjs)
- [ ] `npm run seo` run and the changed files committed
- [ ] Google Search Console verified by **DNS** (not the HTML-file method — a
      redeploy wipes that one)
- [ ] `sitemap.xml` submitted in Search Console
- [ ] Home page submitted through **URL Inspection → Request Indexing**
- [ ] [Bing Webmaster Tools](https://www.bing.com/webmasters) set up — five
      minutes, and it feeds AI search results as well as Bing
- [ ] Share card checked on [opengraph.xyz](https://www.opengraph.xyz)
- [ ] [PageSpeed Insights](https://pagespeed.web.dev) run, red items noted

---

## Before every deploy

Most of this is automatic. `npm run build` regenerates the files and fails if
something is broken — so in practice this list is three items.

- [ ] `npm run build` passes, including the SEO check at the end
- [ ] If `SITE_URL` changed: the canonical in `dist/index.html` matches it
- [ ] If the landing copy changed: the title and description still describe it

---

## When adding a public page

Every item here is a mistake somebody makes on their first page.

- [ ] It has a real path (`/features`), not a hash route (`#/features`) — see
      [`AUDIT.md`](AUDIT.md) finding 1 for why this is non-negotiable
- [ ] Added to `PAGES` in [`site.config.mjs`](site.config.mjs), then
      `npm run seo:generate`
- [ ] Its own `<title>`, 50–60 characters, different from every other page
- [ ] Its own `<meta name="description">`, 140–160 characters
- [ ] Its own canonical, pointing at itself
- [ ] Exactly one `<h1>`, containing the phrase the page targets
- [ ] Headings nest properly — `h1` then `h2` then `h3`, never skipping
- [ ] Every image has an `alt` that describes it; decorative ones use `alt=""`
- [ ] Links say where they go — "read the profit factor guide", never
      "click here"
- [ ] Linked from somewhere a crawler can reach, and linking out to two or
      three of your own pages
- [ ] The words are in the HTML, not only rendered by JavaScript

---

## When writing an article

- [ ] The question is answered in the first hundred words
- [ ] The target phrase appears in the title, the `h1` and the opening
      paragraph, and reads naturally out loud
- [ ] A named author with a real one-line bio — this matters more in finance
      than in any other category
- [ ] `Article` structured data, validated at
      [validator.schema.org](https://validator.schema.org)
- [ ] Real numbers and real examples rather than general advice
- [ ] Links to two or three other RagDex articles
- [ ] One link into the app, where it genuinely helps the reader
- [ ] A publication date, and an updated date when it changes

---

## Monthly

- [ ] Search Console → **Performance**: what are you appearing for?
- [ ] Filter to **positions 8–20** and improve one of those pages. Cheapest win
      available — Google already thinks the page is relevant.
- [ ] Search Console → **Pages**: anything newly excluded, and why?
- [ ] Core Web Vitals still green?
- [ ] One new Tier 1 article published

---

## Never do these

Each of these once worked. Each now carries a penalty, and reversing one takes
months.

- **Buying links.** The fastest way to a manual action.
- **Keyword stuffing.** Repeating a phrase unnaturally. Detected trivially.
- **Publishing AI-written articles unedited.** Not because AI wrote them —
  Google has said it does not care about that — but because unedited output is
  generic, and generic is what gets filtered out.
- **Hidden text.** White on white, `display:none` keyword blocks. This is
  cloaking, and it is a site-level penalty.
- **Copying competitor content.** It will not outrank the original, and it can
  get the whole domain dropped.
- **Fake reviews or invented user counts.** See [`AUDIT.md`](AUDIT.md)
  finding 5 — there is one on the login page right now.
- **Blocking the site in `robots.txt`.** A stray `Disallow: /` removes you from
  Google entirely. The audit script checks for this on every build, because it
  is the single most expensive typo in SEO and it is always an accident.
