# Facing 3-Bet Population Draft Import - 2026-05-20

## Scope

Added missing facing-3bet chart coverage as population-draft seed data only.

- Source type: `population_constructed`
- Source name: `population_rulebook_plus_existing_seed_structure`
- Status: seed / population draft
- Owner-approved: no
- Reviewed: no
- Browser-scraped data: no
- Paid/gated chart copying: no
- Colour-as-data: no

## Backups

- Before import: `local-data/backups/mtt-study-backup-before-facing-3bet-population-drafts-2026-05-20.json`
- After import: `local-data/backups/mtt-study-backup-after-facing-3bet-population-drafts-2026-05-20.json`

Current Docker volume backup contents after import:

- Charts: 160
- Snapshots: 350
- Drafts: 1
- Audit logs: 0
- Notes: 0

## Charts Added

Generated and imported 60 facing-3bet population-draft charts:

- Stacks: 15bb, 25bb, 40bb, 70bb
- Matchups: UTG vs HJ/CO/BTN/SB/BB, HJ vs CO/BTN/SB/BB, CO vs BTN/SB/BB, BTN vs SB/BB, SB vs BB
- Node key format: `facing_3bet_{stack}bb_{hero}_vs_{villain}_bba`

Examples:

- `facing_3bet_25bb_hj_vs_btn_bba`
- `facing_3bet_70bb_btn_vs_bb_bba`

## Action Sets

- 15bb: `JAM`, `FOLD`
- 25bb: `FOUR_BET`, `JAM`, `CALL`, `FOLD`
- 40bb/70bb: `FOUR_BET`, `CALL`, `FOLD`

## Validation

Passed:

- `pnpm check`
- `pnpm test`
- `pnpm strategy:validate`
- `pnpm strategy:validate-source-templates`
- `pnpm build`
- `git diff --check`
- Docker rebuild and health check on `http://localhost:3100`

Import result:

- Imported: 60
- Skipped: 0
- Total charts after import: 160
- Population drafts after import: 72
- Facing-3bet population drafts: 60

## UI QA

Checked:

- `/strategy/library?spot=facing_3bet&status=population_draft&chart=facing_3bet_25bb_hj_vs_btn_bba`
- `/strategy/library?spot=facing_3bet&status=population_draft&chart=facing_3bet_70bb_btn_vs_bb_bba`
- `/strategy/trainer`
- `/admin/audit`

Observed:

- `Facing 3-bet` appears in Range Browser spot filters.
- Facing-3bet charts display `Population draft` and `Review before approval` labels.
- Action legends render the expected action tokens.
- Edit Chart links are present for selected charts.
- Trainer API can drill facing-3bet population drafts only when `chartSource=include_population` is selected.
- Browser console showed no app-caused runtime errors during the checked routes.

## Safety Notes

These charts are practical population-draft scaffolds. They are not final poker truth, not GTO charts, and not owner-approved. They should remain visibly labelled and excluded from default trainer filters until reviewed.
