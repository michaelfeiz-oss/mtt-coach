# Full Range Truth Audit
**Generated:** 2026-05-11
**Commit:** see git log

---

## Executive Summary

| Metric | Count |
|---|---|
| Total chart nodes (all stacks × all spots) | 162 |
| Seeded in trainer (source-supported) | **159** |
| Excluded (unsupported) | 3 |
| Source-backed (Exact PDF Chart) | 99 |
| Simplified Population | 54 |
| Structured Proxy (BvB) | 6 |

---

## Coverage by Spot Group

| Spot Group | Total Nodes | Seeded | Source-Backed | Simplified Pop | Proxy | Unsupported |
|---|---|---|---|---|---|---|
| RFI | 21 | 21 | 21 | 0 | 0 | 0 |
| VS_UTG_RFI | 21 | 21 | 21 | 0 | 0 | 0 |
| VS_MP_RFI | 15 | 15 | 15 | 0 | 0 | 0 |
| VS_LP_RFI | 15 | 15 | 15 | 0 | 0 | 0 |
| VS_3BET | 84 | 81 | 27 | 54 | 0 | 3 |
| BVB | 6 | 6 | 0 | 0 | 6 | 0 |

---

## Source Status Definitions

| Status | Meaning | UI Label |
|---|---|---|
| `source_backed` | Derived from exact GTO PDF charts at 15/25/40bb | "Exact PDF Chart" |
| `simplified_population` | Practical simplified model for 25/40bb VS_3BET spots — not exact PDF | "Simplified Population" |
| `proxy` | Structured proxy branch for BvB decisions | "Structured Proxy" |
| `unsupported` | No valid source mapping — excluded from trainer and weak spot suggestions | (not shown) |

---

## Unsupported 15bb VS_3BET Exclusions

The following 1 chart nodes are excluded from the seeded active chart set at 15bb VS_3BET because the hero position is not in the source-backed set (UTG, UTG1, MP, HJ, CO, BTN):

| spotKey | heroPosition | villainPosition |
|---|---|---|
| SB_vs_BB_3bet | SB | BB |

---

## Stack Depth Coverage

| Stack | Seeded | Unsupported |
|---|---|---|
| 15bb | 53 | 1 |
| 25bb | 53 | 1 |
| 40bb | 53 | 1 |

---

## Human Review Required

The following chart families require human review before being promoted to `source_backed`:

- **Simplified Population VS_3BET (25bb, 40bb):** 54 nodes — practical simplified model, not exact PDF chart. Displayed with "Simplified Population" label in Range Viewer.
- **BvB Proxy (all stacks):** 6 nodes — structured proxy branch. Displayed with "Structured Proxy" label.

---

## Audit CSV

Full row-level data: `server/strategy/audits/full_range_truth_audit_2026-05-11.csv`

Columns: stackDepth, spotGroup, spotKey, heroPosition, villainPosition, label, sourceStatus, sourceLabel, seededInTrainer, notes
