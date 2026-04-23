# MTT Coach Full-System Audit

Date: 2026-04-24  
Branch: `codex/full-system-audit-and-hardening`

## Product Scope Lock

Source-of-truth scope for this pass:

- Preflop only
- Tournament only
- Big Blind Ante (BBA) only
- Up to 40bb only

Out of scope:

- Postflop trainer flows
- Cash-game flows
- Alternate ante formats
- Deep-stack generic solver UX

## Route Inventory

Defined in `client/src/App.tsx`:

- `/` Dashboard
- `/log`
- `/study`
- `/log-session`
- `/log-tournament`
- `/hands`
- `/hands/:id`
- `/leaks/:id`
- `/tournaments/:id`
- `/study-plan`
- `/guided-session`
- `/study/icm`
- `/study/icm/:packSlug`
- `/study/icm/spot/:spotId`
- `/strategy`
- `/strategy/library`
- `/strategy/trainer`
- `/404`

## Core Surface Inventory

### Primary pages

- Dashboard (`client/src/pages/Dashboard.tsx`)
- Study (`client/src/pages/Study.tsx`, `client/src/components/study/StudyCockpit.tsx`)
- Hand Ranges (`client/src/pages/strategy/StrategyLibrary.tsx`)
- Range Trainer (`client/src/pages/strategy/RangeTrainer.tsx`)
- Log (`client/src/pages/Log.tsx`)
- Hands list/detail (`client/src/pages/HandsList.tsx`, `client/src/pages/HandDetail.tsx`)
- Leak detail (`client/src/pages/LeakDetail.tsx`)
- Tournament detail (`client/src/pages/TournamentDetail.tsx`)

### Strategy module components

- `PreflopSetupControls`
- `RangeMatrix`
- `ActionLegend`
- `TrainerCard`
- `TrainerResultReveal`
- `TableContext`
- `HandCards` / `PlayingCard`

### Modal/form flows

- `LogHandModalV2_1`
- `LogTournamentModal`
- `AddLeakModal`
- `AddNoteModal`
- `EditTournamentModal`
- Shared shell: `BottomSheetModal` and `ui/dialog`

## Data and Logic Inventory

### Server strategy flow

- Router: `server/strategy/router.ts`
- Service: `server/strategy/service.ts`
- Shared constants/types: `shared/strategy.ts`, `shared/preflop.ts`

Core chain:

1. Setup filters (`stackDepth`, `spotGroup`, `heroPosition`, `villainPosition`, `chartId`)
2. Spot listing / chart selection
3. Trainer chart selection with anti-repeat guards
4. Hand selection with action balancing and marginal fold filtering
5. Submit attempt validation against canonical chart action
6. Chart reveal in trainer UI

### Relevant DB tables

- `rangeCharts`
- `rangeChartActions`
- `trainerAttempts`
- `hands`
- `leaks`
- `handLeaks`
- `tournaments`
- `studySessions`
- `weeks`
- `users`

## CTA and Link Audit Snapshot

Validated key path intents:

- Dashboard -> Study / Hand Ranges / Trainer
- Hand Ranges -> Train (`/strategy/trainer?chartId=...`)
- Trainer reveal -> View Full Chart (`/strategy/library?chartId=...`)
- Log -> hand capture and review queue (`/hands/:id`)
- Study hub module links to strategy/log/review

Known non-core route reference:

- `client/src/pages/ComponentShowcase.tsx` includes `/components` breadcrumb link (no matching route in `App.tsx`). This is a non-core showcase path and will be treated as secondary.

## Findings Queue (Track + Resolve)

### Logic/consistency

- [x] Query-param synchronization between chart and trainer/library state
- [x] Hand-class mapping and explanation parity checks
- [x] Trainer randomization/repetition guard audit
- [x] Chart/trainer context parity under filter changes

### UX/layout

- [x] Legacy light-themed detail pages still mismatched (`LeakDetail`, `TournamentDetail`)
- [x] Modal/form validation UX uses blocking `alert(...)` in multiple active flows
- [x] Form and card hierarchy inconsistencies across logs/review pages
- [x] Table context alignment and seat clarity pass

### Test and reliability

- [x] Add pure logic tests for hand mapping and marginal fold selection
- [x] Stabilize test behavior when local DB is unavailable
- [x] Re-run full check/build/test after fixes

## Fixes Completed in This Pass

1. Router/state hardening
   - `chartId` query state is now synchronized in both `RangeTrainer` and `StrategyLibrary`.
   - Broader modes no longer stay accidentally pinned by stale `chartId`.
2. Trainer logic trust fixes
   - Added pure tests for matrix coordinate mapping, marginal fold filtering, pool building, and hand normalization.
   - Added contradictory-note guards and tests so suited/offsuit/pair explanations do not conflict with displayed hand class.
3. Visual and UX consistency
   - Reworked modal shell (`BottomSheetModal`) onto consistent dialog primitives with dark-theme layering.
   - Active modal flows (`AddLeak`, `AddNote`, `LogTournament`, `EditTournament`) now use toast validation instead of blocking alerts.
   - Unified trainer table seat map alignment and cleaner role labeling.
4. Route surface cleanup
   - Rebuilt legacy light pages (`TournamentDetail`, `LogTournament`, `GuidedSession`, `LogStudySession`) into the shared dark system.
   - Updated quick hand capture (`QuickAddHand`) to preflop-first, BBA-context, and stack cap validation (`<=40bb`).

## Deferred / Follow-Up Items

1. Legacy non-primary components
   - `LogHandModal.tsx` and `LogHandModalV2.tsx` are retained for compatibility but are no longer primary hand-entry flow.
2. Legacy plan page modernization
   - `StudyPlan.tsx` still uses older visual patterns and should receive a dedicated pass if it returns to the main study loop.
3. E2E browser automation
   - This repository currently has no Playwright dependency configured; added coverage here is unit-focused.
   - Recommend introducing a minimal Playwright setup next if browser-level regression gating is required.

## Completion Notes

This document is updated as the hardening pass proceeds.  
Final state will include fixed vs deferred items with rationale.
