# Trainer Eligibility Audit

Date: 2026-05-12  
Branch: `fix/master-range-ui-hardening`

## Audit objective

Verify that the same trainer gate applies everywhere:

- Range Trainer
- direct trainer URL access
- drill packs
- weak spot aggregation
- dashboard training queue
- study suggestions

Hard rule:

> A chart is trainer-allowed only if it is `source_backed` or manually approved.

## Audit outputs

- `scripts/auditFullChartInventory.ts`
- `scripts/auditChartCells.ts`

Generated artifacts:

- `server/strategy/audits/full_chart_inventory_2026-05-12.csv`
- `server/strategy/audits/chart_cell_audit_2026-05-12.csv`

## Inventory pass/fail rules

Inventory rows fail when:

- `sourceStatus` is missing
- a `source_backed` chart is missing source file/reference evidence
- `trainerAllowed=true` without source backing or manual approval
- a simplified chart appears in trainer without manual approval
- a proxy chart appears in trainer without manual approval
- an unsupported chart appears in trainer
- a drill pack includes blocked charts as actionable trainer spots
- weak spot suggestions return blocked charts

Current result:

- `0` failed inventory rows

## Current eligibility counts

| Metric | Count |
|---|---:|
| Total charts | 162 |
| Viewer-visible charts | 145 |
| Trainer-allowed charts | 85 |
| Blocked charts | 77 |
| Manual approvals | 0 |

## Audited suspicious examples

### 1. `BB vs UTG @ 15bb`
- Status: exact/source-backed
- Trainer: allowed

### 2. `UTG+1 vs BB 3-Bet @ 25bb`
- Status: `simplified_population`
- Trainer: blocked

### 3. `SB vs UTG @ 15bb`
- Status: exact/source-backed in the current seed/import set
- Trainer: allowed

### 4. `25bb/40bb vs 3-bet charts`
- Status: `simplified_population`
- Trainer: blocked by default

### 5. `BvB proxy branches`
- Status: `proxy`
- Trainer: blocked by default

## Notes confidence rules

Notes are now source-status-aware:

| Notes confidence | Meaning |
|---|---|
| `exact` | Safe to teach as exact chart-backed guidance |
| `simplified` | Shared study guidance only |
| `heuristic` | Non-exact practical guidance |
| `needs_review` | Do not treat as training truth |

## Cell audit scope

The cell audit focuses on high-risk hands across:

- all pairs
- suited and offsuit Ax
- key broadways
- suited connectors
- threshold defend/jam regions

Stacks audited:

- 15bb
- 25bb
- 40bb

## Cell audit result

| Result | Count |
|---|---:|
| `matchYesNo=yes` | 5278 |
| `matchYesNo=no` | 0 |
| `matchYesNo=n_a` | 3132 |

Interpretation:

- No trainer-allowed exact-source cell mismatches remain.
- `n_a` rows are study-only, blocked, or not eligible for exact source comparison in the current gate.

## What changed in the gate

This pass unified trainer eligibility across:

- `shared/sourceTruth.ts`
- `server/strategy/service.ts`
- `server/coachingLoop.ts`
- `shared/drillPacks.ts`
- strategy presentation/trainer UI

No downstream UI path is allowed to quietly override the trainer gate.

## Human review still needed

Charts still needing human review are:

- unsupported 15bb facing-3bet gaps
- simplified 25bb/40bb facing-3bet family charts
- proxy `BVB` branches

Those nodes may remain visible for study, but they are intentionally not quiz-safe.
