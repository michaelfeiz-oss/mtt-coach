import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SizeBucket = "SMALL" | "MEDIUM" | "BIG" | "OVERBET" | "JAM" | "CHECK";

export interface StreetAction {
  street: "PREFLOP" | "FLOP" | "TURN" | "RIVER";
  villainAction?: {
    type: "CHECK" | "BET" | "RAISE" | "JAM";
    sizeBucket?: SizeBucket;
  };
  heroAction?: {
    type: "CHECK" | "CALL" | "BET" | "RAISE" | "JAM" | "FOLD";
    sizeBucket?: SizeBucket;
  };
}

interface PlayerActionsFormProps {
  streetAction: StreetAction | null;
  onChange: (action: StreetAction | null) => void;
}

const STREETS = ["PREFLOP", "FLOP", "TURN", "RIVER"];
const VILLAIN_ACTIONS = ["CHECK", "BET", "RAISE", "JAM"];
const HERO_ACTIONS = ["CHECK", "CALL", "BET", "RAISE", "JAM", "FOLD"];
const SIZE_BUCKETS = ["SMALL", "MEDIUM", "BIG", "OVERBET"];

export function PlayerActionsForm({
  streetAction,
  onChange,
}: PlayerActionsFormProps) {
  const handleStreetChange = (street: string) => {
    onChange({
      street: street as StreetAction["street"],
      villainAction: streetAction?.villainAction,
      heroAction: streetAction?.heroAction,
    });
  };

  const handleVillainActionChange = (type: string) => {
    if (!streetAction) return;
    onChange({
      ...streetAction,
      villainAction: {
        type: type as any,
        sizeBucket: ["BET", "RAISE"].includes(type) ? "MEDIUM" : undefined,
      },
    });
  };

  const handleVillainSizeChange = (size: string) => {
    if (!streetAction?.villainAction) return;
    onChange({
      ...streetAction,
      villainAction: {
        ...streetAction.villainAction,
        sizeBucket: size as SizeBucket,
      },
    });
  };

  const handleHeroActionChange = (type: string) => {
    if (!streetAction) return;
    onChange({
      ...streetAction,
      heroAction: {
        type: type as any,
        sizeBucket: ["BET", "RAISE"].includes(type) ? "MEDIUM" : undefined,
      },
    });
  };

  const handleHeroSizeChange = (size: string) => {
    if (!streetAction?.heroAction) return;
    onChange({
      ...streetAction,
      heroAction: {
        ...streetAction.heroAction,
        sizeBucket: size as SizeBucket,
      },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Player Actions (Optional)
      </h3>
      <p className="text-xs text-gray-600">
        Log the key street action from this hand
      </p>

      {/* Street Selection */}
      <div>
        <Label htmlFor="street" className="text-sm font-medium">
          Key Street
        </Label>
        <Select value={streetAction?.street || ""} onValueChange={handleStreetChange}>
          <SelectTrigger id="street">
            <SelectValue placeholder="Select street" />
          </SelectTrigger>
          <SelectContent>
            {STREETS.map((street) => (
              <SelectItem key={street} value={street}>
                {street}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {streetAction && (
        <>
          {/* Villain Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Villain Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={streetAction.villainAction?.type || ""}
                onValueChange={handleVillainActionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {VILLAIN_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {streetAction.villainAction?.type &&
                ["BET", "RAISE"].includes(streetAction.villainAction.type) && (
                  <Select
                    value={streetAction.villainAction.sizeBucket || ""}
                    onValueChange={handleVillainSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_BUCKETS.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
            </div>
          </div>

          {/* Hero Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hero Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={streetAction.heroAction?.type || ""}
                onValueChange={handleHeroActionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {HERO_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {streetAction.heroAction?.type &&
                ["BET", "RAISE"].includes(streetAction.heroAction.type) && (
                  <Select
                    value={streetAction.heroAction.sizeBucket || ""}
                    onValueChange={handleHeroSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_BUCKETS.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
            </div>
          </div>

          {/* Action Summary */}
          {streetAction.villainAction && streetAction.heroAction && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 uppercase">
                Action Summary
              </p>
              <p className="text-sm text-blue-900 mt-1">
                {streetAction.street}: Villain{" "}
                {streetAction.villainAction.type.toLowerCase()}
                {streetAction.villainAction.sizeBucket &&
                  ` ${streetAction.villainAction.sizeBucket.toLowerCase()}`}
                , Hero{" "}
                {streetAction.heroAction.type.toLowerCase()}
                {streetAction.heroAction.sizeBucket &&
                  ` ${streetAction.heroAction.sizeBucket.toLowerCase()}`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
