# Full DB Audit Findings — MTT Coach Strategy Charts
Generated: 2026-05-13

---

## 1. Database Summary

| Metric | Value |
|---|---|
| Total charts in DB | 217 |
| Total cells (rangeChartActions rows) | 36,508 |
| Charts with cells | 217 (100%) |
| Charts with exactly 169 cells | 216 |
| Charts with != 169 cells | 1 (TEST_BTN_RFI — test fixture, 4 cells) |
| Empty charts (0 cells) | 0 |
| Duplicate spotKey+stackDepth combos | 0 |

---

## 2. Source Status Breakdown

| sourceStatus | Count | Notes |
|---|---|---|
| `source_backed` | 85 | Reviewed against PDF source — these are the "good" charts |
| `simplified_population` | 54 | Facing-3bet charts — generated as simplified approximations |
| `proxy` | 6 | BvB limp charts — proxy/derived data |
| `null` (no status) | 72 | 15bb facing-3bet spots + ALL 20bb charts + 2 SB_vs_BB_3bet + TEST chart |

---

## 3. Stack Depth Distribution

| Stack | Charts |
|---|---|
| 15bb | 54 |
| 20bb | 54 |
| 25bb | 55 (includes TEST_BTN_RFI) |
| 40bb | 54 |

**Critical finding: 20bb charts exist in the DB (54 charts) but are NOT in the source PDFs.**
The source PDFs only cover 15bb, 25bb, and 40bb. The 20bb charts have `sourceStatus = null` — they were generated/interpolated without a PDF source.

---

## 4. Source-Backed Charts (85 total — these are the only verified charts)

### 15bb — 37 source-backed charts
**RFI:** UTG, UTG+1, MP, HJ, CO, BTN, SB (7 charts)
**Facing UTG RFI:** UTG+1, MP, HJ, CO, BTN, SB, BB (7 charts)
**Facing MP RFI:** HJ, CO, BTN, SB, BB (5 charts)
**Facing LP RFI:** BB vs CO, BB vs BTN, BTN vs CO, SB vs CO, SB vs BTN (5 charts)
**Facing 3-bet (source-backed subset):** BTN vs BB, CO vs SB, CO vs BB, HJ vs BB, MP vs BB, UTG vs SB, UTG vs UTG+1, UTG vs BTN, UTG vs BB, UTG+1 vs BB, UTG+1 vs MP, UTG+1 vs BTN, UTG+1 vs SB (13 charts)

### 25bb — 24 source-backed charts
**RFI:** UTG, UTG+1, MP, HJ, CO, BTN, SB (7 charts)
**Facing UTG RFI:** UTG+1, MP, HJ, CO, BTN, SB, BB (7 charts)
**Facing MP RFI:** HJ, CO, BTN, SB, BB (5 charts)
**Facing LP RFI:** BB vs CO, BB vs BTN, BTN vs CO, SB vs CO, SB vs BTN (5 charts)

### 40bb — 24 source-backed charts (same spot coverage as 25bb)
**RFI:** UTG, UTG+1, MP, HJ, CO, BTN, SB (7 charts)
**Facing UTG RFI:** UTG+1, MP, HJ, CO, BTN, SB, BB (7 charts)
**Facing MP RFI:** HJ, CO, BTN, SB, BB (5 charts)
**Facing LP RFI:** BB vs CO, BB vs BTN, BTN vs CO, SB vs CO, SB vs BTN (5 charts)

---

## 5. Non-Source-Backed Charts (132 total)

### 20bb — 54 charts (all null sourceStatus)
These are NOT in any source PDF. They appear to be interpolated from 15bb and 25bb data.
**Status: Unverified. Cannot be confirmed against any source.**

### 15bb Facing-3bet charts with null status (14 charts)
These 15bb facing-3bet spots were NOT included in the source-backed pass:
- BTN vs SB 3-Bet, CO vs BTN 3-Bet, HJ vs CO 3-Bet, HJ vs BTN 3-Bet, HJ vs SB 3-Bet
- MP vs CO 3-Bet, MP vs HJ 3-Bet, MP vs BTN 3-Bet, MP vs SB 3-Bet, SB vs BB 3-Bet
- UTG vs MP 3-Bet, UTG vs CO 3-Bet, UTG vs HJ 3-Bet, UTG+1 vs HJ 3-Bet, UTG+1 vs CO 3-Bet

### 25bb/40bb Facing-3bet charts (54 charts — simplified_population)
All VS_3BET charts at 25bb and 40bb are `simplified_population`.
These are approximations, not PDF-sourced.

### Proxy charts (6 charts)
BB vs SB limp and SB vs BB limp at 15bb, 25bb, 40bb — derived/proxy data.

### SB vs BB 3-Bet @ 25bb and @ 40bb (2 charts — null status)
These two charts have no sourceStatus at all.

### TEST_BTN_RFI @ 25bb (1 chart — null status, 4 cells)
Test fixture. Not a real chart.

---

## 6. K2s Cell Audit (Wheel-Suited Verification)

