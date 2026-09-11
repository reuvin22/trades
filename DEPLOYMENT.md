# Deploying the web client

The client is a static bundle on Vercel. It holds no credentials — not a
Firebase config, not a vendor key, not a project id — so there is very little
here. Everything that needs configuring lives in
[`ragdex-be`](../ragdex-be/README.md), and that is where the deployment work is.

## 1. Environment variables

One, and it is optional:

| Variable | What goes in it |
| --- | --- |
| `VITE_API_BASE_URL` | Leave it **empty**. See below. |

Empty means same-origin, which is what `vercel.json` arranges with a rewrite:
`/api/*` is proxied to the Render service, so from the browser's point of view
the API is part of this site.

**That rewrite is load-bearing, not cosmetic.** The session is an HttpOnly
cookie. A cookie set by `ragdex-be.onrender.com` on a page served from
`ragdex.vercel.app` is a third-party cookie — Safari blocks those outright and
Chrome is following. Proxying through this origin makes it first-party, and has
the side benefit that CORS never enters into it.

Set `VITE_API_BASE_URL` only to point a local build at a remote API while
debugging, and expect sign-in not to stick when you do.

If the backend moves, edit the destination in [`vercel.json`](vercel.json).

## 2. What the backend needs to know about this deployment

Three of the backend's variables name this site. They are set over there, not
here, but getting them wrong breaks sign-in:

| Backend variable | Value |
| --- | --- |
| `APP_URL` | This site's origin, e.g. `https://ragdex.vercel.app`. Where sign-in returns to, and the base for links in emails. |
| `API_PUBLIC_URL` | The backend's own origin. Google redirects to it, so it must match the OAuth client exactly. |
| `CORS_ORIGINS` | This site's origin. Only consulted if you stop using the rewrite. |

## 3. Google sign-in

The OAuth client lives in the **Google Cloud console → APIs & Services →
Credentials**, not in Firebase. Its authorised redirect URI must be exactly:

```
<API_PUBLIC_URL>/api/v1/auth/google/callback
```

The client id and secret go in the backend's environment. Neither belongs here:
this site never builds an authorize URL, it navigates to
`/api/v1/auth/google/start` and lets the API do it.

## 4. Checks that run on every build

```bash
npm run check:env
```

Runs before and after `vite build`. It fails the build if anything that looks
like a credential appears in a `VITE_` variable or in `dist/` — names matching
`SECRET|PRIVATE|PASSWORD|API_KEY|CLIENT_SECRET|…`, and values shaped like a
Brevo key, an OpenRouter key, a private key, a service account, or a Google API
key.

That last one used to be exempt, because the Firebase web key was public by
design. Nothing in this bundle carries a vendor key now, so a value shaped like
one is a mistake worth failing on.

## What actually secures this app

| Concern | Handled by |
| --- | --- |
| Who can read or write a trade | The API — every repository function takes a verified uid first |
| Who can read a conversation | The API — a thread is derived from the caller's uid, never named by them |
| Where the session lives | An HttpOnly cookie the page cannot read, `SameSite` against CSRF |
| Who can sign in | The backend's Identity Toolkit calls and its OAuth client |
| Keeping credentials out of the browser | This bundle has none, and `check:env` keeps it that way |
| Admin access | The service account, which lives only in the backend's environment |

`firestore.rules` is gone from this repository. It protected a client that read
the database directly; nothing does now. The rules in the Firebase project
should be set to deny everything — the Admin SDK bypasses them regardless, so
they defend only against a credential leak, and denying all is the strongest
version of that.
