# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Run all commands from `matata-app/` (the repo root is just a wrapper directory containing this one project).

```bash
npm run dev      # start dev server (Turbopack, PWA disabled in dev)
npm run build    # production build (also generates the PWA service worker)
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test framework configured in this project — do not assume Jest/Vitest exist.

## Architecture

Matata is a Next.js 16 (App Router) PWA for crowdsourced crisis/disaster damage reporting. It talks to an external backend API (`NEXT_PUBLIC_API_URL`, default `http://157.173.121.74:8000/api/v1`) — there is no backend code in this repo.

### Two user-facing surfaces

- **Public reporter flow** (`src/app/page.tsx`, `src/app/report/*`, `src/app/login/*`): anonymous or OTP-authenticated citizens submit a multi-step damage report (location → crisis type → details → photo/review) via `src/app/report/page.tsx`.
- **Analyst portal** (`src/app/analyst/*`): role-gated dashboard for reviewing, merging, and exporting reports. `src/app/analyst/layout.tsx` client-side gates access by checking `getRole()` against `analyst`/`responder`/`admin` and redirects to `/analyst/login` otherwise. The `admin`-only "Accounts" nav item is filtered client-side too — there is no server-side route protection, so treat this as UX-only, not a security boundary.

### API layer (`src/lib/api.ts`)

All backend calls go through a single `request<T>()` wrapper that injects the `Authorization: Bearer <token>` header from `localStorage` (`matata_token`) and an `Accept-Language` header from the saved locale (`matata_lang`). Endpoints are grouped into `authApi`, `reportsApi`, `analystApi`, `exportApi`, `adminApi` — add new backend calls there rather than calling `fetch` directly. Errors from a non-ok response are thrown as `{ status, message }` objects, not `Error` instances — catch blocks across the app do `err as { status?: number }`.

### Auth (`src/lib/auth.ts`)

Token, refresh token, and role are stored directly in `localStorage` (`matata_token`, `matata_refresh`, `matata_role`) — no cookies, no server session. `Role` is one of `anonymous_reporter | reporter | analyst | responder | admin` (`src/lib/types.ts`). Reporters get an anonymous session token from `authApi.anonymous()` on first visit to `/report`; analysts authenticate via phone/OTP (`authApi.sendOtp`/`verifyOtp`).

### Offline-first submission (`src/lib/offline.ts`)

The report form works offline: if `navigator.onLine` is false at submit time, the report (plus an optional base64 photo, capped at 5MB) is pushed into a `localStorage`-backed queue (`matata_offline_queue`) instead of being POSTed. `SyncManager` (`src/components/ui/SyncManager.tsx`, mounted in the root layout) listens for the `online` event and flushes the queue via `syncQueue()`, then fires a `matata_sync` window event. `OfflineBanner` listens for `online`/`offline`/`matata_sync` to show connectivity/pending-sync status. When touching offline behavior, keep the queue schema (`OfflineReport`) and the field names sent to `/reports` in sync with `reportsApi.submit`/`uploadPhoto` in `api.ts`.

### i18n (`src/lib/i18n/`, `src/contexts/LanguageContext.tsx`)

10 locales including RTL Arabic (`src/lib/i18n/locales.ts` defines `LOCALES` with `dir`). Each locale has its own dictionary file in `src/lib/i18n/translations/`, keyed against the `TranslationKey` type exported from `translations/en.ts` (the source of truth for keys — other locales are typed against it). `t(locale, key, vars?)` in `src/lib/i18n/index.ts` does `{var}` interpolation and falls back to English then the raw key. `LanguageProvider` persists the chosen locale to `localStorage` (`matata_lang`) and sets `document.documentElement.lang`/`dir`. Prefer the `useLanguage()` hook's `t` inside client components already in a `LanguageProvider` subtree; the standalone `t(locale, ...)` import is used where a locale value is already in scope (e.g. computed outside JSX).

### Styling conventions

Tailwind v4 (via `@tailwindcss/postcss`), no theme tokens configured — colors are hardcoded hex literals directly in `className` (e.g. `#006EB5` brand blue, `#232E3D` text, `#EDEFF0` borders, `#EE402D` error red, `#FBC412` warning yellow). Match these exact values rather than introducing new ones. `cn()` (`src/lib/utils.ts`, clsx + tailwind-merge) is the standard way to merge conditional classes; `utils.ts` also holds shared label/color lookup maps (`severityColors`, `statusColors`, `priorityColors`, etc.) for report metadata — extend these instead of inlining new switch statements.

### PWA

`next-pwa` (`next.config.ts`) generates the service worker into `public/` at build time and is disabled in development. `public/manifest.json` defines install metadata/icons.
