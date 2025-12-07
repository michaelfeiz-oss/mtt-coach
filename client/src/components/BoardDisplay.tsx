import React from "react";

interface BoardDisplayProps {
  flopBoard?: string;
  turnBoard?: string;
  riverBoard?: string;
  currentStreet: number;
}

/**
 * Displays the current board state based on the street
 * Shows cards in a visual format
 */
export function BoardDisplay({
  flopBoard,
  turnBoard,
  riverBoard,
  currentStreet,
}: BoardDisplayProps) {
  const getDisplayBoard = () => {
    if (currentStreet >= 3 && riverBoard) return riverBoard;
    if (currentStreet >= 2 && turnBoard) return turnBoard;
    if (currentStreet >= 1 && flopBoard) return flopBoard;
    return null;
  };

  const getStreetName = () => {
    if (currentStreet >= 3 && riverBoard) return "River";
    if (currentStreet >= 2 && turnBoard) return "Turn";
    if (currentStreet >= 1 && flopBoard) return "Flop";
    return null;
  };

  const displayBoard = getDisplayBoard();
  const streetName = getStreetName();

  if (!displayBoard) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            {streetName}
          </p>
          <p className="text-lg font-mono font-bold text-gray-800 mt-1">
            {displayBoard}
          </p>
        </div>
        <div className="text-3xl">{getStreetEmoji(streetName)}</div>
      </div>
    </div>
  );
}

function getStreetEmoji(street: string | null): string {
  switch (street) {
    case "Flop":
      return "🎯";
    case "Turn":
      return "🔄";
    case "River":
      return "🏁";
    default:
      return "🎴";
  }
}
