# Missing v1h Source Pack Templates

These files started as source-pack templates. The `*.population-draft.json` files are completed population-draft packs generated from `population-construction-rules.md`; they are not approved truth.

The matching `*.template.json` files are kept import-compatible so the validator can inspect the same full 169-cell maps. They still keep `reviewed=false`.

## Scope

Batch A - SB vs CO facing late open:

- `facing_open_late_15bb_sb_vs_co_bba`
- `facing_open_late_25bb_sb_vs_co_bba`
- `facing_open_late_40bb_sb_vs_co_bba`
- `facing_open_late_70bb_sb_vs_co_bba`

Batch B - SB first in:

- `sb_first_in_15bb_bba`
- `sb_first_in_25bb_bba`
- `sb_first_in_40bb_bba`
- `sb_first_in_70bb_bba`

Batch C - BB vs SB limp:

- `bb_vs_sb_limp_15bb_bba`
- `bb_vs_sb_limp_25bb_bba`
- `bb_vs_sb_limp_40bb_bba`
- `bb_vs_sb_limp_70bb_bba`

Batch D 40bb/70bb facing jam is intentionally not included. Those spots remain Not yet reviewed unless a verified source is provided.

## How To Fill A Template

Each chart has:

- `nodeKey`
- `stackBb`
- `spotFamily`
- `heroPosition`
- `villainPosition`
- `allowedActions`
- `sourceName`
- `sourceType`
- `sourceNotes`
- `reviewed`
- `cells`

Fill every hand in `cells` with an action token from that chart's `allowedActions`.

Do not leave blanks.
Do not treat blanks as Fold.
Do not copy from screenshots, colours, browser tools, old proxy data, or gated sources.
Do not mark `reviewed` true until the source has been checked by the owner.

If the source uses an action that is missing from `allowedActions`, update `allowedActions` explicitly and make sure the action is a canonical token:

- `FOLD`
- `RAISE`
- `JAM`
- `LIMP`
- `CALL`
- `CALL_JAM`
- `CHECK`
- `THREE_BET`
- `FOUR_BET`
- `BET_SMALL`
- `BET_BIG`

## Validate Templates

Run:

```bash
pnpm strategy:validate-source-templates
```

The validator reports:

- blank action cells
- missing hand keys
- extra hand keys
- invalid action tokens
- actions outside `allowedActions`
- blank source metadata

A source template or population-draft pack should not be promoted into active seed data until this command passes.

## Import Policy

Blank templates are not importable. Completed population-draft packs may be imported only as seed/population-draft data:

1. Fill every cell from a verified source, or document the population-construction rulebook used for a draft.
2. Add source/provenance notes.
3. Run `pnpm strategy:validate-source-templates`.
4. Import as seed only, not reviewed or approved.
5. Run the normal strategy validation/test/build suite.

Population-draft imports must display "Population draft - review before approval" in the app and must not overwrite approved charts.

Missing charts are better than fake charts.
