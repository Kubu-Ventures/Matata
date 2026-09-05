## What & why

<!-- What does this change do, and why is it needed? Link related issues (e.g. "Closes #123"). -->

## How to test

<!-- Steps a reviewer can follow to verify this in the browser. Call out edge cases you checked (offline queue, RTL locale, empty/error states, etc.) -->

## Screenshots / recording

<!-- For UI changes, before/after screenshots or a short clip. Delete this section if not applicable. -->

## Checklist

- [ ] `npm run lint` passes (run from `matata-app/`)
- [ ] Change is scoped to one concern; unrelated formatting/cleanup is split into a separate PR
- [ ] Manually tested in a browser
- [ ] Any generated PWA artifacts (`public/sw.js` etc.) are included if they changed
- [ ] New user-facing strings are added to `src/lib/i18n/translations/en.ts` (and other locales where practical)
- [ ] No new abstractions/config beyond what this change actually needs
