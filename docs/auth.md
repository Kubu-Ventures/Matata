# Authentication: Privy email OTP

This is the full picture of how someone gets a session in Matata, how the
frontend and backend split the work, and how to set it up. It replaces the
old phone plus SMS OTP flow.

For the sequence diagram, see
[`architecture.md`](architecture.md#auth-exchange-sequence).

## The model in one paragraph

The frontend never checks a password or an OTP itself. It runs Privy's
hosted email OTP widget in the browser, gets back a short-lived Privy
session, and exchanges it once at the backend for a Matata session
(`matata_token` plus a refresh token in `localStorage`). The backend is the
only thing that verifies anything and the only thing that decides a role.

## Three kinds of session

| Kind | How it starts | Role | Notes |
|---|---|---|---|
| Anonymous reporter | first visit to `/report`, or "Continue without signing in" on `/login`, calls `authApi.anonymous()` | `anonymous_reporter` | no email, no account, works offline. The common case in the field. |
| Email reporter | `/login`, Privy email OTP, email not in `analyst_accounts` | `reporter` | same capabilities as anonymous, but the session is tied to a verified email so history follows the person across devices |
| Analyst, responder, admin | `/analyst/login`, Privy email OTP, email is provisioned in `analyst_accounts` | `analyst` \| `responder` \| `admin` | the portal at `/analyst/*` opens |

All three end in the same `saveAuth(token, role, refresh_token)` call and the
same `request()` wrapper behavior afterwards.

## Frontend pieces

| File | Responsibility |
|---|---|
| `src/components/PrivyClientProvider.tsx` | mounts `PrivyProvider` after hydration only; exports `isPrivyConfigured` and `clearPrivySession()` |
| `src/components/LoginForm.tsx` | the email and code card, `variant="reporter"` or `variant="analyst"`, loaded `ssr: false` |
| `src/lib/privyLogin.ts` | `exchangePrivySession()` and `privyErrorMessage()` |
| `src/lib/api.ts` | `authApi.verifyPrivy(privy_token, identity_token?)` posts to `POST /auth/privy/verify` |
| `src/lib/auth.ts` | `saveAuth`, `clearAuth`, `getToken`, `getRole`, `getRefreshToken`, `isAnalyst`, `isAdmin` |

### `exchangePrivySession()` step by step

1. `getAccessToken()` from Privy. If there is none, throw a user-facing
   error and let the person retry.
2. `getIdentityToken()` from Privy, wrapped in try/catch. This carries the
   verified email. It can be absent if the Privy app has identity tokens
   disabled, in which case we send nothing for it.
3. `authApi.verifyPrivy(privyToken, identityToken)` to
   `POST /auth/privy/verify`.
4. `saveAuth(data.token, data.role, data.refresh_token)`.
5. Return `{ role, isElevated }` where `isElevated` is true for `analyst`,
   `responder`, `admin`.

### The analyst-access check

`LoginForm` with `variant="analyst"` inspects `isElevated` after the
exchange. If it is false (a real Privy login, but the email is not
provisioned) it calls `clearAuth()` and `clearPrivySession()` and shows:

> This account does not have analyst access. Please contact your
> administrator.

It does not redirect. This is a courtesy message, not a security control;
the backend already refused to hand out an elevated role.

## Backend side (summary)

The backend endpoint is `POST /api/v1/auth/privy/verify` with body
`{ privy_token, identity_token? }`. It:

- verifies both tokens as ES256 JWTs against `PRIVY_VERIFICATION_KEY`, with
  issuer `privy.io` and audience `PRIVY_APP_ID`,
- reads the email from the identity token's `linked_accounts` claim (Privy
  access tokens do not carry the email),
- hashes the email and looks it up in `analyst_accounts`; a match returns
  the stored elevated role, everything else returns `reporter`,
- returns `{ token, refresh_token, role }`, the same shape the old
  `/auth/otp/verify` returned. Refresh rotation, logout, and the denylist
  are unchanged.

Full detail is in the backend repo:
`Matata-backend/docs/frontend-integration-guide.md`.

## Setup

You need a Privy app, and its App ID must match on both sides.

1. Create an app at [dashboard.privy.io](https://dashboard.privy.io).
2. User management, Authentication: enable **Email**. Disable wallets and
   every social login.
3. User management, Authentication, Advanced: turn on **"Return user data in
   an identity token"**. Without this, no login can resolve to an analyst
   role, because the backend never sees a verified email.
4. Set the App ID in two places, identically:
   - frontend: `NEXT_PUBLIC_PRIVY_APP_ID` in `matata-app/.env.local` (and in
     the deploy build environment),
   - backend: `PRIVY_APP_ID`.
5. Set `PRIVY_VERIFICATION_KEY` on the backend from the app's verification
   key in the Privy dashboard.

If `NEXT_PUBLIC_PRIVY_APP_ID` is unset, `PrivyClientProvider` is skipped,
`isPrivyConfigured` is false, and both login pages show "Sign in is not
configured for this environment". Anonymous reporting still works.

## Provisioning an analyst

An admin calls `POST /api/v1/auth/analyst/register` with
`{ email, role }` (the frontend does this from the Accounts page,
`adminApi.provisionUser(email, role)`). The backend stores a salted hash of
the email. That email can then sign in at `/analyst/login` and get the
stored role. The plaintext email is never stored.

Bootstrap the first admin with the backend CLI:
`python -m app.cli create-admin --email admin@example.org`.

## Logout

`clearAuth()` removes `matata_token`, `matata_refresh`, `matata_role`.
`clearPrivySession()` removes the `privy:*` localStorage keys so the next
login starts from the email step rather than a remembered Privy session. The
`AccountMenu` component calls both.

## Migrating from the old flow

The phone plus SMS OTP endpoints (`/auth/otp/send`, `/auth/otp/verify`) are
kept dormant on the backend, so nothing breaks if a stale client calls them.
The frontend no longer references them. `authApi.sendOtp` and
`authApi.verifyOtp` were removed from `src/lib/api.ts` and replaced with
`authApi.verifyPrivy`. `adminApi.provisionUser` takes an `email` instead of
a `phone`.
