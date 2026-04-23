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
  blindAnteLabel?: string;
  embedded?: boolean;
  className?: string;
}

type SeatAnchor = {
  x: number;
  y: number;
};

const SEAT_LAYOUT: Record<string, SeatAnchor> = {
  UTG: { x: 50, y: 8 },
  UTG1: { x: 67, y: 13 },
  MP: { x: 80, y: 27 },
  HJ: { x: 82, y: 48 },
  CO: { x: 71, y: 66 },
  BTN: { x: 50, y: 74 },
  SB: { x: 29, y: 66 },
  BB: { x: 18, y: 48 },
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
    return "border-orange-300/90 bg-orange-500/90 text-white shadow-md shadow-orange-950/30";
  }

  if (position === villainPosition) {
    return "border-sky-300/90 bg-sky-500/85 text-white shadow-md shadow-sky-950/20";
  }

  return "border-white/10 bg-white/[0.03] text-zinc-400";
}

export function TableContext({
  title,
  stackDepth,
  heroPosition,
  villainPosition,
  spotGroup,
  playerCount = 9,
  blindAnteLabel = "BBA",
  embedded = false,
  className,
}: TableContextProps) {
  return (
    <section
      className={cn(
        embedded
          ? "space-y-2.5 text-white"
          : "overflow-hidden rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_11rem),linear-gradient(180deg,#18181b_0%,#09090b_100%)] p-2.5 text-white shadow-xl shadow-black/20 sm:p-3 xl:p-4",
        className
      )}
      aria-label="Trainer table context"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
            Scenario
          </p>
          <h2 className="truncate text-sm font-black tracking-tight text-zinc-100">
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

      <div className="relative mx-auto h-[9.85rem] w-full max-w-md sm:h-[10.35rem]">
        <div className="absolute inset-x-[16%] inset-y-[21%] rounded-[999px] border border-orange-300/25 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_52%),linear-gradient(145deg,rgba(24,24,27,0.95),rgba(39,39,42,0.66))] shadow-inner shadow-black/45" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5 text-center shadow-md shadow-black/20">
          <span className="text-[10px] font-black text-zinc-100">
            {playerCount}P
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span className="text-[10px] font-black text-zinc-100">
            {blindAnteLabel}
          </span>
        </div>

        {POSITIONS.map(position => {
          const anchor = SEAT_LAYOUT[position];
          if (!anchor) return null;

          const isHero = position === heroPosition;
          const isVillain = position === villainPosition;
          const roleLabel = isHero ? "Hero" : isVillain ? "Opener" : null;

          return (
            <div
              key={position}
              style={{
                left: `${anchor.x}%`,
                top: `${anchor.y}%`,
              }}
              className={cn(
                "absolute flex h-9 w-[3.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border text-center text-[9px] font-black leading-tight transition sm:h-10 sm:w-[3.9rem]",
                seatTone(position, heroPosition, villainPosition)
              )}
            >
              <span>{displayPosition(position)}</span>
              {roleLabel && (
                <span
                  className={cn(
                    "mt-0.5 text-[9px] font-bold opacity-85",
                    isHero || isVillain ? "text-white" : "text-zinc-400"
                  )}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <span className="font-black text-zinc-200">
            {heroPosition ? displayPosition(heroPosition) : "Mixed"}
          </span>
          <span className="ml-1">hero</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
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
