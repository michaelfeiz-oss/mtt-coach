import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_ABBREV = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

interface HandPickerProps {
  value: string;
  onChange: (hand: string) => void;
}

export function HandPicker({ value, onChange }: HandPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleCardClick = (card: string) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleConfirm = () => {
    if (selectedCards.length === 2) {
      // Format as "AhKs" (rank + suit abbreviation)
      const hand = selectedCards
        .map((card) => {
          const rank = card[0];
          const suit = card[1];
          return rank + SUIT_ABBREV[suit as keyof typeof SUIT_ABBREV];
        })
        .join("");
      onChange(hand);
      setOpen(false);
      setSelectedCards([]);
    }
  };

  const generateCards = () => {
    const cards: string[] = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        cards.push(`${rank}${suit}`);
      }
    }
    return cards;
  };

  const getSuitColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-600" : "text-black";
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        {value || "Select your hand"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Your Hand</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-13 gap-2 max-h-96 overflow-y-auto p-4">
            {generateCards().map((card) => {
              const suit = card[1];
              return (
                <button
                  key={card}
                  onClick={() => handleCardClick(card)}
                  className={`
                    w-12 h-16 rounded border-2 flex items-center justify-center text-sm font-bold
                    transition-all cursor-pointer
                    ${
                      selectedCards.includes(card)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }
                    ${getSuitColor(suit)}
                  `}
                >
                  {card}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 justify-between items-center pt-4 px-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <span className="text-sm font-semibold">
              {selectedCards.length === 2
                ? `Selected: ${selectedCards
                    .map((c) => c[0] + SUIT_ABBREV[c[1] as keyof typeof SUIT_ABBREV])
                    .join("")}`
                : `Select (${selectedCards.length}/2)`}
            </span>
            <Button
              onClick={handleConfirm}
              disabled={selectedCards.length !== 2}
            >
              Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
