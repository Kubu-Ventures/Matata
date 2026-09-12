# Security Policy

## Reporting a vulnerability

Email **collins.kubu@gmail.com** with the details. Do not open a public
issue or pull request for a suspected vulnerability.

Please include:

- what you found and where (file, route, or request),
- how to reproduce it,
- the impact you think it has.

You will get an acknowledgement within a few working days. There is no bug
bounty; this is a small open project.

## Supported versions

Only the `main` branch is supported. Fixes land there and are not
backported.

## What this frontend does and does not defend

Matata is a client-only Next.js app. It holds no server session and runs no
server-side authorization. Understanding that shapes what a vulnerability
here actually means.

### Session tokens live in `localStorage`

`matata_token`, `matata_refresh`, and `matata_role` are stored in
`localStorage` by `src/lib/auth.ts`. Any script that runs in the page origin
can read them. That makes cross-site scripting the highest-value target in
this codebase.

Consequences and the practices that follow from them:

- Never render untrusted HTML. There is no `dangerouslySetInnerHTML` in the
  app today; keep it that way, or sanitise hard if that ever changes.
- Keep dependencies patched. Dependabot is enabled; do not let alerts sit.
- User-supplied strings (report free text, landmark descriptions) are
  rendered as text by React, which escapes them. Do not bypass that.

### The analyst gate is UX, not a boundary

`src/app/analyst/layout.tsx` checks `getRole()` client-side and redirects
non-elevated users away from the portal. The admin-only "Accounts" nav item
is filtered the same way. A user can edit `localStorage` and see the portal
shell. That is expected and harmless, because:

- every data request goes to the backend with the bearer token,
- the backend re-derives the role from the token and enforces it on every
  endpoint,
- so a forged `matata_role` gets a user a broken-looking page and no data.

If you add an analyst feature, assume the backend is the only thing stopping
an unauthorised call, and make sure the backend actually checks.

### `NEXT_PUBLIC_*` values are not secrets

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_PRIVY_APP_ID` are compiled into the
client bundle and visible to anyone. That is fine: the API URL is public and
the Privy app ID is a public identifier. Do not add a real secret with a
`NEXT_PUBLIC_` prefix.

### The Privy login flow

Login runs Privy's hosted email OTP in the browser (`useLoginWithEmail`).
The Privy access token and identity token it returns are exchanged once at
`POST /auth/privy/verify` for our own session, then discarded from app state.
The backend verifies both tokens (ES256, issuer `privy.io`, audience
`PRIVY_APP_ID`) before trusting the email. `clearPrivySession()` removes the
`privy:*` localStorage keys on logout so the next login starts clean.

### PWA cache

The service worker caches page navigations (`NetworkFirst`, 30 day max). It
does not cache API responses. A shared or public device keeps the last
viewed pages in the browser cache until they expire or the site data is
cleared. Advise analysts on shared machines to sign out and clear site data.

## Non-goals

- This app is not a security boundary for the data. The backend is.
- There is no client-side encryption of stored tokens. `localStorage` is
  the trust model.
- There is no automated security testing in this repo (no test framework at
  all). Backend has its own suite and audit.
