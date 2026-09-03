# Matata — Crisis Damage Reporting (Frontend)

Matata is a mobile-first Progressive Web App for crowdsourced crisis and disaster damage reporting. Citizens report building/infrastructure damage from the field — even offline — and analysts review, deduplicate, and export the incoming reports from a role-gated portal.

This repository contains the **frontend only**. It is a [Next.js](https://nextjs.org) 16 App Router application that talks to an external REST + SSE backend; there is no backend code here.

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
  - [Two user-facing surfaces](#two-user-facing-surfaces)
  - [API layer](#api-layer)
  - [Auth](#auth)
  - [Offline-first submission](#offline-first-submission)
  - [Live analyst stream (SSE)](#live-analyst-stream-sse)
  - [Internationalization](#internationalization)
  - [Styling conventions](#styling-conventions)
  - [PWA / service worker](#pwa--service-worker)
- [Data model](#data-model)
- [Deployment](#deployment)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack dev / Webpack prod build) |
| UI | React 19, Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| Maps | Leaflet + react-leaflet, `leaflet.heat` for the analyst heatmap |
| Icons | lucide-react |
| PWA | `@ducanh2912/next-pwa` (Workbox-based service worker) |
| Language | TypeScript |
| Lint | ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript) |

There is **no test framework configured** — do not assume Jest/Vitest/Playwright exist unless you add one.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses Turbopack; the PWA/service-worker layer is disabled in development (see [PWA](#pwa--service-worker)), so offline caching and install prompts only appear in a production build.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://157.173.121.74:8000/api/v1` | Base URL of the backend REST API. All requests in `src/lib/api.ts` and `src/lib/offline.ts` are built by concatenating this with a path. |

Set it in `.env.local` (gitignored) to point at a local or staging backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Scripts

Run these from `matata-app/` (this directory):

```bash
npm run dev      # start dev server (Turbopack, PWA disabled)
npm run build    # production build via Webpack — also generates the service worker into public/
npm run start    # serve the production build
npm run lint     # ESLint (flat config)
```

## Project structure

```
src/
  app/                    # Next.js App Router routes
    page.tsx              # public landing page
    login/                # reporter OTP login
    report/                # multi-step damage report form (page.tsx)
      [id]/                # report detail / status
      queued/               # confirmation for offline-queued reports
    my-reports/            # reporter's own submission history
    analyst/                # role-gated analyst portal
      layout.tsx           # client-side auth/role gate + sidebar shell
      overview/  dashboard/  heatmap/  merge-review/
      ai-accuracy/  export/  admin/    reports/[id]/
      login/               # analyst phone/OTP login
    ~offline/              # PWA offline fallback page
  components/
    layout/                # Header, Footer, AccountMenu, LanguageSwitcher
    pwa/                   # InstallPrompt
    ui/                    # Button, Input, Select, Badge, OfflineBanner, SyncManager
    HeatmapMap.tsx / HeatmapLayer.tsx  # Leaflet heatmap for analysts
  contexts/
    LanguageContext.tsx    # active locale + t()
    AnalystStreamContext.tsx  # SSE connection state for the analyst portal
  hooks/
    useAnalystStream.ts    # underlying SSE hook
  lib/
    api.ts                 # single HTTP client — all backend calls go through here
    auth.ts                # localStorage-backed token/role helpers
    offline.ts              # offline report queue + sync
    types.ts                # shared domain types (Report, Role, enums, API payloads)
    utils.ts                # cn() + shared label/color lookup maps
    i18n/                   # locale table, translator, per-locale dictionaries
public/
  manifest.json            # PWA install metadata/icons
  sw.js, workbox-*.js       # generated at build time — do not hand-edit
```

## Architecture

### Two user-facing surfaces

- **Public reporter flow** (`src/app/page.tsx`, `src/app/report/*`, `src/app/login/*`): anonymous or OTP-authenticated citizens submit a multi-step damage report (location → crisis type → details → photo → review) via `src/app/report/page.tsx`.
- **Analyst portal** (`src/app/analyst/*`): a role-gated dashboard for reviewing, merging, and exporting reports. `src/app/analyst/layout.tsx` checks `getRole()` client-side against `analyst`/`responder`/`admin` and redirects to `/analyst/login` otherwise; the `admin`-only "Accounts" nav item is filtered the same way. **This is UX-only, not a security boundary** — there is no server-side route protection, so any real authorization must be enforced by the backend.

### API layer

All backend calls go through a single `request<T>()` wrapper in `src/lib/api.ts` that:

- injects `Authorization: Bearer <token>` from `localStorage` (`matata_token`),
- injects `Accept-Language` from the saved locale (`matata_lang`),
- on a `401`, transparently attempts session recovery once (`recoverSession()` — refresh-token rotation if one exists, else mints a new anonymous session) and retries the request,
- throws non-ok responses as plain `{ status, message }` objects, **not** `Error` instances — catch blocks across the app do `err as { status?: number }`.

Endpoints are grouped by concern: `authApi`, `reportsApi`, `analystApi`, `statsApi`, `exportApi`, `adminApi`. Add new backend calls to the relevant group rather than calling `fetch` directly.

`exportApi.download()` is worth knowing about: it triggers a report export and transparently follows the backend's async job pattern — if the response is JSON (`{ job_id, status: "processing" }`) it polls `exportApi.jobStatus()` every 2s for up to ~2 minutes and then downloads the resulting blob; if the response is the file itself, it returns immediately.

### Auth

`src/lib/auth.ts` stores everything directly in `localStorage` — `matata_token`, `matata_refresh`, `matata_role` — no cookies, no server session. `Role` is one of `anonymous_reporter | reporter | analyst | responder | admin` (`src/lib/types.ts`).

- Reporters get an anonymous session token from `authApi.anonymous()` on first visit to `/report`.
- Analysts authenticate via phone + OTP (`authApi.sendOtp` / `authApi.verifyOtp`).
- `isAnalyst()` / `isAdmin()` helpers gate UI, mirrored by the checks in `analyst/layout.tsx`.

### Offline-first submission

The report form works fully offline (`src/lib/offline.ts`):

- If `navigator.onLine` is `false` at submit time, the report — plus an optional base64 photo, capped at 5MB — is pushed into a `localStorage`-backed queue (`matata_offline_queue`, shape `OfflineReport`) instead of being POSTed.
- `SyncManager` (`src/components/ui/SyncManager.tsx`, mounted in the root layout) listens for the browser `online` event and flushes the queue via `syncQueue()`, then fires a `matata_sync` window event.
- `OfflineBanner` (`src/components/ui/OfflineBanner.tsx`) listens for `online` / `offline` / `matata_sync` to show connectivity and pending-sync status.

When touching offline behavior, keep the `OfflineReport.fields` shape in sync with what `reportsApi.submit` / `reportsApi.uploadPhoto` send in `api.ts` — `syncQueue()` posts the same field names directly to `/reports` and `/reports/:id/photo`.

### Live analyst stream (SSE)

The analyst portal keeps a live connection to `GET /analyst/stream` (`src/hooks/useAnalystStream.ts`, wired up app-wide via `AnalystStreamContext.tsx` and consumed with `useAnalystStreamContext()`). It pushes typed events (`report.created`, `report.updated`, `report.critical`, `report.ai_divergence` — see `AnalystStreamEvent` in `src/lib/types.ts`) so dashboards and the sidebar's connection indicator (`live` / `connecting` / `reconnecting` / `offline`) update without polling. The sidebar also polls `statsApi.summary()` every 60s for the merge-review badge count as a supplement, not a replacement, for the stream.

### Internationalization

10 locales, including RTL Arabic — `src/lib/i18n/locales.ts` (`LOCALES`, with `dir` per locale). Each locale has its own dictionary in `src/lib/i18n/translations/{locale}.ts`, keyed against the `TranslationKey` type exported from `translations/en.ts` (English is the source of truth for keys; other locales are typed against it, so a missing key is a type error).

- `t(locale, key, vars?)` (`src/lib/i18n/index.ts`) does `{var}` interpolation and falls back to English, then to the raw key.
- `LanguageProvider` (`src/contexts/LanguageContext.tsx`) persists the chosen locale to `localStorage` (`matata_lang`) and sets `document.documentElement.lang` / `dir`.
- Prefer the `useLanguage()` hook's `t` inside client components already under a `LanguageProvider`. Use the standalone `t(locale, ...)` import only where a locale value is already in scope outside JSX (e.g. computed values, non-component code).

Supported locales: English, Français, العربية (RTL), Español, Kiswahili, Hausa, አማርኛ, 中文, Русский, Soomaali.

### Styling conventions

Tailwind v4 via `@tailwindcss/postcss`, with **no theme tokens configured** — colors are hardcoded hex literals directly in `className` (e.g. `#006EB5` brand blue, `#232E3D` text/sidebar, `#EDEFF0` borders, `#EE402D` error red, `#FBC412` warning yellow). Match these exact values rather than introducing new ones.

`cn()` (`src/lib/utils.ts`, `clsx` + `tailwind-merge`) is the standard way to merge conditional classes. `utils.ts` also holds shared label/color lookup maps for report metadata (`severityColors`, `statusColors`, `priorityColors`, etc.) — extend these instead of inlining new switch statements.

### PWA / service worker

`next-pwa` (`next.config.ts`) generates the Workbox service worker into `public/` at build time (`sw.js`, `workbox-*.js` — generated, don't hand-edit) and is **disabled in development**. Key config:

- `fallbacks.document` → `/~offline` when navigation fails offline.
- `NetworkFirst` runtime caching for page navigations (`cacheName: 'pages'`, 50 entries / 30 days).
- `reloadOnOnline: true` reloads the app when connectivity returns.

`public/manifest.json` defines install metadata (name, icons, theme color `#006EB5`, standalone display). `src/components/pwa/InstallPrompt.tsx` drives the custom "install app" UI.

## Data model

Core domain types live in `src/lib/types.ts` and mirror the backend's schema — treat it as the source of truth for API shapes rather than re-deriving them ad hoc:

- **`Report`** — a single damage report: crisis type, infrastructure type, damage severity, status, photo status, GPS location, AI severity prediction/confidence/quality score, analyst overrides, review priority.
- **Enums**: `Role`, `CrisisType` (`flood | earthquake | conflict | wildfire | other`), `InfrastructureType`, `DamageSeverity` (`minimal | partial | destroyed`), `ReportStatus` (`pending | verified | rejected | duplicate | pending_merge_review`), `PhotoStatus`, `ReviewPriority`.
- **Analyst views**: `ReportListItem`, `AnalystReportDetail` (adds `footprint_geojson`, `notes`, `building_timeline`), `PaginatedReports`.
- **Feature-specific payloads**: duplicate-merge review (`ConfirmMergeResponse`, `MergeResponse`), AI accuracy/calibration (`AIAccuracyResponse`), public stats (`StatsSummaryResponse`, `HeatmapFeatureCollection`), async export jobs (`ExportJobResponse`, `ExportJobStatusResponse`), and the SSE event shape (`AnalystStreamEvent`).

## Deployment

This is a standard Next.js app (`npm run build && npm run start`) and can be deployed anywhere Next.js is supported (e.g. [Vercel](https://vercel.com/new)). Make sure `NEXT_PUBLIC_API_URL` is set for the target environment at build time, since it's a `NEXT_PUBLIC_*` variable baked into the client bundle.
