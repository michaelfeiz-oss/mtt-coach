import React from "react";
import { Button } from "@/components/ui/button";

interface BoardFormV2Props {
  flopBoard: string;
  onFlopChange: (value: string) => void;
  turnCard: string;
  onTurnChange: (value: string) => void;
  riverCard: string;
  onRiverChange: (value: string) => void;
}

// Helper to format card code to display (e.g., "K9" -> "K♠")
function formatCard(cardCode: string): string {
  if (!cardCode || cardCode.length < 2) return "";
  const rank = cardCode[0];
  const suitCode = parseInt(cardCode.substring(1));
  const suits = ["♠", "♥", "♦", "♣"];
  const suit = suits[suitCode] || "?";
  return `${rank}${suit}`;
}

// Helper to parse flop board string (e.g., "K9T" -> ["K♠", "9♥", "T♦"])
function parseFlopBoard(boardStr: string): string[] {
  if (!boardStr) return ["", "", ""];
  const cards = boardStr.split("");
  return cards.slice(0, 3).map((_, i) => {
    const code = boardStr[i * 2] + boardStr[i * 2 + 1];
    return formatCard(code);
  });
}

export function BoardFormV2({
  flopBoard,
  onFlopChange,
  turnCard,
  onTurnChange,
  riverCard,
  onRiverChange,
}: BoardFormV2Props) {
  const flopCards = parseFlopBoard(flopBoard);
  const turnDisplay = formatCard(turnCard);
  const riverDisplay = formatCard(riverCard);

  return (
    <div className="space-y-4">
      {/* Flop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flop (3 cards)
        </label>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-16 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white text-lg font-semibold text-gray-900"
            >
              {flopCards[i] || "—"}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            // TODO: Open card picker modal for flop
          }}
        >
          Select Flop ({flopBoard ? 3 : 0}/3)
        </Button>
      </div>

      {/* Turn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Turn (optional)
        </label>
        <div className="flex gap-2">
          <div className="w-16 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white text-lg font-semibold text-gray-900">
            {turnDisplay || "—"}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            // TODO: Open card picker modal for turn
          }}
        >
          Select Turn
        </Button>
      </div>

      {/* River */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          River (optional)
        </label>
        <div className="flex gap-2">
          <div className="w-16 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white text-lg font-semibold text-gray-900">
            {riverDisplay || "—"}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            // TODO: Open card picker modal for river
          }}
        >
          Select River
        </Button>
      </div>
    </div>
  );
}
