# AJo review

- Scope: every seeded strategy chart row for `AJo`
- Reviewed source truth: `shared/strategy-data/reviewed/` for trainer-safe source-backed charts
- DB comparison: pending runtime `DATABASE_URL`; this doc reflects seed truth only

| Stack | Chart | Spot Key | Current Action | Reviewed Expected | Source Status | Trainer Allowed | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15 | BB vs BTN @ 15bb | BB_vs_BTN | JAM | JAM | source_backed | yes | reviewed_match |
| 15 | BB vs CO @ 15bb | BB_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | BB vs MP @ 15bb | BB_vs_MP | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | BB vs SB limp @ 15bb | BB_vs_SB_limp | RAISE | n/a | proxy | no | study_only_not_reviewed |
| 15 | BB vs UTG @ 15bb | BB_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | BTN RFI @ 15bb | BTN_RFI | JAM | JAM | source_backed | yes | reviewed_match |
| 15 | BTN vs BB 3-Bet @ 15bb | BTN_vs_BB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | BTN vs CO @ 15bb | BTN_vs_CO | JAM | JAM | source_backed | yes | reviewed_match |
| 15 | BTN vs MP @ 15bb | BTN_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | BTN vs UTG @ 15bb | BTN_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | CO RFI @ 15bb | CO_RFI | JAM | JAM | source_backed | yes | reviewed_match |
| 15 | CO vs BB 3-Bet @ 15bb | CO_vs_BB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | CO vs MP @ 15bb | CO_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | CO vs SB 3-Bet @ 15bb | CO_vs_SB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | CO vs UTG @ 15bb | CO_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | HJ RFI @ 15bb | HJ_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 15 | HJ vs BB 3-Bet @ 15bb | HJ_vs_BB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | HJ vs MP @ 15bb | HJ_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | HJ vs UTG @ 15bb | HJ_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | MP RFI @ 15bb | MP_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 15 | MP vs BB 3-Bet @ 15bb | MP_vs_BB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | MP vs UTG @ 15bb | MP_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | SB RFI @ 15bb | SB_RFI | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | SB vs BB (limp) @ 15bb | SB_vs_BB_limp | JAM | n/a | proxy | no | study_only_not_reviewed |
| 15 | SB vs BTN @ 15bb | SB_vs_BTN | JAM | JAM | source_backed | yes | reviewed_match |
| 15 | SB vs CO @ 15bb | SB_vs_CO | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | SB vs MP @ 15bb | SB_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | SB vs UTG @ 15bb | SB_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | UTG RFI @ 15bb | UTG_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 15 | UTG vs BB 3-Bet @ 15bb | UTG_vs_BB_3bet | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | UTG vs BTN 3-Bet @ 15bb | UTG_vs_BTN_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | UTG vs SB 3-Bet @ 15bb | UTG_vs_SB_3bet | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | UTG vs UTG+1 3-Bet @ 15bb | UTG_vs_UTG1_3bet | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | UTG+1 RFI @ 15bb | UTG1_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 15 | UTG+1 vs BB 3-Bet @ 15bb | UTG1_vs_BB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | UTG+1 vs BTN 3-Bet @ 15bb | UTG1_vs_BTN_3bet | CALL | CALL | source_backed | yes | reviewed_match |
| 15 | UTG+1 vs MP 3-Bet @ 15bb | UTG1_vs_MP_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | UTG+1 vs SB 3-Bet @ 15bb | UTG1_vs_SB_3bet | FOLD | FOLD | source_backed | yes | reviewed_match |
| 15 | UTG+1 vs UTG @ 15bb | UTG1_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | BB vs BTN @ 25bb | BB_vs_BTN | JAM | JAM | source_backed | yes | reviewed_match |
| 25 | BB vs CO @ 25bb | BB_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | BB vs MP @ 25bb | BB_vs_MP | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | BB vs SB limp @ 25bb | BB_vs_SB_limp | RAISE | n/a | proxy | no | study_only_not_reviewed |
| 25 | BB vs UTG @ 25bb | BB_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | BTN RFI @ 25bb | BTN_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | BTN vs BB 3-Bet @ 25bb | BTN_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | BTN vs CO @ 25bb | BTN_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | BTN vs MP @ 25bb | BTN_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | BTN vs SB 3-Bet @ 25bb | BTN_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | BTN vs UTG @ 25bb | BTN_vs_UTG | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 25 | CO RFI @ 25bb | CO_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | CO vs BB 3-Bet @ 25bb | CO_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | CO vs BTN 3-Bet @ 25bb | CO_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | CO vs MP @ 25bb | CO_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | CO vs SB 3-Bet @ 25bb | CO_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | CO vs UTG @ 25bb | CO_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | HJ RFI @ 25bb | HJ_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | HJ vs BB 3-Bet @ 25bb | HJ_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | HJ vs BTN 3-Bet @ 25bb | HJ_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | HJ vs CO 3-Bet @ 25bb | HJ_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | HJ vs MP @ 25bb | HJ_vs_MP | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 25 | HJ vs SB 3-Bet @ 25bb | HJ_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | HJ vs UTG @ 25bb | HJ_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | MP RFI @ 25bb | MP_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | MP vs BB 3-Bet @ 25bb | MP_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | MP vs BTN 3-Bet @ 25bb | MP_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | MP vs CO 3-Bet @ 25bb | MP_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | MP vs HJ 3-Bet @ 25bb | MP_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | MP vs SB 3-Bet @ 25bb | MP_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | MP vs UTG @ 25bb | MP_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | SB RFI @ 25bb | SB_RFI | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | SB vs BB (limp) @ 25bb | SB_vs_BB_limp | RAISE | n/a | proxy | no | study_only_not_reviewed |
| 25 | SB vs BTN @ 25bb | SB_vs_BTN | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | SB vs CO @ 25bb | SB_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 25 | SB vs MP @ 25bb | SB_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 25 | SB vs UTG @ 25bb | SB_vs_UTG | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 25 | UTG RFI @ 25bb | UTG_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | UTG vs BB 3-Bet @ 25bb | UTG_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs BTN 3-Bet @ 25bb | UTG_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs CO 3-Bet @ 25bb | UTG_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs HJ 3-Bet @ 25bb | UTG_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs MP 3-Bet @ 25bb | UTG_vs_MP_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs SB 3-Bet @ 25bb | UTG_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG vs UTG+1 3-Bet @ 25bb | UTG_vs_UTG1_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 RFI @ 25bb | UTG1_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 25 | UTG+1 vs BB 3-Bet @ 25bb | UTG1_vs_BB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs BTN 3-Bet @ 25bb | UTG1_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs CO 3-Bet @ 25bb | UTG1_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs HJ 3-Bet @ 25bb | UTG1_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs MP 3-Bet @ 25bb | UTG1_vs_MP_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs SB 3-Bet @ 25bb | UTG1_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 25 | UTG+1 vs UTG @ 25bb | UTG1_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 40 | BB vs BTN @ 40bb | BB_vs_BTN | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | BB vs CO @ 40bb | BB_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | BB vs MP @ 40bb | BB_vs_MP | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 40 | BB vs SB limp @ 40bb | BB_vs_SB_limp | CHECK | n/a | proxy | no | study_only_not_reviewed |
| 40 | BB vs UTG @ 40bb | BB_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | BTN RFI @ 40bb | BTN_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | BTN vs BB 3-Bet @ 40bb | BTN_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | BTN vs CO @ 40bb | BTN_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | BTN vs MP @ 40bb | BTN_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 40 | BTN vs SB 3-Bet @ 40bb | BTN_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | BTN vs UTG @ 40bb | BTN_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 40 | CO RFI @ 40bb | CO_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | CO vs BB 3-Bet @ 40bb | CO_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | CO vs BTN 3-Bet @ 40bb | CO_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | CO vs MP @ 40bb | CO_vs_MP | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 40 | CO vs SB 3-Bet @ 40bb | CO_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | CO vs UTG @ 40bb | CO_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | HJ RFI @ 40bb | HJ_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | HJ vs BB 3-Bet @ 40bb | HJ_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | HJ vs BTN 3-Bet @ 40bb | HJ_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | HJ vs CO 3-Bet @ 40bb | HJ_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | HJ vs MP @ 40bb | HJ_vs_MP | THREE_BET | THREE_BET | source_backed | yes | reviewed_match |
| 40 | HJ vs SB 3-Bet @ 40bb | HJ_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | HJ vs UTG @ 40bb | HJ_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | MP RFI @ 40bb | MP_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | MP vs BB 3-Bet @ 40bb | MP_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | MP vs BTN 3-Bet @ 40bb | MP_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | MP vs CO 3-Bet @ 40bb | MP_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | MP vs HJ 3-Bet @ 40bb | MP_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | MP vs SB 3-Bet @ 40bb | MP_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | MP vs UTG @ 40bb | MP_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
| 40 | SB RFI @ 40bb | SB_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | SB vs BB (limp) @ 40bb | SB_vs_BB_limp | LIMP | n/a | proxy | no | study_only_not_reviewed |
| 40 | SB vs BTN @ 40bb | SB_vs_BTN | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | SB vs CO @ 40bb | SB_vs_CO | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | SB vs MP @ 40bb | SB_vs_MP | FOLD | FOLD | source_backed | yes | reviewed_match |
| 40 | SB vs UTG @ 40bb | SB_vs_UTG | CALL | CALL | source_backed | yes | reviewed_match |
| 40 | UTG RFI @ 40bb | UTG_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | UTG vs BB 3-Bet @ 40bb | UTG_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs BTN 3-Bet @ 40bb | UTG_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs CO 3-Bet @ 40bb | UTG_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs HJ 3-Bet @ 40bb | UTG_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs MP 3-Bet @ 40bb | UTG_vs_MP_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs SB 3-Bet @ 40bb | UTG_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG vs UTG+1 3-Bet @ 40bb | UTG_vs_UTG1_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 RFI @ 40bb | UTG1_RFI | RAISE | RAISE | source_backed | yes | reviewed_match |
| 40 | UTG+1 vs BB 3-Bet @ 40bb | UTG1_vs_BB_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs BTN 3-Bet @ 40bb | UTG1_vs_BTN_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs CO 3-Bet @ 40bb | UTG1_vs_CO_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs HJ 3-Bet @ 40bb | UTG1_vs_HJ_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs MP 3-Bet @ 40bb | UTG1_vs_MP_3bet | FOLD | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs SB 3-Bet @ 40bb | UTG1_vs_SB_3bet | CALL | n/a | simplified_population | no | study_only_not_reviewed |
| 40 | UTG+1 vs UTG @ 40bb | UTG1_vs_UTG | FOLD | FOLD | source_backed | yes | reviewed_match |
