import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type VillainType = "UNKNOWN" | "REC" | "GOOD_REG" | "AGGRO_REG" | "NIT" | "MANIAC";
export type VillainRangeType = "WIDE" | "STANDARD" | "TIGHT" | "NUTS_WEIGHTED";

interface VillainProfileFormProps {
  villainType: VillainType | "";
  onVillainTypeChange: (type: VillainType | "") => void;
  villainRangeType: VillainRangeType | "";
  onVillainRangeTypeChange: (rangeType: VillainRangeType | "") => void;
}

const VILLAIN_TYPES: Array<{ id: VillainType; label: string }> = [
  { id: "UNKNOWN", label: "Unknown" },
  { id: "REC", label: "Rec/Fish" },
  { id: "GOOD_REG", label: "Good Reg" },
  { id: "AGGRO_REG", label: "Aggro Reg" },
  { id: "NIT", label: "Nit" },
  { id: "MANIAC", label: "Maniac" },
];

const RANGE_TYPES: Array<{ id: VillainRangeType; label: string }> = [
  { id: "WIDE", label: "Wide" },
  { id: "STANDARD", label: "Standard" },
  { id: "TIGHT", label: "Tight" },
  { id: "NUTS_WEIGHTED", label: "Nuts-Weighted" },
];

export function VillainProfileForm({
  villainType,
  onVillainTypeChange,
  villainRangeType,
  onVillainRangeTypeChange,
}: VillainProfileFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Villain Profile (Optional)
      </h3>

      {/* Villain Type */}
      <div>
        <Label htmlFor="villainType" className="text-sm font-medium">
          Villain Type
        </Label>
        <Select value={villainType} onValueChange={(val) => onVillainTypeChange(val as VillainType | "")}>
          <SelectTrigger id="villainType">
            <SelectValue placeholder="Select villain type" />
          </SelectTrigger>
          <SelectContent>
            {VILLAIN_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Range Type */}
      <div>
        <Label htmlFor="villainRangeType" className="text-sm font-medium">
          Range Type
        </Label>
        <Select value={villainRangeType} onValueChange={(val) => onVillainRangeTypeChange(val as VillainRangeType | "")}>
          <SelectTrigger id="villainRangeType">
            <SelectValue placeholder="Select range type" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {(villainType || villainRangeType) && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-semibold text-purple-700 uppercase">
            Villain Profile
          </p>
          <p className="text-sm text-purple-900 mt-1">
            {villainType && VILLAIN_TYPES.find((t) => t.id === villainType)?.label}
            {villainType && villainRangeType && ", "}
            {villainRangeType && `playing ${RANGE_TYPES.find((t) => t.id === villainRangeType)?.label.toLowerCase()}`}
          </p>
        </div>
      )}
    </div>
  );
}
