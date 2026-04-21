import { cn } from "@/lib/utils";
import { PlayingCard, type CardSuit, type PlayingCardSize } from "./PlayingCard";

interface HandCardsProps {
  handCode: string;
  size?: PlayingCardSize;
  showLabel?: boolean;
}

interface ParsedDisplayHand {
  firstRank: string;
  secondRank: string;
  firstSuit: CardSuit;
  secondSuit: CardSuit;
}

const CARD_OFFSET_CLASSES: Record<PlayingCardSize, string> = {
  sm: "-ml-3",
  md: "-ml-4",
  lg: "-ml-5",
};

function parseHandForDisplay(handCode: string): ParsedDisplayHand {
  const normalized = handCode.trim();
  const firstRank = normalized[0]?.toUpperCase() ?? "?";
  const secondRank = normalized[1]?.toUpperCase() ?? firstRank;
  const suffix = normalized[2]?.toLowerCase();
  const isPair = firstRank === secondRank && normalized.length === 2;
  const isSuited = suffix === "s";

  if (isSuited) {
    return {
      firstRank,
      secondRank,
      firstSuit: "spades",
      secondSuit: "spades",
    };
  }

  if (isPair || suffix === "o") {
    return {
      firstRank,
      secondRank,
      firstSuit: "spades",
      secondSuit: "hearts",
    };
  }

  return {
    firstRank,
    secondRank,
    firstSuit: "spades",
    secondSuit: "hearts",
  };
}

export function HandCards({
  handCode,
  size = "md",
  showLabel = true,
}: HandCardsProps) {
  const displayHand = parseHandForDisplay(handCode);

  return (
    <div className="flex flex-col items-center" aria-label={handCode}>
      <span className="sr-only">{handCode}</span>
      <div className="flex items-center justify-center">
        <PlayingCard
          rank={displayHand.firstRank}
          suit={displayHand.firstSuit}
          size={size}
          className="-rotate-6"
        />
        <PlayingCard
          rank={displayHand.secondRank}
          suit={displayHand.secondSuit}
          size={size}
          className={cn("z-10 rotate-6", CARD_OFFSET_CLASSES[size])}
        />
      </div>
      {showLabel && (
        <span className="mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-bold tracking-[0.18em] text-zinc-300">
          {handCode}
        </span>
      )}
    </div>
  );
}

export default HandCards;
