# MTT Study Local

Local-only MTT preflop study app for strategy charts, review, editing, drills, and backup/export.

The local app is intentionally separate from the Manus app. The Manus app can remain for hand logs and notes. This app is strategy-study only.

## Start

```bash
docker compose up -d
```

Open:

```text
http://localhost:3100
```

`http://localhost:3000` is intentionally left free for the Orange Painting quoting app.

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

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

Security warning: do not expose this app to public networks. Admin editing/import/restore is not password-protected yet. LAN/iPhone access should be added later behind a simple password.

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

## Routes

- `/` dashboard
- `/strategy/library` chart library
- `/strategy/chart/:nodeKey` chart viewer
- `/strategy/editor/:nodeKey` chart editor
- `/strategy/trainer` basic drill mode
- `/admin/import-export` import/export/backup
- `/admin/audit` local data audit

## Backup and Export

From the UI:

- Go to `/admin/import-export`.
- Use `Export Approved Pack` for approved active strategy truth.
- Use `Export Full Backup` for all local data, including snapshots, drafts, and audit logs.
- Paste JSON into the restore box to import an approved pack or restore a full backup.

Command-line examples after the app is running:

```bash
curl http://localhost:3100/api/local/export/approved -o approved-strategy-pack.json
curl http://localhost:3100/api/local/backup -o mtt-study-full-backup.json
curl -X POST http://localhost:3100/api/local/import/approved -H "Content-Type: application/json" --data-binary @approved-strategy-pack.json
curl -X POST http://localhost:3100/api/local/restore -H "Content-Type: application/json" --data-binary @mtt-study-full-backup.json
```

## Intentional Reset

This deletes the local SQLite volume. Export a full backup first if you care about the data.

```bash
docker compose down -v
docker compose up -d
```

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

- Admin mode is local-only and not password-protected yet.
- Trainer stats are session-only in the browser.
- PWA manifest is present, but offline caching is intentionally minimal.
- Only existing clean typed seed data is imported. No v1h or inferred ranges are created.
