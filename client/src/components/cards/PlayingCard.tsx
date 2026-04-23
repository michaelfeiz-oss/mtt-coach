import { cn } from "@/lib/utils";

export type CardSuit = "spades" | "hearts" | "diamonds" | "clubs";
export type PlayingCardSize = "sm" | "md" | "lg";

interface PlayingCardProps {
  rank: string;
  suit: CardSuit;
  size?: PlayingCardSize;
  className?: string;
}

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const SIZE_CLASSES: Record<PlayingCardSize, string> = {
  sm: "h-14 w-10 rounded-xl p-1.5 text-[11px]",
  md: "h-[4.75rem] w-14 rounded-2xl p-2 text-sm",
  lg: "h-24 w-[4.25rem] rounded-2xl p-2.5 text-base",
};

const CENTER_SIZE_CLASSES: Record<PlayingCardSize, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
};

function isRedSuit(suit: CardSuit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export function PlayingCard({
  rank,
  suit,
  size = "md",
  className = "",
}: PlayingCardProps) {
  const symbol = SUIT_SYMBOLS[suit];
  const colorClass = isRedSuit(suit) ? "text-red-600" : "text-zinc-950";

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col justify-between border border-slate-200 bg-white font-black leading-none shadow-xl shadow-zinc-950/20",
        SIZE_CLASSES[size],
        colorClass,
        className
      )}
      aria-label={`${rank}${symbol}`}
    >
      <div className="flex flex-col items-start gap-0.5">
        <span>{rank}</span>
        <span className="-mt-0.5">{symbol}</span>
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center opacity-90",
          CENTER_SIZE_CLASSES[size]
        )}
        aria-hidden="true"
      >
        {symbol}
      </div>
      <div className="flex rotate-180 flex-col items-start gap-0.5 self-end">
        <span>{rank}</span>
        <span className="-mt-0.5">{symbol}</span>
      </div>
    </div>
  );
}

export default PlayingCard;
