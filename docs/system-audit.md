# MTT Coach System Audit (April 24, 2026)

## Scope
- Product direction: preflop-first tournament study and logging.
- UX mission: simplify hierarchy, reduce visual noise, and make hand logging fast.

## Route Inventory
- `/` Dashboard
- `/log` Log hub + capture flows
- `/study` Study cockpit
- `/strategy/library` Hand Ranges
- `/strategy/trainer` Range Trainer
- `/hands` Review queue list
- `/hands/:id` Hand review detail
- Additional legacy routes retained: `icm/*`, `study-plan`, `guided-session`, `log-session`, `log-tournament`.

## Key UX/Design Findings (before pass)
1. Dark-first shell and dark cards produced low visual hierarchy.
2. Logging surface mixed older and newer UI patterns.
3. Quick hand flow had high interaction cost (dense multi-step wizard).
4. Hand picker experience was generic and not preflop-native.
5. Review surfaces were functionally correct but visually inconsistent.

## Hardening/Redesign Actions Completed
- Light warm-neutral design system applied at token/shell level.
- Desktop shell now uses a left rail, while mobile keeps bottom nav.
- Dashboard refocused around one primary study action and cleaner sections.
- Log hub rebuilt around a dominant Quick Hand Log entry point.
- Quick hand capture rebuilt into required-first form with optional disclosure.
- New preflop-native hand class picker (13x13 matrix + shorthand search).
- Canonical preflop scenario taxonomy added in shared constants.
- Supporting capture modals (Tournament, Leak, Note) aligned to same visual language.
- Strategy viewer/trainer and matrix/legend/table context refined to calmer hierarchy.
- Hands list/detail pages aligned with updated design language.

## Logic/Mapping Audit Notes
- Hand notation normalization added (`AKs`, `QQ`, `AhKh` -> canonical class).
- Quick log stores required preflop core fields and preserves optional metadata.
- Scenario taxonomy now has one source of truth for log scenarios:
  - `OPEN_RFI`
  - `DEFEND_VS_RFI`
  - `THREE_BET`
  - `FACING_THREE_BET`
  - `BLIND_VS_BLIND`
  - `LIMP_ISO`
  - `FOUR_BET_JAM`
  - `OTHER_PREFLOP`

## Validation Run
- `pnpm check` ✅
- `pnpm build` ✅ (non-blocking analytics env warnings unchanged)
- `pnpm test` ✅
