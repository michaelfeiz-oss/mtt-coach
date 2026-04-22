import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  POSITIONS,
  SPOT_GROUP_LABELS,
  type SpotGroup,
} from "../../../../shared/strategy";

interface TableContextProps {
  title?: string;
  stackDepth?: number;
  heroPosition?: string | null;
  villainPosition?: string | null;
  spotGroup?: SpotGroup;
  playerCount?: number;
  anteLabel?: string;
  className?: string;
}

const SEAT_LAYOUT: Record<string, string> = {
  UTG: "left-[17%] top-[12%]",
  UTG1: "left-[39%] top-[5%]",
  MP: "right-[17%] top-[12%]",
  HJ: "right-[6%] top-[42%]",
  CO: "right-[17%] bottom-[12%]",
  BTN: "left-[39%] bottom-[5%]",
  SB: "left-[17%] bottom-[12%]",
  BB: "left-[6%] top-[42%]",
};

function displayPosition(position: string) {
  return position === "UTG1" ? "UTG+1" : position;
}

function seatTone(
  position: string,
  heroPosition?: string | null,
  villainPosition?: string | null
) {
  if (position === heroPosition) {
    return "border-orange-300 bg-orange-500 text-white shadow-lg shadow-orange-950/30";
  }

  if (position === villainPosition) {
    return "border-sky-300 bg-sky-500 text-white shadow-lg shadow-sky-950/25";
  }

  if (position === "SB" || position === "BB" || position === "BTN") {
    return "border-white/15 bg-white/[0.13] text-zinc-200";
  }

  return "border-white/10 bg-white/[0.06] text-zinc-500";
}

export function TableContext({
  title,
  stackDepth,
  heroPosition,
  villainPosition,
  spotGroup,
  playerCount = 9,
  anteLabel = "12.5%",
  className,
}: TableContextProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_13rem),linear-gradient(180deg,#18181b_0%,#09090b_100%)] p-3 text-white shadow-xl shadow-black/25",
        className
      )}
      aria-label="Trainer table context"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
            Scenario
          </p>
          <h2 className="truncate text-sm font-black tracking-tight">
            {title ?? "Mixed Range Drill"}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {stackDepth !== undefined && (
            <Badge className="rounded-full bg-orange-500 text-white">
              {stackDepth}bb
            </Badge>
          )}
          {spotGroup && (
            <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-200">
              {SPOT_GROUP_LABELS[spotGroup].replace(" (Open Raise)", "")}
            </Badge>
          )}
        </div>
      </div>

      <div className="relative mx-auto h-40 max-w-sm sm:h-52">
        <div className="absolute inset-x-[12%] inset-y-[20%] rounded-[999px] border border-orange-300/35 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.13),transparent_46%),linear-gradient(135deg,rgba(24,24,27,0.95),rgba(39,39,42,0.7))] shadow-inner shadow-black/50" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-center shadow-lg shadow-black/20">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            {playerCount} players
          </span>
          <span className="mt-0.5 text-xs font-black text-zinc-100">
            Ante {anteLabel}
          </span>
          <span className="mt-1 text-[10px] text-zinc-500">
            BTN marker shown
          </span>
        </div>

        {POSITIONS.map(position => {
          const isHero = position === heroPosition;
          const isVillain = position === villainPosition;

          return (
            <div
              key={position}
              className={cn(
                "absolute flex h-11 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border text-center text-[10px] font-black leading-tight transition",
                SEAT_LAYOUT[position],
                seatTone(position, heroPosition, villainPosition)
              )}
            >
              <span>{displayPosition(position)}</span>
              <span
                className={cn(
                  "mt-0.5 text-[9px] font-bold opacity-75",
                  isHero || isVillain ? "text-white" : "text-zinc-400"
                )}
              >
                {isHero
                  ? "Hero"
                  : isVillain
                    ? "Villain"
                    : position === "BTN"
                      ? "D"
                      : stackDepth
                        ? `${stackDepth}bb`
                        : "-"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <span className="font-black text-zinc-200">
            {heroPosition ? displayPosition(heroPosition) : "Mixed"}
          </span>
          <span className="ml-1">hero</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-2">
          <span className="font-black text-zinc-200">
            {villainPosition ? displayPosition(villainPosition) : "No opener"}
          </span>
          <span className="ml-1">
            {villainPosition ? "opener" : "RFI/mixed"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default TableContext;
