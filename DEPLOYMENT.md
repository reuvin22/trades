# Deploying to Vercel

The frontend is hosted on Vercel; Firebase provides auth and Firestore only.
Deploying to Vercel does **not** deploy Firestore rules — those live in the
Firebase project and are published separately.

## 1. Environment variables

The Firebase **web** config is committed in `src/lib/firebase-defaults.ts`, so a
fresh deploy works with no environment configuration at all. Those values are
public identifiers that ship in the bundle regardless of where they are stored;
Firestore rules, authorized domains and API-key restrictions are what protect
the project.

Set the `VITE_FIREBASE_*` variables only when you want a deployment to point at
a *different* Firebase project — they override the committed defaults. The
server-only secrets in section 1b are a different matter and must always be set.

### Overriding the defaults

`.env.local` is gitignored and listed in `.vercelignore`, so it is never
uploaded. Vite inlines `VITE_*` variables at **build** time, which means a
Vercel build with no variables set produces a bundle with no Firebase config —
the deployed site then shows "Firebase is not connected yet" no matter what your
local file says.

Add these in **Vercel → Project → Settings → Environment Variables**, for
Production, Preview and Development:

| Variable | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIzaSy…Mwzg` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trading-journal-43d07.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `trading-journal-43d07` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trading-journal-43d07.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `628278688107` |
| `VITE_FIREBASE_APP_ID` | `1:628278688107:web:71cbc5a265c65c0aa7742e` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-TN1DPHK7F5` |

Or from the CLI:

```bash
vercel env add VITE_FIREBASE_API_KEY production
# ...repeat per variable and environment
```

**Redeploy after changing any of them.** Vercel does not rebuild on an env
change alone, and the old values stay baked into the existing bundle.

### "Keep This Value Private" — Vercel's warning on VITE_ variables

Vercel flags every `VITE_`-prefixed variable with *"The VITE_ prefix exposes
this value to the browser."* That is correct, and for the Firebase web config it
is exactly what we want: those values are public identifiers that Firebase
expects to ship in the client. Click **Change to Config** on all seven of them.

The warning becomes a real one only if a genuine secret ever gets a `VITE_`
prefix. `npm run build` now refuses to proceed in that case — see
`scripts/check-env.mjs`, which runs automatically before and after every build,
including on Vercel.

| Variable | Vercel type |
| --- | --- |
| `VITE_FIREBASE_*` (all 7) | **Config** — public by design |
| `BREVO_API_KEY` | **Secret** |
| `GEMINI_API_KEY` | **Secret** |
| `FIREBASE_SERVICE_ACCOUNT` | **Secret** |
| `APP_URL` | Config — just a URL |

## 1b. Server-only secrets (Brevo + Admin SDK)

These have **no `VITE_` prefix on purpose**. Vite inlines every `VITE_*`
variable into the client bundle, so prefixing either of these would publish it.
They are read only by the serverless function in `api/`.

| Variable | What it is |
| --- | --- |
| `BREVO_API_KEY` | Brevo transactional key. Can send mail as you — treat as a password. |
| `BREVO_SENDER_EMAIL` | A sender address **verified in Brevo**, or sends will be rejected. |
| `BREVO_SENDER_NAME` | Display name on the email. Defaults to `TradeX`. |
| `GEMINI_API_KEY` | Gemini key for the behavioural-leak card. From [AI Studio](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-flash-latest`, an alias that survives model retirements. |
| `FIREBASE_SERVICE_ACCOUNT` | The entire contents of `trading.json`, on one line. |
| `APP_URL` | e.g. `https://your-project.vercel.app`, used to build the return link. |

To load the service account into Vercel without hand-editing JSON:

```bash
node -e "console.log(JSON.stringify(require('./trading.json')))" | vercel env add FIREBASE_SERVICE_ACCOUNT production
```

This is the one legitimate home for that key: it stays server-side, is never
bundled, and never reaches a browser.

## 2. Authorized domains

Google sign-in refuses to run on a domain Firebase does not know. In
**Firebase Console → Authentication → Settings → Authorized domains**, add:

- `your-project.vercel.app`
- any custom domain you have attached

Firebase does **not** support wildcards, so per-branch preview URLs
(`app-git-branch-user.vercel.app`) each need adding, or accept that Google
sign-in only works on production and stable preview aliases.

If you miss this, the app now names the exact hostname to add in the error
message rather than showing `auth/unauthorized-domain`.

## 3. Sign-in methods

**Firebase Console → Authentication → Sign-in method** — enable **Google** and
**Email/Password**. Without this you get `auth/operation-not-allowed`.

## 4. Firestore rules

Publish [`firestore.rules`](firestore.rules) — via the console's Rules tab, or:

```bash
firebase deploy --only firestore:rules
```

The default `allow read, write: if false` blocks every request, and the sign-in
will succeed while the journal stays permanently empty.

## 5. Restrict the API key (optional but worth doing)

The web API key is public by design — it identifies the project, it does not
grant access. It is still worth limiting where it can be used:

**Google Cloud Console → APIs & Services → Credentials →** your browser key →
*Application restrictions* → **HTTP referrers**, then allow only:

```
https://your-project.vercel.app/*
https://your-custom-domain.com/*
http://localhost:*
```

This does not protect your data — rules do that — but it stops the key being
used to run up quota from someone else's site.

## What actually secures this app

| Concern | Handled by |
| --- | --- |
| Who can read/write a trade | `firestore.rules` — scoped to `request.auth.uid` |
| Who can sign in | Authorized domains + enabled providers |
| Key abuse from other origins | HTTP referrer restrictions |
| Admin access | `trading.json`, which stays off the client and out of git entirely |

The service account key is the only real secret here. It is excluded by
`.gitignore`, `.vercelignore`, and `vite.config.ts`'s `server.fs.deny`.
