# Population Range Research - 2026-05-17

Purpose: document qualitative source checks before constructing missing local MTT Study population-draft ranges.

No paid, gated, private, or colour-extracted chart data was copied. The sources below were used only to support broad population assumptions and spot design caution. They are not direct 169-cell chart sources.

## Source URLs Checked

- 2+2 No Limit Tournaments forum: https://forumserver.twoplustwo.com/23/no-limit-tournaments/
- 2+2 "Dividing Line for when to go to Open Shove Only": https://forumserver.twoplustwo.com/23/no-limit-tournaments/dividing-line-when-go-open-shove-only-1829938/
- 2+2 "General Rule for Open Shoving Stack?": https://forumserver.twoplustwo.com/23/no-limit-tournaments/general-rule-open-shoving-stack-492841/
- 2+2 "Why do people open limp": https://forumserver.twoplustwo.com/23/no-limit-tournaments/why-do-people-open-limp-1736447/
- 2+2 "Opening theory": https://forumserver.twoplustwo.com/23/no-limit-tournaments/opening-theory-1801207-new/
- PokerTube public limping overview: https://www.pokertube.com/article/what-is-limping-in-poker
- Cardplayer Lifestyle public limping overview: https://cardplayerlifestyle.com/poker-tips-strategy/limping-in-poker/

## Source Use Classification

| Source | Type | Used As | Full 169-cell data? | Risk |
|---|---|---|---:|---|
| 2+2 No Limit Tournaments forum | Public discussion | Population-read only | No | Opinion-heavy; not direct chart truth |
| 2+2 open-shove threads | Public discussion | Stack-depth caution and shallow jam heuristics | No | Player-pool and era dependent |
| 2+2 open-limp/opening theory threads | Public discussion | Limp strategy caution and short-stack simplification | No | Not specific enough for cell truth |
| Public limping articles | Public article | Basic action semantics for limp/check contexts | No | Generic, not MTT chart source |
| Existing local typed seeds | User-local app data | Structural anchor only | Yes for existing nodes | Existing seeds are not final owner approval |

## Family Findings

### Batch A - SB vs CO Facing Late Open

- Reliable enough for population-draft construction: yes, as a conservative draft.
- Direct chart source: no.
- Anchor: existing SB vs BTN is wider; SB vs CO should be tighter. Existing BB vs CO/BTN provides late-open defence shape.
- Population assumption: out-of-position SB should keep dominated offsuit hands conservative and prefer value-heavy aggression.
- Risk: exact 3-bet/call border hands require owner review.

### Batch B - SB First In

- Reliable enough for population-draft construction: yes, as a draft with clear warning.
- Direct chart source: no.
- Key takeaway: blind-vs-blind and short/mid-stack tournament play can include limping; forcing raise/fold would be too brittle.
- Population assumption: use limp for many playable but lower-EV hands, raise stronger linear/value hands, and jam only at shallower stacks.
- Risk: SB first-in is complex and pool-sensitive; owner review is mandatory.

### Batch C - BB vs SB Limp

- Reliable enough for population-draft construction: yes, as a draft.
- Direct chart source: no.
- Key action semantics: BB can check after SB completes; using CALL would be the wrong action token for this family.
- Population assumption: raise value and pressure hands, check the rest; shallow stacks can jam punish some limp ranges.
- Risk: exact punish range depends heavily on villain limp/fold and limp/trap tendencies.

### Batch D - 40bb/70bb Facing Jam

- Reliable enough for construction: no.
- Decision: do not construct or import.
- Reason: deep open-jams are abnormal and villain-dependent.
- Status: leave Not yet reviewed unless a verified source pack is provided.

## Construction Permission

Batches A, B, and C may be constructed as `population_constructed` seed drafts only. They must not be marked reviewed or approved. Batch D remains missing.
