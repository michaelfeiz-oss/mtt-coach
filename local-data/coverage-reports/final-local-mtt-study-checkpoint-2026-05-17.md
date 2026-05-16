# Final Local MTT Study Checkpoint - 2026-05-17

## Repo State

- Branch: `codex/local-mtt-study-app`
- Code commit checked: `545dedecb7895764c1282d4e68b07508bb3bc3b3`
- App URL: `http://localhost:3100`
- Health endpoint: `http://localhost:3100/api/local/health`
- Health result: pass, `ok=true`, database path `/data/mtt-study.sqlite`

## Live Chart Counts

Current `/api/local/audit` counts after Docker rebuild:

| Metric | Count |
|---|---:|
| Charts | 100 |
| Seed | 93 |
| Draft | 0 |
| Reviewed | 0 |
| Approved | 7 |
| Snapshots | 197 |
| Draft records | 1 |
| Population drafts requiring review | 12 |

Population-draft charts remain seed-status placeholders with `sourceType=population_constructed`; they are not approved.

## Trainer Source Filter

- Default trainer chart source: `Typed seed`
- Default behavior: population-draft charts are excluded.
- Verified population-draft-only node `facing_open_late_15bb_sb_vs_co_bba` returns no trainer question with the default source filter.
- Verified the same node can be drilled only when using `chartSource=include_population`.

## Manual Browser QA

Routes checked in the local browser:

- `/strategy/library?status=population_draft`
- `/strategy/chart/facing_open_late_15bb_sb_vs_co_bba`
- `/strategy/chart/sb_first_in_15bb_bba`
- `/strategy/chart/bb_vs_sb_limp_15bb_bba`
- `/strategy/trainer`
- `/admin/audit`

Manual results:

- Population-draft charts are clearly labelled with `Population draft` and `Review before approval`.
- SB vs CO chart opened: `facing_open_late_15bb_sb_vs_co_bba`.
- SB first-in chart opened: `sb_first_in_15bb_bba`.
- BB vs SB limp chart opened: `bb_vs_sb_limp_15bb_bba`.
- Each checked chart's `Edit Chart` link opens the matching `/strategy/editor/:nodeKey` route.
- Trainer default source filter excludes population drafts.
- Trainer `Include population drafts` source filter serves population-draft charts.
- Audit page shows `Population drafts requiring review` with 12 entries.
- Browser console: no app-caused runtime errors observed.

## Backup

Full backup exported after Docker rebuild:

`local-data/backups/mtt-study-backup-final-local-mtt-study-checkpoint-2026-05-17.json`

Backup contents:

| Backup section | Count |
|---|---:|
| Charts | 100 |
| Snapshots | 197 |
| Drafts | 1 |
| Audit logs | 199 |
| Study notes | 3 |

## Validation Results

Commands run:

- `pnpm check` - pass
- `pnpm test` - pass, 31 test files passed, 189 tests passed, 38 skipped
- `pnpm strategy:validate` - pass, 158 typed rows, 88 nodes, 88 compiled charts
- `pnpm strategy:validate-source-templates` - pass, 24 template/population-draft charts checked in 6 files
- `pnpm build` - pass
- `git diff --check` - pass
- `docker compose down` - pass
- `docker compose up -d --build` - pass
- `http://localhost:3100/api/local/health` - pass

Build note: Vite still reports the existing large chunk warning; build completes successfully.

## Remaining Limitations

- Population-draft charts are practical placeholders only; they need owner review before approval.
- Population-draft charts are excluded from trainer defaults and require explicit opt-in.
- 40bb/70bb facing-jam spots remain intentionally unreviewed unless a reliable source is provided.
- Current local app remains local-only; do not expose it publicly without auth.
- Seed charts are not final truth unless reviewed/approved by the owner.

## Safety Confirmation

- No new ranges were imported.
- No population-draft ranges were edited.
- No charts were approved during this checkpoint.
- No strategy data/schema/trainer logic changes were made.
