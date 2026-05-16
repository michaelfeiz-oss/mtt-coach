# Population Construction Rules - Missing v1h Drafts

Date: 2026-05-17

These rules are for constructing local MTT Study population-draft seed charts only. They are not GTO truth, not owner-approved, and not trainer-final approval.

## Status Rules

- Constructed charts use `sourceType=population_constructed`.
- Constructed charts keep `reviewed=false`.
- Constructed charts import as `seed` snapshots only.
- Approved charts must not be overwritten or downgraded.
- Missing or unclear spots remain Not yet reviewed.

## Source Policy

- Use public discussion only as qualitative population input.
- Do not copy paid, gated, private, or colour-coded chart content.
- Do not treat forum opinions as direct chart truth.
- Do not use screenshots or colours as action data.
- Every constructed chart must preserve one explicit action token per hand.

## Pool Assumptions

- Live and low/mid MTT pools often under-defend blinds against small opens.
- Early and middle opens are treated as stronger than loose solver baselines.
- Small blind play should avoid low-EV trash aggression out of position.
- Value-heavy aggression is preserved.
- Thin suited bluffing is reduced where the population rule is uncertain.
- Dominated offsuit trash is kept conservative.

## Simplification Rules

- One action per hand cell.
- No frequency splits or mixed cells.
- Tiny-frequency mixes become the dominant practical action.
- `CALL_JAM` must never be normalized to `CALL`.
- `JAM` and `RAISE` are distinct and must not be remapped.
- Missing cells are invalid and must never become `FOLD` automatically.

## Stack Logic

- 15bb: more jam and commitment pressure; fewer speculative flats.
- 25bb: allow jam/3-bet pressure where practical.
- 40bb and 70bb: more call/3-bet/fold structure; avoid unsourced jams.
- 40bb and 70bb facing open-jam spots remain Not yet reviewed unless explicitly sourced.

## Batch A - SB vs CO Facing Late Open

- Structural anchors: existing SB vs BTN and BB vs CO/BTN typed seeds.
- SB vs CO is tighter than SB vs BTN.
- 15bb uses `JAM`, `CALL`, `FOLD`.
- 25bb uses `JAM`, `THREE_BET`, `CALL`, `FOLD`.
- 40bb/70bb use `THREE_BET`, `CALL`, `FOLD`.

## Batch B - SB First In

- Uses limp strategy where practical.
- Does not force pure raise/fold.
- 15bb can include `JAM`, `RAISE`, `LIMP`, `FOLD`.
- 25bb can include shallow `JAM`, but deeper stacks avoid unsourced jams.
- 40bb/70bb use `RAISE`, `LIMP`, `FOLD`.

## Batch C - BB vs SB Limp

- BB has the option to `CHECK` after SB limps.
- Do not use `CALL` in this family.
- Do not use `FOLD` unless a future source/action model explicitly supports it.
- 15bb/25bb may include `JAM`, `RAISE`, `CHECK`.
- 40bb/70bb use `RAISE`, `CHECK`.

## Batch D - 40bb/70bb Facing Jam

- Not constructed in this pass.
- 40bb/70bb open-jams are abnormal and villain-dependent.
- Leave these Not yet reviewed without a verified source.
