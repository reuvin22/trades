# SEO

Everything that decides whether RagDex shows up in Google lives in this folder.

If you have never done SEO before, read this page top to bottom once. It is
written to be understood, not to sound clever. Then work through
[`AUDIT.md`](AUDIT.md) in order — it is sorted by what actually moves the
needle, which is not the order most SEO checklists use.

---

## First, the honest part

You asked to be number one in Google. Nobody can promise that, and anyone who
does is selling something. Google ranks pages against every other page on the
internet competing for the same words, using signals — links, reputation, how
long the site has existed — that no file in this repo controls.

That is not a reason to do less. It is a reason to be precise about what is
actually in your control, because those things genuinely decide whether you
have a chance at all:

| You control | You influence | You don't control |
| --- | --- | --- |
| Whether Google can read the site | Whether people link to you | Where you rank |
| What each page says it is about | How long visitors stay | Who else competes |
| How fast it loads | Whether you get mentioned | How the algorithm weights things |
| How many real pages exist | How good the content is | How long it takes |

Do the first column perfectly and the second column honestly, and rankings
follow. Skip the first column and nothing else matters — a page Google cannot
read cannot rank at any price.

**Realistic timeline.** A new site is not trusted yet. Expect roughly:

- **Week 1** — indexed, findable by searching your exact brand name.
- **Month 2–3** — ranking for long, specific phrases with little competition.
- **Month 6–12** — competing for real terms, *if* content keeps being added.

"trading journal" is a term with well-funded competitors who have been at it
for years. You will not take it this quarter. You can take
"trading journal with emotion tracking" much sooner, and those visitors are
worth more anyway, because they searched for exactly what you built.

---

## The one thing to understand about this site

RagDex is a **single-page app**. The browser downloads one HTML file and
JavaScript draws everything after that. Search engines handle this far worse
than a normal website, for one specific reason:

The app puts the current screen after a `#` in the address —
`ragdex.app/#/journal`, `ragdex.app/#/landing`. **Everything after a `#` is
never sent to the server.** It is a browser-only convention for jumping to a
spot on a page. Google therefore sees every one of those as the *same single
address*.

So today RagDex has **exactly one page** as far as Google is concerned, no
matter how many screens the app has.

One page can rank for one topic. That is the ceiling, and it is the single
biggest thing standing between you and traffic. Finding 1 in
[`AUDIT.md`](AUDIT.md) explains what to do about it.

---

## What is in this folder

| File | What it does |
| --- | --- |
| [`site.config.mjs`](site.config.mjs) | **Edit this one.** Your domain, title, description, social image. Everything else reads from here. |
| [`generate.mjs`](generate.mjs) | Writes `public/robots.txt` and `public/sitemap.xml`. |
| [`og-image.mjs`](og-image.mjs) | Draws `public/og-image.png`, the picture shown when your link is shared. |
| [`audit.mjs`](audit.mjs) | Checks the built site and fails the build if something is broken. |
| [`AUDIT.md`](AUDIT.md) | What is wrong right now, in priority order, with the fix for each. |
| [`KEYWORDS.md`](KEYWORDS.md) | Which searches to go after, and which to leave alone for now. |
| [`CHECKLIST.md`](CHECKLIST.md) | Run through this before every deploy, and when adding a page. |

## Commands

```bash
npm run seo:generate   # rewrite robots.txt and sitemap.xml
npm run seo:image      # redraw the social share card
npm run seo:check      # audit the built site (needs npm run build first)
npm run seo            # all three, in order
```

`npm run build` runs `seo:generate` before it and `seo:check` after it, so the
generated files are always current and a broken tag stops the build instead of
shipping. That is deliberate: a check you have to remember to run is a check
that stops being run.

---

## Doing the first setup

### 1. Buy a domain

`trades-sable-mu.vercel.app` cannot rank well. It is a subdomain of a hosting
provider shared with millions of other projects, it says nothing about what you
do, and nobody will type it or link to it.

Buy `ragdex.com` or similar, point it at Vercel, then change `SITE_URL` in
[`site.config.mjs`](site.config.mjs) and run `npm run seo`. **Do this before
anything else** — every other step bakes the domain into files, and changing it
later means redoing them and asking Google to forget the old address.

### 2. Set up Google Search Console

Free, run by Google, and the only place you can see what Google actually thinks
of your site. Without it you are guessing.

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add your domain and verify it (the DNS method is the one that survives a
   redeploy — the HTML-file method breaks every time this app rebuilds).
3. Submit `https://yourdomain.com/sitemap.xml` under **Sitemaps**.
4. Use **URL Inspection** on your home page, then **Request Indexing**.

Then leave it alone for two weeks. Checking daily tells you nothing; the data
lags by about three days and rankings move slowly.

Do the same at [Bing Webmaster Tools](https://www.bing.com/webmasters) — it
takes five minutes and feeds ChatGPT's search results as well as Bing's.

### 3. Check it works

```bash
npm run build
```

Then look at the real thing, because a local check can lie:

- `https://yourdomain.com/robots.txt` — should load as plain text.
- `https://yourdomain.com/sitemap.xml` — should load as XML.
- Paste your URL into [opengraph.xyz](https://www.opengraph.xyz) — you should
  see the share card, not a grey box.
- Run [PageSpeed Insights](https://pagespeed.web.dev) on the home page. Aim for
  green on **LCP** (how fast the biggest thing appears) and **CLS** (how much
  the page jumps around while loading). These two are ranking factors.

---

## The words that keep coming up

Plain definitions, so the rest of this folder reads easily.

**Crawling** — Google's robot visiting your page and reading it.
**Indexing** — Google deciding to keep that page and show it in results.
Crawled is not indexed. A thin or duplicate page gets crawled and dropped.

**Canonical** — a tag naming the one true address of a page. If the same
content is reachable at `/`, `/?ref=x` and `/index.html`, Google might treat
them as three competing pages. The canonical says "they are all this one."

**robots.txt** — a text file at the root saying which paths crawlers may visit.
It controls *crawling*, not indexing.

**Sitemap** — a list of every address you want indexed. Not a command, a hint.
It matters most for sites Google would struggle to discover by following links.

**Open Graph** — the tags that decide what a link looks like when pasted into
Slack, X, Discord or iMessage. Not a ranking factor. Enormous for click-through.

**Structured data (JSON-LD)** — a block of machine-readable facts stating what
the page *is*: a product, an article, a FAQ. It is where star ratings and FAQ
dropdowns in search results come from.

**Core Web Vitals** — Google's speed measurements. LCP, CLS and INP. A real,
if small, ranking factor — and a large factor in whether visitors stay.

**E-E-A-T** — Experience, Expertise, Authoritativeness, Trust. How Google
assesses whether to trust you on a topic. It matters more in finance than
almost anywhere else, because money advice sits in what Google calls
"Your Money or Your Life" territory and is held to a higher bar. A named
author with a real track record beats an anonymous brand voice every time.

---

## The rule that outlives every tactic

Write the page for the person, then make it readable by the machine.

Every trick that ever worked the other way round — stuffing keywords, spinning
thin pages, buying links — now carries a penalty. What has never stopped
working is being the most useful page on the internet for a specific question,
and making sure Google can read it.

RagDex has a genuine advantage here: it does something specific that the big
journals do less well — emotion and behaviour, not just fills. Say that
plainly, in public, on pages Google can read. That is the whole strategy.
