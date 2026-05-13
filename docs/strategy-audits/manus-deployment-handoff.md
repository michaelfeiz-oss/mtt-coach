# Manus deployment handoff

- Branch: `codex/strategy-integrity-closeout`
- Commit: use `git rev-parse HEAD` on `codex/strategy-integrity-closeout` at deploy time
- Scope: deployment-ready strategy integrity hardening for review, not final chart-action approval

## What passed locally

Run in `C:\Users\Info\OneDrive\Documents\New project\mtt-coach-master-hardening`:

```bash
pnpm check
pnpm test
pnpm strategy:validate
pnpm strategy:golden
pnpm build
git diff --check
```

## Included integrity changes

- Missing chart cells no longer silently render as `Fold`
- Review-deployment charts must be structurally complete 169-cell matrices
- Automated integrity provenance is exposed separately from owner review
- Source-backed review-deployment charts stay usable for Manus review
- Audit, validation, golden, and DB compare scripts are wired for follow-up validation

## Migration and reseed

- Migration file: `drizzle/0009_strategy_chart_review_metadata.sql`

After `DATABASE_URL` exists in the deployment shell:

```bash
pnpm db:push
node server/strategy/seedStrategy.mjs
pnpm exec tsx server/strategy/compareSeedToDb.ts --fail-on-mismatch
pnpm exec tsx server/strategy/auditStrategyCells.ts AJo --db
pnpm exec tsx server/strategy/auditStrategyCells.ts AJo --db --stack 25 --spot CO_vs_UTG
```

## Audit scripts to keep available

```bash
pnpm strategy:audit
pnpm strategy:validate
pnpm strategy:golden
pnpm strategy:compare-db
```

## Frontend URLs to verify after reseed

- `/strategy/library`
- `/strategy/trainer`

Minimum review spots:

- `25bb CO_vs_UTG AJo`
- `25bb HJ_vs_UTG AJo`
- `25bb BTN_vs_UTG AJo`
- every AJo row returned by `pnpm strategy:audit AJo`

## What Manus should verify in the deployed app

- AJo displays the current catalog action consistently after reseed
- Missing cells do not display as `Fold`
- Trainer only serves structurally complete automated-integrity charts in this review deployment
- Provenance labels show the chart is pending owner review, not human-approved

## Known pending items

- DB migration, reseed, and compare are still pending because `DATABASE_URL` was not available in the Codex shell
- `docs/strategy-audits/ajo-review.md` is still a pending owner-review checklist, not final poker approval
- Final chart approval only happens after:
  - DB compare passes
  - AJo DB audit passes
  - deployed `/strategy/library` is checked
  - deployed `/strategy/trainer` is checked
  - owner confirms or corrects the AJo action


