# PR: Finalize Landing P1 QA And Accessibility

## Summary

- finalize the landing page P1 hardening work
- add an empty dashboard fixture path for empty-state verification
- complete keyboard, focus, and responsive QA coverage
- document the landing QA result set

## What Changed

- added `/?fixture=empty` support through the landing data-loading path
- added `apps/web/lib/mock-dashboard-fixtures.ts`
- added `apps/web/components/landing/alerts-dropdown.tsx`
- added `apps/web/components/landing/mobile-nav-drawer.tsx`
- updated landing state wiring in `apps/web/components/landing/landing-page-client.tsx`
- updated search, empty-state, and health-card accessibility handling
- updated the landing QA checklist in `docs/landing-p1-qa-checklist.md`

## Verification

- `corepack pnpm --filter @rockask/web typecheck`
- `corepack pnpm --filter @rockask/web check`
- `corepack pnpm --filter @rockask/web build`
- Headless Edge runtime QA
- verified `/?fixture=empty` renders four empty-state blocks
- verified alerts dialog focus restore and mobile drawer focus trap
- verified responsive layout checks at `375px`, `768px`, and `1280px`

## Notes

- some touched UI copy was normalized to ASCII-safe text while stabilizing the landing QA flow
- if product copy should remain Korean in these surfaces, a follow-up localization pass is needed