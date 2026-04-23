export const PREFLOP_SCENARIOS = [
  {
    id: "OPEN_RFI",
    label: "RFI / Open",
    helper: "Open-raise spot",
    uiSpotType: "SINGLE_RAISED_POT_IP",
  },
  {
    id: "DEFEND_VS_RFI",
    label: "Defend vs RFI",
    helper: "Continue versus opener",
    uiSpotType: "SINGLE_RAISED_POT_OOP",
  },
  {
    id: "THREE_BET",
    label: "3-Bet",
    helper: "Apply preflop pressure",
    uiSpotType: "THREE_BET_POT_IP",
  },
  {
    id: "FACING_THREE_BET",
    label: "Facing 3-Bet",
    helper: "Respond to a 3-bet",
    uiSpotType: "THREE_BET_POT_OOP",
  },
  {
    id: "BLIND_VS_BLIND",
    label: "BvB",
    helper: "Blind versus blind",
    uiSpotType: "BLINDS_VS_BLIND",
  },
  {
    id: "LIMP_ISO",
    label: "Limp / Iso",
    helper: "Limped pot decisions",
    uiSpotType: "LIMPED_POT",
  },
  {
    id: "FOUR_BET_JAM",
    label: "4-Bet / Jam",
    helper: "High-pressure preflop",
    uiSpotType: "FOUR_BET_POT",
  },
  {
    id: "OTHER_PREFLOP",
    label: "Other Preflop Spot",
    helper: "Capture unusual preflop line",
    uiSpotType: "SINGLE_RAISED_POT_IP",
  },
] as const;

export type PreflopScenarioId = (typeof PREFLOP_SCENARIOS)[number]["id"];
export type HandLogSpotType = (typeof PREFLOP_SCENARIOS)[number]["uiSpotType"];

export const PREFLOP_SCENARIO_LABELS: Record<PreflopScenarioId, string> =
  PREFLOP_SCENARIOS.reduce(
    (accumulator, scenario) => {
      accumulator[scenario.id] = scenario.label;
      return accumulator;
    },
    {} as Record<PreflopScenarioId, string>
  );

