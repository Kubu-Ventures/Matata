# Contributing to Matata

Thanks for your interest in contributing! Matata is a mobile-first PWA for crowdsourced crisis/disaster damage reporting. This guide gets you from zero to an open pull request.

The actual project lives entirely in [`matata-app/`](matata-app/) — this repo root is just a wrapper. Read [`matata-app/README.md`](matata-app/README.md) for architecture details before making non-trivial changes.

## Contents

- [Code of conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Getting set up](#getting-set-up)
- [Branching model](#branching-model)
- [Making your change](#making-your-change)
- [Commit messages](#commit-messages)
- [Opening a pull request](#opening-a-pull-request)
- [Code style](#code-style)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Git command cheat sheet](#git-command-cheat-sheet)
- [License](#license)
- [Getting help](#getting-help)

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful, assume good faith, and keep discussion focused on the work. Report unacceptable behavior to collins.kubu@gmail.com rather than in a public issue/PR thread.

## Prerequisites

- **Node.js 20+** and npm (matches the `@types/node` version pinned in `package.json`)
- **Git**
- A GitHub account, and (if you're outside the core team) a fork of this repository

There is no backend in this repo — the app talks to an external REST + SSE API (`NEXT_PUBLIC_API_URL`). You don't need to run a backend locally to work on the frontend; point `NEXT_PUBLIC_API_URL` at staging/prod, or ask a maintainer for a local backend setup if you need one.

## Getting set up

```bash
# 1. Clone (or clone your fork)
git clone https://github.com/Kubu-Ventures/Matata.git
cd Matata

# 2. If you forked, add the upstream remote so you can stay in sync
git remote add upstream https://github.com/Kubu-Ventures/Matata.git

# 3. Install dependencies — always from matata-app/, there is no root package.json
cd matata-app
npm install

# 4. (Optional) point at a different backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Turbopack powers dev; the PWA/service-worker layer is disabled in development, so test offline behavior and install prompts against a production build (`npm run build && npm run start`).

## Branching model

This project uses **GitHub Flow**: `main` is always deployable, and all work happens on short-lived branches merged back via pull request.

Branch naming (matches existing history — please follow it):

| Prefix | Use for |
|---|---|
| `feat/…` | New features |
| `fix/…` | Bug fixes |
| `chore/…` | Tooling, deps, generated artifacts (e.g. service worker) |
| `docs/…` | Documentation only |
| `refactor/…` | Code change with no behavior change |

```bash
git checkout main
git pull origin main          # or `upstream main` if working from a fork
git checkout -b feat/short-description
```

Keep branches focused on one change — small, reviewable PRs merge faster.

## Making your change

1. Make your change in `matata-app/`.
2. Run the lint gate before committing — it's the only automated check in this repo (**there is no test framework configured**; don't add Jest/Vitest/Playwright without discussing it first):
   ```bash
   npm run lint
   ```
3. Manually verify the change in the browser. For UI changes, exercise the golden path and at least one edge case (offline queue, RTL locale, empty states, etc. as relevant).
4. If you touched `next.config.ts`, PWA config, or ran a production build, the generated service worker under `public/` may change — commit that too (see prior commits tagged `chore(pwa): sync generated service worker artifact`).

## Commit messages

This repo's history mixes plain imperative commits and [Conventional Commits](https://www.conventionalcommits.org/). Prefer Conventional Commits going forward:

```
<type>(<optional scope>): <short summary, imperative mood>

<optional body: why, not what>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `revert`. Examples from this repo's own history:

```
feat(analyst): add heatmap, merge review, and expanded i18n UI
fix(i18n): wire landing page to locale translations
chore(pwa): sync generated service worker artifact
```

Write the summary in the imperative ("Add X", not "Added X" or "Adds X"), and explain *why* in the body when the reason isn't obvious from the diff alone.

## Opening a pull request

```bash
# keep your branch current before opening/updating a PR
git fetch origin
git rebase origin/main
# resolve any conflicts, then:
git push -u origin feat/short-description
gh pr create --base main --title "feat: short description" --fill
```

(No `gh` CLI? Push and open the PR from the GitHub UI instead — same target branch.)

Opening a PR pre-fills the [PR template](.github/PULL_REQUEST_TEMPLATE.md) with a checklist covering lint, testing, PWA artifacts, and i18n — fill it in rather than deleting it.

A maintainer will review, request changes if needed, and merge (squash preferred to keep `main` history clean) once approved and green.

## Code style

Full architectural conventions are documented in [`matata-app/CLAUDE.md`](matata-app/CLAUDE.md) and [`matata-app/README.md`](matata-app/README.md) — read those before touching the API layer, auth, offline queue, or i18n. Highlights:

- **TypeScript everywhere**, ESLint flat config (`eslint-config-next` core-web-vitals + typescript) — run `npm run lint`.
- **API calls** go through `src/lib/api.ts`'s `request<T>()` wrapper and the grouped `*Api` objects (`authApi`, `reportsApi`, `analystApi`, `exportApi`, `adminApi`) — don't call `fetch` directly from components.
- **Styling**: Tailwind v4 with hardcoded hex literals (no theme tokens) — reuse the existing palette (`#006EB5`, `#232E3D`, `#EDEFF0`, `#EE402D`, `#FBC412`) rather than inventing new colors. Use `cn()` (`src/lib/utils.ts`) to merge conditional classes, and extend the shared color/label maps there (`severityColors`, `statusColors`, etc.) instead of inlining new `switch` statements.
- **i18n**: add new keys to `src/lib/i18n/translations/en.ts` (the source of truth for the `TranslationKey` type) first, then other locales. Use the `useLanguage()` hook's `t` inside components already under a `LanguageProvider`.
- **Comments**: avoid comments that restate what the code does. Only comment on non-obvious *why* (a workaround, an invariant, a subtle constraint).
- **No speculative abstraction**: don't add config flags, generic helpers, or error handling for cases that can't occur. Match the scope of the PR to the problem it solves.

## Reporting bugs and requesting features

Open a GitHub issue using the [bug report](.github/ISSUE_TEMPLATE/bug_report.yml) or [feature request](.github/ISSUE_TEMPLATE/feature_request.yml) template — they prompt for the details maintainers need (repro steps, affected surface, environment, etc.).

Search existing issues first to avoid duplicates.

## Git command cheat sheet

```bash
# Sync your fork/local main with upstream before starting new work
git checkout main
git fetch upstream        # or origin, if not using a fork
git merge upstream/main   # or: git pull upstream main

# Start a new branch
git checkout -b feat/my-change

# Stage and commit
git add <specific files>   # avoid `git add -A`/`.` — review what you're staging
git commit -m "feat(scope): short summary"

# Keep your branch up to date with main (preferred over merge for a clean history)
git fetch origin
git rebase origin/main

# Fix the last commit message (only if not yet pushed/reviewed)
git commit --amend

# Squash local WIP commits before opening a PR
git rebase -i origin/main

# Push a branch (first time) / update it
git push -u origin feat/my-change
git push

# Undo uncommitted changes to a file (careful — irreversible)
git restore <file>

# See what changed
git status
git diff
git log --oneline -10
```

If you're new to rebasing: never rebase a branch someone else is also committing to, and if a rebase goes sideways, `git rebase --abort` gets you back to where you started.

## License

Matata is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contributions will be licensed under the same terms.

## Getting help

Open a draft PR early if you want feedback on direction before finishing the work, or ask in an issue. Tag a maintainer if something's blocking you.
