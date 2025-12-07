import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

interface BoardPickerProps {
  value: string;
  onChange: (board: string) => void;
  maxCards: number;
  label?: string;
}

export function BoardPicker({
  value,
  onChange,
  maxCards,
  label = "Board",
}: BoardPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleCardClick = (card: string) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < maxCards) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleConfirm = () => {
    if (selectedCards.length > 0) {
      onChange(selectedCards.join(""));
      setOpen(false);
      setSelectedCards([]);
    }
  };

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

  const getStreetName = () => {
    switch (maxCards) {
      case 3:
        return "Flop";
      case 4:
        return "Turn";
      case 5:
        return "River";
      default:
        return "Board";
    }
  };

  return (
    <>
      <label className="text-sm font-medium">{label}</label>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        {value || `Select ${getStreetName()} (${selectedCards.length}/${maxCards})`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select {getStreetName()} Cards</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-13 gap-2 max-h-96 overflow-y-auto p-4">
            {generateCards().map((card) => (
              <button
                key={card}
                onClick={() => handleCardClick(card)}
                className={`
                  w-12 h-16 rounded border-2 flex items-center justify-center text-sm font-bold
                  transition-all cursor-pointer
                  ${
                    selectedCards.includes(card)
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

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCards.length === 0}
            >
              Select ({selectedCards.length}/{maxCards})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
