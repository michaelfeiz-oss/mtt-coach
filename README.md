# MTT Study Local

Local-only MTT preflop study app for strategy charts, review, editing, drills, and backup/export.

The local app is intentionally separate from the Manus app. The Manus app can remain for hand logs and notes. This app is strategy-study only.

## App URLs

- MTT Study app: `http://localhost:3100`
- Orange Painting Quote app remains: `http://localhost:3000`

The Docker container still listens on port `3000` internally, but the local host port is `3100` so it does not conflict with the painting quote app.

## Start and Stop

```bash
docker compose up -d
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

Then open `http://localhost:3100`.

## Data Storage

SQLite data is stored in the Docker volume:

```text
mtt-coach-master-hardening_mtt-study-data
```

Inside the container the database lives at:

```text
/data/mtt-study.sqlite
```

Docker publishes the MTT Study app to `127.0.0.1:3100` by default, so it is reachable only from this computer. The container still listens on port `3000` internally.

Normal restarts keep data:

```bash
docker compose down
docker compose up -d
```

This deletes the local SQLite volume and all local strategy data:

```bash
docker compose down -v
```

Security warning: this app is local-only and admin editing/import/restore is not password-protected yet. Do not expose it to public networks. LAN/iPhone access should be added later behind a simple password.

## Strategy Truth Model

Strategy truth is full 169-cell chart snapshots.

Rules:

- Node identity is `nodeKey`, never an internal database id.
- Approved snapshots are active truth.
- Drafts never affect study mode.
- Old snapshots are immutable.
- Missing hands fail validation.
- Unknown actions fail validation.
- Missing/unseeded spots are shown as `Not yet reviewed`.
- Action colours are display only.

The initial local import migrates the existing reviewed typed seed rows into seed snapshots. Existing v1 `CALL_JAM` rows are preserved as canonical V2 `CALL_JAM`; they are not flattened to `CALL`.

Seed charts are useful baselines, not final truth. Do not approve a chart until you have reviewed it. Missing or unreviewed charts must stay labelled as `Not yet reviewed`; do not fill or approve them by guessing.

## Routes

- `/` dashboard
- `/strategy/library` chart library
- `/strategy/chart/:nodeKey` chart viewer
- `/strategy/editor/:nodeKey` chart editor
- `/strategy/trainer` basic drill mode
- `/admin/import-export` import/export/backup
- `/admin/audit` local data audit

## Daily Workflow

1. Start the app with `docker compose up -d`.
2. Open `http://localhost:3100`.
3. Open `/strategy/library`.
4. Choose a chart and review it in the chart viewer.
5. Open the chart editor from the viewer when you want to make changes.
6. Save Draft while working. Drafts do not affect study mode.
7. Re-open the chart viewer or trainer to confirm the draft has not changed the active study chart.
8. Approve Chart only after review.
9. Once approved, the approved snapshot becomes the active strategy truth.

## Backup Workflow

From the UI:

- Go to `/admin/import-export`.
- Use `Export Full Backup` before serious editing.
- Use `Export Approved Pack` after approving charts you want to preserve as portable strategy truth.
- Save backups outside the repo, for example in `Documents\MTT Study Backups`.
- Use date-stamped names such as `mtt-study-full-backup-2026-05-16.json` and `mtt-study-approved-pack-2026-05-16.json`.

Command-line examples after the app is running:

```bash
curl http://localhost:3100/api/local/export/approved -o approved-strategy-pack.json
curl http://localhost:3100/api/local/backup -o mtt-study-full-backup.json
curl -X POST http://localhost:3100/api/local/import/approved -H "Content-Type: application/json" --data-binary @approved-strategy-pack.json
curl -X POST http://localhost:3100/api/local/restore -H "Content-Type: application/json" --data-binary @mtt-study-full-backup.json
```

## Restore Workflow

Export a full backup first if you care about the current data. To prove restore works or intentionally reset the local DB:

```bash
docker compose down -v
docker compose up -d
```

Then:

1. Open `http://localhost:3100`.
2. Go to `/admin/import-export`.
3. Paste the full backup JSON into the restore box.
4. Restore the full backup.
5. Open `/admin/audit` and confirm chart counts return.
6. Open a previously approved chart and confirm it is still approved and active.

## Safety Warnings

- This app is local-only.
- Admin actions are not password-protected yet.
- Do not expose the app publicly.
- Do not approve charts without review.
- Seed charts are not final truth.
- Missing or unreviewed charts must remain `Not yet reviewed`.
- `docker compose down -v` deletes local strategy data.

## Testing Checklist

Before a serious editing session, spot-check:

- Chart viewer loads a 169-cell grid.
- Editor saves a draft.
- Draft does not affect study mode.
- Approve Chart works.
- Approved chart becomes active truth.
- Trainer loads and uses the chart's allowed actions.
- Export Full Backup works.
- Restore Full Backup works.

## Local Development

```bash
pnpm install
pnpm dev
```

Required checks:

```bash
pnpm check
pnpm test
pnpm strategy:validate
pnpm build
```

## Current Limitations

- Local-only app.
- Admin mode is local-only and not password-protected yet.
- Trainer stats are session-only in the browser.
- No offline PWA behaviour yet.
- Only the current clean typed seed set is loaded. No v1h or inferred ranges are created.
- Unreviewed charts remain seed/not final until you approve them.
