import React from "react";

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
    label: "SRP – IP",
    description: "Single Raised Pot, In Position",
  },
  {
    id: "SINGLE_RAISED_POT_OOP",
    label: "SRP – OOP",
    description: "Single Raised Pot, Out of Position",
  },
  {
    id: "THREE_BET_POT_IP",
    label: "3BP – IP",
    description: "3-Bet Pot, In Position",
  },
  {
    id: "THREE_BET_POT_OOP",
    label: "3BP – OOP",
    description: "3-Bet Pot, Out of Position",
  },
  {
    id: "BLINDS_VS_BLIND",
    label: "BvB",
    description: "Blinds vs Blind",
  },
  {
    id: "LIMPED_POT",
    label: "Limp Pot",
    description: "Limped Pot",
  },
  {
    id: "FOUR_BET_POT",
    label: "4-Bet Pot",
    description: "4-Bet Pot",
  },
  {
    id: "ICM_SPOT",
    label: "ICM Spot",
    description: "ICM/Push-Fold Situation",
  },
];

export function SpotTypeSelector({ value, onChange }: SpotTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-900">
        Spot Type <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-600">
        Choose the type of poker situation you're logging
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SPOT_TYPES.map((spot) => (
          <button
            key={spot.id}
            onClick={() => onChange(spot.id)}
            className={`
              p-3 rounded-lg border-2 transition-all text-center
              ${
                value === spot.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }
            `}
          >
            <div className="font-semibold text-sm text-gray-900">
              {spot.label}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {spot.description}
            </div>
          </button>
        ))}
      </div>

      {!value && (
        <div className="text-sm text-red-600">
          Please select a spot type to continue
        </div>
      )}
    </div>
  );
}
