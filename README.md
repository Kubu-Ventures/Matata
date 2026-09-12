# Matata, Crisis Damage Reporting (Frontend)

Matata is a mobile-first Progressive Web App for crowdsourced crisis and
disaster damage reporting. People in the field report building and
infrastructure damage, even with no connection, and analysts review,
deduplicate, and export those reports from a role-gated portal.

This repository is the **frontend only**. The application lives entirely in
[`matata-app/`](matata-app/), a [Next.js](https://nextjs.org) 16 App Router
app that talks to an external REST and SSE backend. There is no backend code
here and no root-level `package.json`, so always `cd matata-app` before
running `npm` commands.

The backend lives in
[Kubu-Ventures/Matata-backend](https://github.com/Kubu-Ventures/Matata-backend).
Its `docs/frontend-integration-guide.md` is the full endpoint reference.

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
  - [Three ways in](#three-ways-in)
  - [Authentication (Privy email OTP)](#authentication-privy-email-otp)
  - [API layer](#api-layer)
  - [Offline-first submission](#offline-first-submission)
  - [Live analyst stream (SSE)](#live-analyst-stream-sse)
  - [Internationalization](#internationalization)
  - [Styling conventions](#styling-conventions)
  - [PWA and service worker](#pwa-and-service-worker)
- [Data model](#data-model)
- [Security](#security)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack dev, Webpack production build) |
| UI | React 19, Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Forms | React Hook Form with Zod (`@hookform/resolvers`) |
| Auth | Privy hosted email OTP (`@privy-io/react-auth`), exchanged for a backend session |
| Maps | Leaflet and react-leaflet, `leaflet.heat` for the analyst heatmap |
| Icons | lucide-react |
| PWA | `@ducanh2912/next-pwa` (Workbox service worker) |
| Language | TypeScript |
| Lint | ESLint 9 flat config (`eslint-config-next` core-web-vitals plus typescript) |

There is **no test framework configured**. Do not assume Jest, Vitest, or
Playwright exist unless you add one.

Node.js 20.9 or newer is required (Next 16). A `.nvmrc` pins the major
version; run `nvm use` in `matata-app/` or the repo root.

## Getting started

```bash
cd matata-app
cp .env.example .env.local   # then fill in the values, see below
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses
Turbopack. The PWA and service-worker layer is disabled in development (see
[PWA and service worker](#pwa-and-service-worker)), so offline caching and
install prompts only appear in a production build.

Signing in needs a Privy app configured (see the next section). Without one,
the reporter flow still works fully: choose "Continue without signing in" on
`/login` and you get an anonymous session.

## Environment variables

Both are `NEXT_PUBLIC_*`, so they are read at build time and baked into the
client bundle. Set them in `matata-app/.env.local` (gitignored) for local
work, and in the host's build environment for a deployment.

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Base URL of the backend REST API, including the `/api/v1` prefix. Every call in `src/lib/api.ts` and `src/lib/offline.ts` is this value plus a path. |
| `NEXT_PUBLIC_PRIVY_APP_ID` | `clx…` | Privy application ID for the email OTP login. Must be identical to `PRIVY_APP_ID` on the backend, or token verification fails on an audience mismatch for every login. If it is unset, the login screens show a "not configured" message and only anonymous reporting works. |

### Configuring the Privy app

1. Create an app at [dashboard.privy.io](https://dashboard.privy.io).
2. User management, Authentication: enable **Email**, disable everything else
   (no wallets, no social logins).
3. User management, Authentication, Advanced: turn on **"Return user data in
   an identity token"**. The backend reads the verified email from the
   identity token to resolve a provisioned analyst to their role. Without it,
   every login resolves to a plain reporter.
4. Copy the App ID into `NEXT_PUBLIC_PRIVY_APP_ID` here and `PRIVY_APP_ID` on
   the backend. They must match exactly.

## Scripts

Run these from `matata-app/`:

```bash
npm run dev      # dev server (Turbopack, PWA disabled)
npm run build    # production build via Webpack, also generates the service worker into public/
npm run start    # serve the production build
npm run lint     # ESLint (flat config)
```

## Project structure

```
matata-app/
  src/
    app/                       Next.js App Router routes
      page.tsx                 public landing page
      login/                   reporter sign-in (email OTP or continue anonymous)
      report/                  multi-step damage report form (page.tsx)
        [id]/                   report detail and status
        queued/                confirmation for offline-queued reports
      my-reports/              the reporter's own submission history
      analyst/                 role-gated analyst portal
        layout.tsx             client-side auth and role gate plus sidebar shell
        overview/  dashboard/  heatmap/  merge-review/
        ai-accuracy/  export/  admin/  reports/[id]/
        login/                 analyst sign-in (email OTP, elevated role required)
      ~offline/                PWA offline fallback page
    components/
      LoginForm.tsx            the email OTP card shared by both login pages
      PrivyClientProvider.tsx  mounts PrivyProvider after hydration; helpers for config + teardown
      layout/                  Header, Footer, AccountMenu, LanguageSwitcher
      pwa/                     InstallPrompt
      ui/                      Button, Input, Select, Badge, OfflineBanner, SyncManager
      HeatmapMap.tsx / HeatmapLayer.tsx   Leaflet heatmap for analysts
    contexts/
      LanguageContext.tsx        active locale and t()
      AnalystStreamContext.tsx   SSE connection state for the analyst portal
    hooks/
      useAnalystStream.ts        the underlying SSE hook
    lib/
      api.ts                     single HTTP client, every backend call goes through here
      auth.ts                    localStorage-backed token and role helpers
      privyLogin.ts              exchange a completed Privy login for a backend session
      offline.ts                 offline report queue and sync
      types.ts                   shared domain types (Report, Role, enums, API payloads)
      utils.ts                   cn() plus shared label and color lookup maps
      i18n/                      locale table, translator, per-locale dictionaries
  public/
    manifest.json                PWA install metadata and icons
    sw.js, workbox-*.js          generated at build time, do not hand-edit
```

## Architecture

All paths below are relative to `matata-app/`.

### Three ways in

- **Anonymous reporter.** First visit to `/report` calls
  `authApi.anonymous()` and stores a zero-friction session token. No email,
  no account. This is the default and the common case in the field.
- **Email reporter.** `/login` runs the Privy email OTP flow and exchanges
  the result for a backend session. Same reporter role, but the session is
  tied to a verified email so the person can see their history across
  devices.
- **Analyst, responder, admin.** `/analyst/login` runs the same email OTP
  flow. The backend resolves the email against its `analyst_accounts` table
  and returns an elevated role. If the account is not provisioned, the
  frontend clears the session and shows "contact your administrator".

`src/app/analyst/layout.tsx` gates the whole portal client-side by checking
`getRole()` against `analyst`, `responder`, and `admin`, redirecting to
`/analyst/login` otherwise. The admin-only "Accounts" nav item is filtered
the same way. **This is UX only, not a security boundary.** There is no
server-side route protection in this app; real authorization is enforced by
the backend on every request. See [Security](#security).

### Authentication (Privy email OTP)

The moving parts:

- **`components/PrivyClientProvider.tsx`** wraps the app in Privy's context.
  `PrivyProvider` validates its app ID against the network, so it must not
  run during static prerendering. It is mounted only after client hydration.
  On the server and the first client paint the app renders without it. If
  `NEXT_PUBLIC_PRIVY_APP_ID` is unset the provider is skipped and
  `isPrivyConfigured` is `false`.
- **`components/LoginForm.tsx`** is the interactive email and code card,
  shared by `/login` (`variant="reporter"`) and `/analyst/login`
  (`variant="analyst"`). Each page keeps its own shell (background, logo,
  footer link) and swaps its subtitle via `onStepChange`. The form is a
  `dynamic(ssr: false)` import, so it never runs on the server and always has
  the Privy provider up by the time it calls `useLoginWithEmail`.
- **`lib/privyLogin.ts`** does the exchange. After Privy's `onComplete`,
  `exchangePrivySession()` reads the Privy access token and (when available)
  the identity token, posts both to the backend via `authApi.verifyPrivy`
  (`POST /auth/privy/verify`), and stores the returned `{ token,
  refresh_token, role }` with `saveAuth()`. The identity token carries the
  verified email; it is what lets a provisioned analyst resolve to their
  role. If the Privy app has identity tokens disabled the exchange still
  succeeds and the backend issues a plain reporter session.
- **`lib/auth.ts`** stores `matata_token`, `matata_refresh`, and
  `matata_role` directly in `localStorage`. No cookies, no server session.
  `Role` is one of `anonymous_reporter | reporter | analyst | responder |
  admin`.
- **Logout** clears our keys with `clearAuth()` and best-effort clears
  Privy's browser session with `clearPrivySession()` (removes `privy:*`
  localStorage keys), so a fresh login starts from the email step.

Everything downstream of the exchange (`recoverSession`, the `request()`
wrapper, refresh rotation) is unchanged from the previous phone OTP flow.
Only the proof of identity handed to the backend is different.

### API layer

Every backend call goes through a single `request<T>()` wrapper in
`src/lib/api.ts` that:

- injects `Authorization: Bearer <token>` from `localStorage`
  (`matata_token`),
- injects `Accept-Language` from the saved locale (`matata_lang`),
- on a `401`, transparently attempts session recovery once
  (`recoverSession()`, which rotates the refresh token if one exists, else
  mints a new anonymous session) and retries the request,
- throws non-ok responses as plain `{ status, message }` objects, **not**
  `Error` instances. Catch blocks across the app do `err as { status?:
  number }`.

Endpoints are grouped by concern: `authApi`, `reportsApi`, `analystApi`,
`statsApi`, `exportApi`, `adminApi`. Add new calls to the relevant group
rather than calling `fetch` directly. `adminApi.provisionUser(email, role)`
now takes an email, matching the backend's move from phone hashes to email
hashes.

`exportApi.download()` follows the backend's async job pattern: if the
response is JSON (`{ job_id, status: "processing" }`) it polls
`exportApi.jobStatus()` every 2 seconds for up to about two minutes and then
downloads the resulting blob; if the response is the file itself, it returns
immediately.

### Offline-first submission

The report form works fully offline (`src/lib/offline.ts`):

- If `navigator.onLine` is `false` at submit time, the report plus an
  optional base64 photo (capped at 5 MB) is pushed into a localStorage-backed
  queue (`matata_offline_queue`, shape `OfflineReport`) instead of being
  POSTed.
- `SyncManager` (`src/components/ui/SyncManager.tsx`, mounted in the root
  layout) listens for the browser `online` event, flushes the queue via
  `syncQueue()`, then fires a `matata_sync` window event.
- `OfflineBanner` (`src/components/ui/OfflineBanner.tsx`) listens for
  `online`, `offline`, and `matata_sync` to show connectivity and
  pending-sync status.

When touching offline behavior, keep the `OfflineReport.fields` shape in sync
with what `reportsApi.submit` and `reportsApi.uploadPhoto` send in `api.ts`.
`syncQueue()` posts the same field names directly to `/reports` and
`/reports/:id/photo`.

### Live analyst stream (SSE)

The analyst portal keeps a live connection to `GET /analyst/stream`
(`src/hooks/useAnalystStream.ts`, wired app-wide via
`AnalystStreamContext.tsx` and read with `useAnalystStreamContext()`). It
pushes typed events (`report.created`, `report.updated`, `report.critical`,
`report.ai_divergence`, see `AnalystStreamEvent` in `src/lib/types.ts`) so
dashboards and the sidebar's connection indicator (`live`, `connecting`,
`reconnecting`, `offline`) update without polling. The sidebar also polls
`statsApi.summary()` every 60 seconds for the merge-review badge count, as a
supplement to the stream, not a replacement.

### Internationalization

10 locales, including RTL Arabic (`src/lib/i18n/locales.ts`, `LOCALES`, with
`dir` per locale). Each locale has its own dictionary in
`src/lib/i18n/translations/{locale}.ts`, keyed against the `TranslationKey`
type exported from `translations/en.ts`. English is the source of truth for
keys; other locales are typed against it, so a missing key is a type error.

- `t(locale, key, vars?)` (`src/lib/i18n/index.ts`) does `{var}`
  interpolation and falls back to English, then to the raw key.
- `LanguageProvider` (`src/contexts/LanguageContext.tsx`) persists the chosen
  locale to `localStorage` (`matata_lang`) and sets
  `document.documentElement.lang` and `dir`.
- Prefer the `useLanguage()` hook's `t` inside client components already
  under a `LanguageProvider`. Use the standalone `t(locale, ...)` import only
  where a locale value is already in scope outside JSX.

Supported locales: English, Francais, Arabic (RTL), Espanol, Kiswahili,
Hausa, Amharic, Chinese, Russian, Somali.

### Styling conventions

Tailwind v4 via `@tailwindcss/postcss`, with **no theme tokens configured**.
Colors are hardcoded hex literals in `className` (for example `#006EB5` brand
blue, `#232E3D` text and sidebar, `#EDEFF0` borders, `#EE402D` error red,
`#FBC412` warning yellow). Match these exact values rather than introducing
new ones.

`cn()` (`src/lib/utils.ts`, `clsx` plus `tailwind-merge`) is the standard way
to merge conditional classes. `utils.ts` also holds shared label and color
lookup maps for report metadata (`severityColors`, `statusColors`,
`priorityColors`). Extend these instead of inlining new switch statements.

### PWA and service worker

`next-pwa` (`next.config.ts`) generates the Workbox service worker into
`public/` at build time (`sw.js`, `workbox-*.js`, generated, do not
hand-edit) and is **disabled in development**. Key config:

- `fallbacks.document` goes to `/~offline` when navigation fails offline.
- `NetworkFirst` runtime caching for page navigations (`cacheName: 'pages'`,
  50 entries, 30 days).
- `reloadOnOnline: true` reloads the app when connectivity returns.

`public/manifest.json` defines install metadata (name, icons, theme color
`#006EB5`, standalone display). `src/components/pwa/InstallPrompt.tsx` drives
the custom install UI.

## Data model

Core domain types live in `matata-app/src/lib/types.ts` and mirror the
backend schema. Treat it as the source of truth for API shapes rather than
re-deriving them:

- **`Report`**: a single damage report. Crisis type, infrastructure type,
  damage severity, status, photo status, GPS location, AI severity
  prediction, confidence and quality score, analyst overrides, review
  priority.
- **Enums**: `Role`, `CrisisType` (`flood | earthquake | conflict | wildfire
  | other`), `InfrastructureType`, `DamageSeverity` (`minimal | partial |
  destroyed`), `ReportStatus` (`pending | verified | rejected | duplicate |
  pending_merge_review`), `PhotoStatus`, `ReviewPriority`.
- **Analyst views**: `ReportListItem`, `AnalystReportDetail` (adds
  `footprint_geojson`, `notes`, `building_timeline`), `PaginatedReports`.
- **Feature payloads**: duplicate-merge review (`ConfirmMergeResponse`,
  `MergeResponse`), AI accuracy and calibration (`AIAccuracyResponse`),
  public stats (`StatsSummaryResponse`, `HeatmapFeatureCollection`), async
  export jobs (`ExportJobResponse`, `ExportJobStatusResponse`), and the SSE
  event shape (`AnalystStreamEvent`).

## Security

What this frontend does and does not defend is written up in
[SECURITY.md](SECURITY.md). The short version:

- Session tokens live in `localStorage`, so any XSS in the app can read them.
  Keep dependencies patched and never render untrusted HTML.
- The analyst route gate and the admin nav filter are **UX only**. The
  backend is the enforcement point and re-checks role on every request.
- `NEXT_PUBLIC_*` values, including the API URL and the Privy app ID, are
  baked into the client bundle. Neither is a secret.

Report a vulnerability to collins.kubu@gmail.com, not in a public issue.

## Deployment

This is a standard Next.js app. Build and run it from `matata-app/`
(`npm run build && npm run start`), or deploy it anywhere Next.js is
supported (for example [Vercel](https://vercel.com/new) with the project root
set to `matata-app/`).

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_PRIVY_APP_ID` must be set in the target
environment **at build time**, since they are `NEXT_PUBLIC_*` variables baked
into the client bundle. Rebuild to change them.

## Documentation

- [`docs/architecture.md`](docs/architecture.md): request lifecycle, the
  auth exchange sequence, the offline queue lifecycle, and the SSE
  reconnection model, with diagrams.
- [`docs/auth.md`](docs/auth.md): the Privy email OTP flow end to end,
  including Privy app setup and the security caveats.
- Backend endpoint reference:
  [`Matata-backend/docs/frontend-integration-guide.md`](https://github.com/Kubu-Ventures/Matata-backend/blob/main/docs/frontend-integration-guide.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branching, and PR
conventions. This project follows the
[Contributor Covenant](CODE_OF_CONDUCT.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
