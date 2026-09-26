# Audit — 14 September 2026

What is standing between RagDex and search traffic, worst first.

Sorted by impact, not by effort. The first two findings matter more than
everything below them combined, and neither is a tag you can paste in.

**Status key** — 🔴 blocking · 🟠 costly · 🟡 worth doing · ✅ fixed in this pass

---

## 🔴 1. The whole app is one address

**What is wrong.** Routes live after a `#`: `#/landing`, `#/login`,
`#/journal`. A fragment is never sent to a server, so Google sees one page at
`/` and nothing else. Sixteen screens, one indexable URL.

**Why it is expensive.** You rank pages, not sites. One page can plausibly rank
for one topic. Every competitor ranking for "trading journal for forex" or
"how to track trading psychology" is doing it with a page dedicated to that
phrase. You currently have nowhere to put such a page.

**The fix.** Give the *public* pages real paths. The app behind the login can
keep hash routing forever — nobody indexes a signed-in dashboard, and it is not
worth the risk of breaking working code.

Two ways, in order of preference:

1. **A separate marketing site** at the same domain — `/`, `/features`,
   `/pricing`, `/blog/*` — as static HTML or a small static-site generator,
   with the app served at `/app`. This is what most SaaS companies do, and it
   is the lowest-risk option: the app is not touched at all.
2. **Add path routing to this app** for public pages only, with Vercel
   rewriting unknown paths to `index.html`. Cheaper to start, but every page
   still ships the whole app bundle and renders in JavaScript, so it stays
   slower and more fragile than option 1.

**Until then**, everything else in this folder is preparation. Worth doing —
it is all required eventually — but the ceiling stays at one page.

---

## 🔴 2. There is no content to rank

**What is wrong.** The public surface is a landing page and a login form. There
is nothing that answers a question anybody types into Google.

**Why it is expensive.** People do not search for products they have never
heard of. They search for problems: *"why do I keep revenge trading"*,
*"how to calculate profit factor"*, *"what should a trading journal include"*.
Those searches are how a new product gets found. Landing pages do not answer
them, and the landing page for a brand nobody knows gets no searches at all.

**The fix.** Publish pages that answer real questions, where the product is the
natural next step rather than the subject. RagDex has an unfair advantage here:
the app already encodes opinions worth writing down — the rule adherence score,
behavioural leak detection, why win rate is a bad primary metric. That last one
is a genuinely contrarian, genuinely correct take, and contrarian correct takes
are what get linked to.

See [`KEYWORDS.md`](KEYWORDS.md) for the first ten to write.

---

## 🟠 3. The domain is a Vercel subdomain

**What is wrong.** `trades-eight-vert.vercel.app`.

**Why it is costly.** It carries no signal of its own, it is not memorable, it
is not brandable, and a random-looking hosting subdomain is weak in exactly the
category — finance — where Google is strictest about trust.

**The fix.** Buy a domain, point it at Vercel, update `SITE_URL` in
[`site.config.mjs`](site.config.mjs), run `npm run seo`. Do it before you have
any links worth keeping, because moving later means asking Google to transfer
everything it learned.

---

## 🟠 4. Nothing renders without JavaScript

**What is wrong.** `dist/index.html` contains `<div id="root"></div>`. All
content arrives from JavaScript.

**Why it is costly.** Google does run JavaScript, but on a second pass that can
lag by days and is the first thing dropped when crawl budget is short. Other
crawlers — Bing, and the ones behind AI answers — are worse at it or do not try
at all. And every social preview scraper reads only the raw HTML: none of them
execute JavaScript, ever.

**The fix.** Whichever route finding 1 takes, make sure the public pages ship
their words in the HTML. A static marketing site solves this by construction.
If you stay in the SPA, pre-render the public routes at build time.

**Meanwhile** the tags added in this pass do carry the important sentences in
raw HTML — title, description, Open Graph, JSON-LD. That is why a share link
shows a proper card today even though the body is empty.

---

## 🟡 5. Fabricated social proof

**What is wrong.** [`Login.tsx:183`](../src/pages/Login.tsx#L183) reads
*"12,480 traders journaling this week"*.

**Why it matters.** Two reasons, and the second is the one that bites.

First, Google assesses finance sites on trust, and a number that cannot be
substantiated is the kind of thing a quality rater flags. Second — and this has
nothing to do with SEO — if a real user or a journalist asks where the figure
comes from, there is no answer. That is a bad day for a brand whose entire
pitch is honest self-assessment.

**The fix.** Remove it, or replace it with something true. "Built by traders,
for traders" costs nothing and is defensible. Real numbers, once you have them,
are far more persuasive anyway.

Not changed in this pass: it is product copy, and that is your call.

---

## ✅ Fixed in this pass

| Was | Now |
| --- | --- |
| No `robots.txt` — crawlers guessing, and free to walk `/api/` | Generated, with `/api/` and `/health` excluded and the sitemap named |
| No `sitemap.xml` | Generated from [`site.config.mjs`](site.config.mjs), with `lastmod` |
| No canonical link | Absolute canonical from `SITE_URL` |
| No Open Graph or Twitter tags — links pasted anywhere showed a bare grey box | Full set, with an absolute image URL |
| No share image | `public/og-image.png`, 1200×630, drawn from the app's own theme |
| No structured data | `SoftwareApplication` JSON-LD |
| Title said "Know Your Trades. Grow Your Edge." — a slogan nobody searches for | "RagDex — Trading Journal with an AI Coach": the brand, then what it is |
| Nothing verified any of this | `npm run seo:check` runs on every build and fails on real breakage |

### On the title change

The old title was a good slogan and a bad title. A title has two jobs: tell
Google what the page is about, and earn a click from someone scanning ten blue
links. "Know Your Trades. Grow Your Edge." does neither — nobody searches those
words, and it does not say what the product *is*.

"RagDex — Trading Journal with an AI Coach" is 41 characters, leads with the
brand, and contains the two phrases someone might actually type. The slogan is
still on the landing page, which is where a slogan belongs.

---

## What to do next, in order

1. Buy a domain. Update `SITE_URL`. (One hour, including DNS.)
2. Set up Search Console and submit the sitemap. (Twenty minutes.)
3. Decide on finding 1 — separate marketing site, or path routing. (One
   decision, then a week of work either way.)
4. Write the first three articles from [`KEYWORDS.md`](KEYWORDS.md).
5. Remove or replace the fabricated user count.
6. Run PageSpeed Insights and fix whatever it flags red.

Steps 1 and 2 are today. Step 3 is the one that decides whether any of this
turns into traffic.
