# Master UI/UX Hardening Report

Date: 2026-05-12  
Branch: `fix/master-range-ui-hardening`

## Scope

This pass focused on two linked goals:

1. tighten source-truth gating so the trainer never teaches from questionable charts
2. redesign the product into a compact, cleaner, more trustworthy study tool

## Pages changed

- Dashboard
- Study
- Strategy Library
- Range Trainer
- Hand Detail
- Hand Log modal
- shared design tokens and chart layout helpers

## Major UX changes

### 1. Compact chart viewer
- merged oversized header/setup sections into one compact panel
- removed filler helper copy
- tightened controls, chips, and matrix spacing
- collapsed notes by default
- disabled train action for blocked charts

### 2. Trainer trust and flow
- trainer now filters to trainer-safe charts only
- blocked direct trainer URLs show an explicit study-only message
- result reveal remains compact and faster to scan
- source/trust badges are visible in the workflow

### 3. Study hub honesty
- drill packs now distinguish trainer-safe coverage from study-only coverage
- weak spots and recommendations no longer point into blocked trainer charts
- labels make source status explicit

### 4. Dashboard cleanup
- tighter layout and cleaner hierarchy
- training queue draws from trainer-safe suggestions only
- reduced decorative surface weight

### 5. Hand logging preservation + compaction
- exact card/suit picker preserved
- optional streets and review/tagging sections collapsed by default
- sticky header/footer behavior tightened
- modal overflow behavior improved on smaller screens

## Notes cleanup

Notes were tightened to:

- shorter defaults
- clearer common mistakes
- cleaner drill cues
- source-status-aware warnings for study-only nodes

Unsupported charts no longer show fake coaching copy.

## Trust-facing UI changes

The UI now differentiates between:

- `Source-backed`
- `Simplified Population - study only`
- `Proxy - study only`
- `Unsupported`

The app favors honest restriction over fake precision.

## Audit-linked results

| Metric | Count |
|---|---:|
| Total charts | 162 |
| Viewer-visible charts | 145 |
| Trainer-allowed charts | 85 |
| Blocked charts | 77 |
| Simplified charts | 54 |
| Proxy charts | 6 |
| Unsupported charts | 17 |

## Infrastructure hardening discovered and fixed during this pass

- repaired fresh migration failure caused by duplicate `hands.spotType` enum values
- repaired Windows-local `pnpm dev` script so local QA can run
- repaired local seed script TS import path so fresh seeded environments work again

## Screenshot QA

Output folder:

- `output/master-hardening/`

Saved captures:

- `dashboard-desktop.png`
- `study-desktop.png`
- `chart-viewer-desktop.png`
- `chart-viewer-desktop-110-zoom.png`
- `chart-viewer-mobile.png`
- `trainer-before-answer-desktop.png`
- `trainer-after-answer-desktop.png`
- `trainer-mobile.png`
- `hand-log-modal-desktop.png`
- `hand-log-modal-mobile.png`
- `blocked-study-only-chart.png`
- `blocked-trainer-url.png`

Spot-check result:

- compact chart viewer holds together on desktop and mobile
- blocked trainer route shows explicit study-only messaging
- trainer reveal stays concise after answer
- hand log modal no longer shows header/content collision in the captured states

## Known limits

- simplified and proxy charts remain intentionally blocked from trainer
- exact 15bb facing-3bet coverage is still incomplete for some nodes and remains blocked until reviewed
- no AI strategy analysis was added in this pass

## Outcome

The app is now smaller, stricter, and cleaner:

- smaller trainer pool
- clearer source labels
- tighter layout
- less vertical waste
- more honest study/train separation
