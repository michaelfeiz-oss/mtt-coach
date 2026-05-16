# Population Draft Risk Review - 2026-05-17

These charts are population-draft seed placeholders. They are not owner-approved and should not be drilled by default.

## Explicit Review Flags

| Spot | Flag | Reason |
|---|---|---|
| `sb_first_in_40bb_bba` | `22`, `33`, `44` = `FOLD` | Conservative draft may be too tight for SB first-in at 40bb. Owner should review small-pair treatment. |
| `sb_first_in_70bb_bba` | `22`, `33` = `FOLD`; `44+` = `RAISE` | Conservative threshold needs owner review; small-pair limping/raising may be preferable. |
| `facing_open_late_15bb_sb_vs_co_bba` | Jam-heavy shallow SB vs CO construction | 15bb draft uses `JAM:34`, `CALL:3`, `FOLD:132`; verify this is not too shove-heavy for desired low-variance population style. |

## A9s / K9s Discontinuities

| Spot | A9s | K9s | Review note |
|---|---|---|---|
| `facing_open_late_15bb_sb_vs_co_bba` | `JAM` | `FOLD` | Ace blocker pressure is intentionally prioritized; owner should confirm K9s remains fold. |
| `facing_open_late_25bb_sb_vs_co_bba` | `JAM` | `FOLD` | Same blocker-driven gap; review for practical consistency. |
| `facing_open_late_40bb_sb_vs_co_bba` | `CALL` | `FOLD` | K9s was kept tighter than A9s out of position. Review this border. |
| `bb_vs_sb_limp_40bb_bba` | `RAISE` | `CHECK` | Limp-punish draft favors ace blocker. Review whether K9s should raise/check. |

## Premium Hand Check

No constructed chart leaves `AA`, `KK`, or `QQ` on a passive default action:

- Batch A: premiums are `JAM` at 15bb, `THREE_BET` at 25/40/70bb.
- Batch B: premiums are `RAISE`.
- Batch C: premiums are `JAM` at 15/25bb and `RAISE` at 40/70bb.

## BB vs SB Limp Action Semantics

No `bb_vs_sb_limp_*` population-draft chart uses `CALL`.

- Passive/default action is `CHECK`.
- Aggressive actions are `RAISE` and, at 15/25bb only, `JAM`.

## Safety Decision

Population-draft charts should remain visible in Library and Audit, but excluded from Trainer by default. Use the Trainer chart-source filter `Include population drafts` only when intentionally reviewing these drafts.
