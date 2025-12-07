import React from "react";
import { Label } from "@/components/ui/label";
import { BoardPicker } from "../BoardPicker";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BoardFormProps {
  flopBoard: string;
  onFlopChange: (board: string) => void;
  turnCard: string;
  onTurnChange: (card: string) => void;
  riverCard: string;
  onRiverChange: (card: string) => void;
}

// Single card picker for turn/river
function SingleCardPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (card: string) => void;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

  const generateCards = () => {
    const cards: string[] = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        cards.push(`${rank}${suit.charCodeAt(0)}`);
      }
    }
    return cards;
  };

  const getCardDisplay = (card: string) => {
    const rank = card[0];
    const suitCode = parseInt(card.substring(1));
    const suit = String.fromCharCode(suitCode);
    return `${rank}${suit}`;
  };

  const getSuitColor = (card: string) => {
    const suitCode = parseInt(card.substring(1));
    const suit = String.fromCharCode(suitCode);
    return suit === "♥" || suit === "♦" ? "text-red-600" : "text-black";
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2 items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="flex-1 justify-start"
        >
          {value ? getCardDisplay(value) : `Select ${label}`}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-13 gap-2 p-3 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
          {generateCards().map((card) => (
            <button
              key={card}
              onClick={() => {
                onChange(card);
                setOpen(false);
              }}
              className={`
                w-10 h-14 rounded border-2 flex items-center justify-center text-sm font-bold
                transition-all cursor-pointer
                ${
                  value === card
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }
                ${getSuitColor(card)}
              `}
            >
              {getCardDisplay(card)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BoardForm({
  flopBoard,
  onFlopChange,
  turnCard,
  onTurnChange,
  riverCard,
  onRiverChange,
}: BoardFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Board (Optional)</h3>

      {/* Flop */}
      <div>
        <BoardPicker
          value={flopBoard}
          onChange={onFlopChange}
          maxCards={3}
          label="Flop (3 cards)"
        />
      </div>

      {/* Turn */}
      {flopBoard && (
        <SingleCardPicker
          value={turnCard}
          onChange={onTurnChange}
          label="Turn (1 card)"
        />
      )}

      {/* River */}
      {flopBoard && turnCard && (
        <SingleCardPicker
          value={riverCard}
          onChange={onRiverChange}
          label="River (1 card)"
        />
      )}

      {/* Display current board */}
      {(flopBoard || turnCard || riverCard) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-semibold text-green-700 uppercase">
            Current Board
          </p>
          <p className="text-lg font-mono font-bold text-gray-800 mt-1">
            {flopBoard}
            {turnCard && turnCard.substring(0, 1) + String.fromCharCode(parseInt(turnCard.substring(1)))}
            {riverCard && riverCard.substring(0, 1) + String.fromCharCode(parseInt(riverCard.substring(1)))}
          </p>
        </div>
      )}
    </div>
  );
}
