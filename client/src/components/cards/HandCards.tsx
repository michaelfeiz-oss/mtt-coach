import { cn } from "@/lib/utils";
import { parseHandClass } from "@shared/preflop";
import { PlayingCard, type CardSuit, type PlayingCardSize } from "./PlayingCard";

interface HandCardsProps {
  handCode: string;
  size?: PlayingCardSize;
  showLabel?: boolean;
}

const CARD_OFFSET_CLASSES: Record<PlayingCardSize, string> = {
  sm: "-ml-3",
  md: "-ml-4",
  lg: "-ml-5",
};

function fallbackDisplayHand(handCode: string) {
  const firstRank = handCode.trim()[0]?.toUpperCase() ?? "?";
  const secondRank = handCode.trim()[1]?.toUpperCase() ?? firstRank;
  return {
    firstRank,
    secondRank,
    firstSuit: "spades" as CardSuit,
    secondSuit: "hearts" as CardSuit,
  };
}

export function HandCards({
  handCode,
  size = "md",
  showLabel = true,
}: HandCardsProps) {
  const parsedHand = parseHandClass(handCode);
  const displayHand = parsedHand ?? fallbackDisplayHand(handCode);

  return (
    <div
      className="flex flex-col items-center"
      aria-label={parsedHand ? `${parsedHand.code} ${parsedHand.label}` : handCode}
    >
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
