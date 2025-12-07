import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type GameType = "LIVE" | "ONLINE";
export type TournamentPhase = "EARLY" | "MID" | "LATE" | "BUBBLE" | "ITM" | "FINAL_TABLE";

interface ContextFormProps {
  gameType: GameType | "";
  onGameTypeChange: (value: GameType) => void;
  tournamentPhase: TournamentPhase | "";
  onTournamentPhaseChange: (value: TournamentPhase) => void;
  isPko: boolean;
  onPkoChange: (value: boolean) => void;
}

export function ContextForm({
  gameType,
  onGameTypeChange,
  tournamentPhase,
  onTournamentPhaseChange,
  isPko,
  onPkoChange,
}: ContextFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Game Type
        </label>
        <Select value={gameType} onValueChange={(value) => onGameTypeChange(value as GameType)}>
          <SelectTrigger>
            <SelectValue placeholder="Select game type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Phase
        </label>
        <Select
          value={tournamentPhase}
          onValueChange={(value) => onTournamentPhaseChange(value as TournamentPhase)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EARLY">Early</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="BUBBLE">Bubble</SelectItem>
            <SelectItem value="ITM">ITM</SelectItem>
            <SelectItem value="FINAL_TABLE">Final Table</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPko"
          checked={isPko}
          onChange={(e) => onPkoChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="isPko" className="text-sm font-medium text-gray-700">
          PKO Tournament
        </label>
      </div>
    </div>
  );
}
