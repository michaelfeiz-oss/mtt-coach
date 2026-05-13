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
- Exact imported charts must be structurally complete 169-cell matrices
- Automated integrity provenance is exposed separately from owner review
- Imported chart candidates are no longer treated as trainer-safe truth by default
- Range Trainer should now block these imported candidates instead of serving bad actions
- Audit, validation, golden, and DB compare scripts are wired for follow-up validation

## Known catalog issues already confirmed locally

These are intentionally left as imported candidates pending reseed and owner/source review:

- `25bb BTN_vs_MP`: `T3s = THREE_BET`
- `25bb CO_vs_UTG`: `AJo = FOLD`
- `25bb UTG_RFI`: `K2s/Q2s/J2s/T2s = RAISE`
- `15bb CO_vs_MP`: imported chart shape still needs DB reseed + deployed UI inspection against the source PDF

These values are not being declared poker-correct in this branch. The point of this pass is to stop them from masquerading as trainer-safe.

## Migration and reseed

- Migration file: `drizzle/0009_strategy_chart_review_metadata.sql`

After `DATABASE_URL` exists in the deployment shell:

```bash
pnpm db:push
node server/strategy/seedStrategy.mjs
pnpm exec tsx server/strategy/compareSeedToDb.ts --fail-on-mismatch
pnpm exec tsx server/strategy/auditStrategyCells.ts AJo --db
pnpm exec tsx server/strategy/auditStrategyCells.ts AJo --db --stack 25 --spot CO_vs_UTG
pnpm exec tsx server/strategy/auditStrategyCells.ts T3s --db --stack 25 --spot BTN_vs_MP
pnpm exec tsx server/strategy/auditStrategyCells.ts K2s,Q2s,J2s,T2s --db --stack 25 --spot UTG_RFI
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

Minimum review spots in the deployed app:

- `25bb CO_vs_UTG AJo`
- `25bb HJ_vs_UTG AJo`
- `25bb BTN_vs_UTG AJo`
- `25bb BTN_vs_MP T3s`
- `25bb UTG_RFI K2s/Q2s/J2s/T2s`
- `15bb CO_vs_MP`
- every AJo row returned by `pnpm strategy:audit AJo`

## What Manus should verify in the deployed app

- AJo displays the current catalog action consistently after reseed
- `T3s` does not appear as a trainer-served action spot if the imported candidate remains blocked
- Missing cells do not display as `Fold`
- Trainer is honest about blocked imported candidates instead of teaching them as approved charts
- Chart Viewer / source labels show imported candidate / pending owner review provenance, not human approval

## Expected trainer behavior on this branch

Until owner/source review promotes exact charts back into trainer-safe status:

- structurally complete imported candidates remain visible for study and audit
- trainer should not teach those imported candidates as approved preflop truth
- the app should prefer an honest blocked/unavailable review state over serving bad answers

## Known pending items

- DB migration, reseed, and compare are still pending because `DATABASE_URL` was not available in the Codex shell
- `docs/strategy-audits/ajo-review.md` is still a pending owner-review checklist, not final poker approval
- Manus should capture the deployed audit output for `AJo`, `T3s`, and `UTG_RFI` weak suited trash before any trainer re-enablement
- Final chart approval only happens after:
  - DB compare passes
  - AJo DB audit passes
  - T3s / UTG_RFI DB audits pass
  - deployed `/strategy/library` is checked
  - deployed `/strategy/trainer` is checked
  - owner confirms or corrects the AJo action and other flagged boundary hands


