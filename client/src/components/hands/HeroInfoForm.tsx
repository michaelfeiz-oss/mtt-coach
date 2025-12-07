import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandPicker } from "../HandPicker";

const POSITIONS = ["UTG", "UTG+1", "MP", "CO", "BTN", "SB", "BB"];

interface HeroInfoFormProps {
  heroPosition: string;
  onPositionChange: (position: string) => void;
  heroHand: string;
  onHandChange: (hand: string) => void;
  effectiveStackBb: string;
  onStackChange: (stack: string) => void;
}

export function HeroInfoForm({
  heroPosition,
  onPositionChange,
  heroHand,
  onHandChange,
  effectiveStackBb,
  onStackChange,
}: HeroInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Hero Info <span className="text-red-500">*</span>
      </h3>

      {/* Position */}
      <div>
        <Label htmlFor="heroPosition" className="text-sm font-medium">
          Your Position <span className="text-red-500">*</span>
        </Label>
        <Select value={heroPosition} onValueChange={onPositionChange}>
          <SelectTrigger id="heroPosition">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hand */}
      <div>
        <Label className="text-sm font-medium">
          Your Hand <span className="text-red-500">*</span>
        </Label>
        <HandPicker value={heroHand} onChange={onHandChange} />
      </div>

      {/* Effective Stack */}
      <div>
        <Label htmlFor="effectiveStack" className="text-sm font-medium">
          Effective Stack (BB) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="effectiveStack"
          type="number"
          min="1"
          max="500"
          value={effectiveStackBb}
          onChange={(e) => onStackChange(e.target.value)}
          placeholder="e.g., 50"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Stack size in big blinds (1-500)
        </p>
      </div>
    </div>
  );
}