K2s action in UTG RFI charts:
- UTG_RFI @ 15bb: **RAISE** ✓ (confirmed by PDF)
- UTG_RFI @ 25bb: **RAISE** ✓ (confirmed by PDF)
- UTG_RFI @ 40bb: **RAISE** ✓ (confirmed by PDF)

K2s action in other RFI charts:
- MP_RFI @ 15bb: RAISE ✓
- CO_RFI @ 15bb: RAISE ✓
- HJ_RFI @ 15bb: FOLD (correct — HJ does not open K2s at 15bb per PDF)
- SB_RFI @ 15bb: FOLD (correct)
- BTN_RFI @ 15bb: JAM (correct — BTN jams wide at 15bb)

**CONCLUSION: K2s in UTG RFI = RAISE is CORRECT per source PDFs. This is NOT a data error.**
The "P0 report" concern about K2s was based on a misunderstanding of GTO wheel-suited strategy.

---

## 7. AJo Cell Audit (Cross-Spot Verification)

AJo action in key spots:
- UTG_RFI @ 15bb: RAISE ✓ (UTG opens AJo)
- UTG1_RFI @ 15bb: RAISE ✓
- MP_RFI @ 15bb: RAISE ✓
- HJ_RFI @ 15bb: RAISE ✓
- CO_RFI @ 15bb: JAM (CO jams AJo at 15bb — correct, CO is wide enough)
- BTN_RFI @ 15bb: JAM ✓
- SB_RFI @ 15bb: CALL (SB calls/limps AJo at 15bb — reasonable)
- BB_vs_UTG @ 15bb: CALL ✓ (BB calls AJo vs UTG)
- CO_vs_UTG @ 15bb: FOLD (CO folds AJo vs UTG 15bb — correct, tight range)
- HJ_vs_UTG @ 15bb: FOLD ✓

These all look strategically coherent.

---

## 8. Critical Issues Identified

### Issue 1: 20bb charts have no source backing
**Severity: HIGH**
54 charts at 20bb exist in the DB with `sourceStatus = null`. There is no 20bb PDF. These charts were generated/interpolated. They should either:
a) Be marked clearly as `generated_candidate` or `interpolated` in the UI
b) Be hidden from the trainer until reviewed
c) Be removed from the DB if not needed

### Issue 2: 14 facing-3bet charts at 15bb have null sourceStatus
**Severity: MEDIUM**
These charts exist in the 15bb PDF (pages 6-7) but were not included in the source-backed review pass. They should be reviewed against the PDF and marked `source_backed`.

### Issue 3: 54 simplified_population facing-3bet charts at 25bb/40bb
**Severity: MEDIUM**
These are approximations. The 25bb and 40bb PDFs do NOT contain facing-3bet charts (only facing-RFI). These simplified_population charts are the best available data but should be clearly labelled as such in the UI.

### Issue 4: TEST_BTN_RFI chart has only 4 cells
**Severity: LOW**
Test fixture. Should be excluded from all production queries and the trainer.

### Issue 5: SB_vs_BB_3bet @ 25bb and 40bb have null sourceStatus
**Severity: LOW**
These two charts have no sourceStatus. Need to be classified.

### Issue 6: colorToken is null for all cells
**Severity: MEDIUM**
The `colorToken` column in `rangeChartActions` is null for all rows. The UI must be deriving colours from `primaryAction` at render time. This is acceptable if the colour mapping is consistent, but needs verification.

### Issue 7: RangeMatrix.tsx has a syntax error (pre-transform error at line 57)
**Severity: HIGH**
The dev server is logging: `Pre-transform error: /home/ubuntu/mtt_coach/client/src/components/strategy/RangeMatrix.tsx: Unexpected token (57:0)`
This means the strategy chart viewer component has a syntax error and is failing to render.

---

## 9. What Is NOT Wrong

1. **K2s/Q2s/J2s/T2s in UTG RFI** — These ARE correct per source PDFs. GTO wheel-suited strategy.
2. **Cell count** — 216/217 charts have exactly 169 cells. The 1 exception is the test fixture.
3. **Duplicate spot keys** — None. Every spotKey+stackDepth combination is unique.
4. **Empty charts** — None. All 217 charts have cells.
5. **AJo spot assignment** — Checked and coherent across all 15bb spots.

---

## 10. Priority Fix List

| Priority | Issue | Action Required |
|---|---|---|
| P0 | RangeMatrix.tsx syntax error | Fix the syntax error at line 57 |
| P1 | 20bb charts have no source | Mark as `generated_candidate`, add UI warning, block from trainer |
| P1 | colorToken null for all cells | Verify UI colour mapping works correctly without colorToken |
| P2 | 14 null-status 15bb facing-3bet charts | Review against PDF pages 6-7 and mark source_backed |
| P2 | SB_vs_BB_3bet @ 25bb/40bb null status | Classify and set sourceStatus |
| P3 | simplified_population label in UI | Show clear "Approximation" badge on these charts |
| P3 | TEST_BTN_RFI exclusion | Exclude from trainer and library queries |
