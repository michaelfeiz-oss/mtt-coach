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
    return "border-orange-300/70 bg-orange-500/80 text-white shadow-sm shadow-black/25";
  }

  if (position === villainPosition) {
    return "border-sky-300/70 bg-sky-500/75 text-white shadow-sm shadow-black/20";
  }

  return "border-border/75 bg-accent/55 text-muted-foreground";
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
          ? "space-y-2.5 text-foreground"
          : "overflow-hidden rounded-[1.2rem] border border-border/80 bg-card/92 p-2.5 text-foreground shadow-[0_10px_28px_rgba(0,0,0,0.24)] sm:p-3 xl:p-4",
        className
      )}
      aria-label="Trainer table context"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Scenario
          </p>
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
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
            <Badge className="rounded-full border-border/80 bg-accent/55 text-secondary-foreground">
              {SPOT_GROUP_LABELS[spotGroup].replace(" (Open Raise)", "")}
            </Badge>
          )}
        </div>
      </div>

      <div className="relative mx-auto h-[9.85rem] w-full max-w-md sm:h-[10.35rem]">
        <div className="absolute inset-x-[16%] inset-y-[21%] rounded-[999px] border border-border/80 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_56%),linear-gradient(145deg,#121922,#171f29)] shadow-inner shadow-black/45" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-xl border border-border/70 bg-accent/70 px-2.5 py-1.5 text-center shadow-sm shadow-black/20">
          <span className="text-[10px] font-semibold text-foreground">
            {playerCount}P
          </span>
          <span className="h-3 w-px bg-border/70" />
          <span className="text-[10px] font-semibold text-foreground">
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
                    isHero || isVillain ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div className="rounded-lg border border-border/70 bg-accent/50 px-2.5 py-1.5">
          <span className="font-semibold text-foreground">
            {heroPosition ? displayPosition(heroPosition) : "Mixed"}
          </span>
          <span className="ml-1">hero</span>
        </div>
        <div className="rounded-lg border border-border/70 bg-accent/50 px-2.5 py-1.5">
          <span className="font-semibold text-foreground">
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
