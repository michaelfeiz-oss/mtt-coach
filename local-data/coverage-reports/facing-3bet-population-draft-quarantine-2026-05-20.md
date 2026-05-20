# Facing 3-Bet Population Draft Quarantine - 2026-05-20

## Outcome

The generated facing-3bet population-draft pack from commit `f8db934` was audited and retracted.

The issue was not a rendering bug or missing-cell bug. The pack contained full 169-cell charts, but the strategy construction was too formulaic and produced suspicious ranges.

## Evidence

Example: `facing_3bet_25bb_utg_vs_hj_bba`

Action counts:

- `FOUR_BET`: 4
- `JAM`: 8
- `FOLD`: 157

Flagged cells:

- `QQ = FOLD`
- `99 = JAM`
- `TT = JAM`
- `JJ = JAM`
- `AJs/ATs = JAM`

This is not a trustworthy population-draft response range. It came from a blunt tiered heuristic, not a verified source pack.

## Corrective Action

- Restored the local DB from `local-data/backups/mtt-study-backup-before-facing-3bet-population-drafts-2026-05-20.json`.
- Restored counts:
  - Charts: 100
  - Snapshots: 290
  - Study notes: 3
  - Population drafts: 12
  - Facing-3bet population drafts: 0
- Removed the generated facing-3bet pack and generator from the repo.
- Kept `facing_3bet` as a supported spot type in the model/UI so future verified source packs can be imported cleanly.

## Policy

Facing-3bet charts should remain `Not yet reviewed` until a verified source pack is provided or the owner explicitly reviews full 169-cell ranges.

Do not construct facing-3bet charts from memory or broad heuristic tiers.
Do not approve or drill facing-3bet charts until source-backed data exists.
