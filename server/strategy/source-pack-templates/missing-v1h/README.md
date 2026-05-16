# Missing v1h Source Pack Templates

These files are blank source-pack templates only. They are not active seed data and are not referenced by the seed manifest.

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

Blank templates are expected to fail validation. The validator reports:

- blank action cells
- missing hand keys
- extra hand keys
- invalid action tokens
- actions outside `allowedActions`
- blank source metadata

A template should not be promoted into active seed data until this command passes.

## Import Policy

These templates are not importable as-is. Promotion into active seed data requires a separate reviewed import step:

1. Fill every cell from a verified source.
2. Add source/provenance notes.
3. Run `pnpm strategy:validate-source-templates`.
4. Convert or promote the completed source pack into the active typed seed workflow.
5. Run the normal strategy validation/test/build suite.

Missing charts are better than fake charts.
