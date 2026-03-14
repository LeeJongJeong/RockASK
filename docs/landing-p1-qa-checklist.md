# Landing P1 QA Checklist

Base page: `apps/web/app/page.tsx`

Purpose: Track the landing P1 implementation QA scope and the current verification status.

## Test Environment

- The verification target is the production build from `apps/web` served with `next start`.
- The landing page must keep working with mock and fallback data even when backend APIs are unavailable.
- Responsive verification covers `375px`, `768px`, and `1280px` widths.

## Checklist

| ID | Item | Expected result | Status | Notes |
| --- | --- | --- | --- | --- |
| QA-01 | Initial landing load | `/` responds with `200` and renders the core landing sections. | Passed | Verified through runtime response and page content checks. |
| QA-02 | Header search submit | A valid query submits from the header search and routes to the next screen or fallback chat route. | Passed | Verified in Headless Edge against `/chats/...`. |
| QA-03 | Hero search submit | The main search input and `Start query` button submit correctly. | Passed | Verified in Headless Edge against `/chats/...`. |
| QA-04 | Scope selection | The selected scope changes visually and persists across refresh. | Passed | Verified with stored `last_scope_id` restoration. |
| QA-05 | Recommended prompt execution | Clicking a recommended prompt triggers submit and moves to the chat route. | Passed | Verified in Headless Edge. |
| QA-06 | Recent chat navigation | Clicking a recent chat opens the placeholder chat detail route. | Passed | Verified against `/chats/chat-1`. |
| QA-07 | Knowledge space navigation | Clicking a knowledge space opens the placeholder detail route. | Passed | Verified against `/knowledge-spaces/ks-strategy`. |
| QA-08 | Recent update navigation | Clicking a recent update opens the placeholder document detail route. | Passed | Verified against `/documents/update-security`. |
| QA-09 | Theme toggle | The header toggle switches theme and keeps the preference after refresh. | Passed | Verified with DOM theme state and stored preference. |
| QA-10 | Alerts dropdown open/close | Alerts open and close from the button, outside click, and `Esc`. | Passed | Verified with unread badge behavior and focus restore. |
| QA-11 | Mobile drawer | The mobile drawer opens, traps focus, closes on overlay and `Esc`, and restores focus. | Passed | Verified in Headless Edge at mobile width. |
| QA-12 | Data health refresh | Manual refresh and the periodic refresh do not break the UI. | Passed | Verified with manual refresh and accelerated polling. |
| QA-13 | Empty state | Empty collections render explicit section empty states without layout breakage. | Passed | Verified with `/?fixture=empty` and four empty-state blocks. |
| QA-14 | Accessibility basics | Core controls expose accessible labels and keyboard flows keep focus in the correct place. | Passed | Verified for header search, hero search, theme toggle, alerts dialog, and mobile drawer. |
| QA-15 | Responsive layout | `375px`, `768px`, and `1280px` widths render without horizontal overflow. | Passed | Verified by layout width checks in Headless Edge. |

## Verification Record

- 2026-03-14: `corepack pnpm --filter @rockask/web typecheck` passed.
- 2026-03-14: `corepack pnpm --filter @rockask/web check` passed.
- 2026-03-14: `corepack pnpm --filter @rockask/web build` passed.
- 2026-03-14: Runtime route checks returned `200` for `/`, `/chats/chat-1`, `/knowledge-spaces/ks-strategy`, and `/documents/update-security`.
- 2026-03-14: Added an empty dashboard fixture path through `/?fixture=empty` and verified four rendered empty-state blocks.
- 2026-03-14: Verified keyboard focus restore for the alerts dialog and mobile drawer in Headless Edge.
- 2026-03-14: Verified responsive width checks at `375px`, `768px`, and `1280px` with no horizontal overflow.
- 2026-03-14: Fixed two landing regressions during QA: the alerts unread badge no longer reappears after close, and the stored scope now restores after refresh.