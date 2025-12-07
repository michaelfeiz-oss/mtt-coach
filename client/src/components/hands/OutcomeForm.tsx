import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type HandResult = "WON" | "LOST" | "CHOPPED" | "UNKNOWN";

interface OutcomeFormProps {
  result: HandResult | "";
  onResultChange: (result: HandResult | "") => void;
  evLossEstimateBb: number;
  onEvLossChange: (value: number) => void;
}

const RESULTS: Array<{ id: HandResult; label: string }> = [
  { id: "WON", label: "Won" },
  { id: "LOST", label: "Lost" },
  { id: "CHOPPED", label: "Chopped" },
  { id: "UNKNOWN", label: "Unknown / Not sure" },
];

export function OutcomeForm({
  result,
  onResultChange,
  evLossEstimateBb,
  onEvLossChange,
}: OutcomeFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Outcome (Optional)
      </h3>

      {/* Pot Result */}
      <div>
        <Label htmlFor="result" className="text-sm font-medium">
          Pot Result
        </Label>
        <Select value={result} onValueChange={(val) => onResultChange(val as HandResult | "")}>
          <SelectTrigger id="result">
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            {RESULTS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* EV Loss Estimate */}
      <div>
        <Label htmlFor="evLoss" className="text-sm font-medium">
          EV Loss Estimate (BB)
        </Label>
        <div className="flex items-center gap-4 mt-2">
          <input
            id="evLoss"
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={evLossEstimateBb}
            onChange={(e) => onEvLossChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-gray-900 w-12">
            {evLossEstimateBb.toFixed(1)} BB
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Estimate how many big blinds you lost by making a mistake (0-5 BB)
        </p>
      </div>

      {/* Summary */}
      {(result || evLossEstimateBb > 0) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 uppercase">
            Outcome Summary
          </p>
          <p className="text-sm text-amber-900 mt-1">
            {result && RESULTS.find((r) => r.id === result)?.label}
            {result && evLossEstimateBb > 0 && " • "}
            {evLossEstimateBb > 0 && `EV loss: ${evLossEstimateBb.toFixed(1)} BB`}
          </p>
        </div>
      )}
    </div>
  );
}
