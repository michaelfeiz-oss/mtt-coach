export type SpotType =
  | "SINGLE_RAISED_POT_IP"
  | "SINGLE_RAISED_POT_OOP"
  | "THREE_BET_POT_IP"
  | "THREE_BET_POT_OOP"
  | "BLINDS_VS_BLIND"
  | "LIMPED_POT"
  | "FOUR_BET_POT"
  | "ICM_SPOT";

interface SpotTypeSelectorProps {
  value: SpotType | "";
  onChange: (spotType: SpotType) => void;
}

const SPOT_TYPES: Array<{ id: SpotType; label: string; description: string }> = [
  {
    id: "SINGLE_RAISED_POT_IP",
    label: "RFI / Open",
    description: "Open or continue in a single-raised preflop spot",
  },
  {
    id: "SINGLE_RAISED_POT_OOP",
    label: "Defend vs RFI",
    description: "Blind or position defend versus an opener",
  },
  {
    id: "THREE_BET_POT_IP",
    label: "3-Bet",
    description: "Apply pressure before the flop",
  },
  {
    id: "THREE_BET_POT_OOP",
    label: "Facing 3-Bet",
    description: "Continue, fold, or jam versus a 3-bet",
  },
  {
    id: "BLINDS_VS_BLIND",
    label: "BvB",
    description: "Small blind and big blind preflop spots",
  },
  {
    id: "LIMPED_POT",
    label: "Limp",
    description: "Preflop limp or iso spot",
  },
  {
    id: "FOUR_BET_POT",
    label: "4-Bet / Jam",
    description: "Higher-pressure preflop all-in decision",
  },
];

export function SpotTypeSelector({ value, onChange }: SpotTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-900">
        Preflop Spot <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-600">
        Choose the preflop tournament spot you are logging.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SPOT_TYPES.map(spot => (
          <button
            key={spot.id}
            onClick={() => onChange(spot.id)}
            className={`
              rounded-lg border-2 p-3 text-center transition-all
              ${
                value === spot.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }
            `}
          >
            <div className="text-sm font-semibold text-gray-900">
              {spot.label}
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {spot.description}
            </div>
          </button>
        ))}
      </div>

      {!value && (
        <div className="text-sm text-red-600">
          Please select a preflop spot to continue.
        </div>
      )}
    </div>
  );
}
