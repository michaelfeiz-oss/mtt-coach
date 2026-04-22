import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  POSITIONS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  type SpotGroup,
} from "@shared/strategy";

const ANY_VALUE = "any";
const PLAYER_COUNT = "9";

type SelectValueChange<T> = (value: T | undefined) => void;

interface PreflopSetupControlsProps {
  spotGroup?: SpotGroup;
  stackDepth?: number;
  heroPosition?: string;
  villainPosition?: string;
  availableStacks?: number[];
  heroOptions?: string[];
  villainOptions?: string[];
  onSpotGroupChange: SelectValueChange<SpotGroup>;
  onStackDepthChange: SelectValueChange<number>;
  onHeroPositionChange: SelectValueChange<string>;
  onVillainPositionChange: SelectValueChange<string>;
  className?: string;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function selectClassName(disabled = false) {
  return cn(
    "h-10 w-full rounded-xl border-white/10 bg-white/[0.06] text-xs font-bold text-white shadow-none hover:bg-white/[0.08] focus:ring-orange-400/40",
    disabled && "opacity-50"
  );
}

function displayPosition(position: string) {
  return position === "UTG1" ? "UTG+1" : position;
}

export function PreflopSetupControls({
  spotGroup,
  stackDepth,
  heroPosition,
  villainPosition,
  availableStacks = [...STACK_DEPTHS],
  heroOptions = [...POSITIONS],
  villainOptions = [],
  onSpotGroupChange,
  onStackDepthChange,
  onHeroPositionChange,
  onVillainPositionChange,
  className,
}: PreflopSetupControlsProps) {
  const stackSet = new Set(availableStacks);
  const heroSet = new Set(heroOptions);
  const villainSet = new Set(villainOptions);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Decision">
          <Select
            value={spotGroup ?? ANY_VALUE}
            onValueChange={value =>
              onSpotGroupChange(
                value === ANY_VALUE ? undefined : (value as SpotGroup)
              )
            }
          >
            <SelectTrigger className={selectClassName()}>
              <SelectValue placeholder="Any decision" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value={ANY_VALUE}>Any decision</SelectItem>
              {SPOT_GROUPS.map(group => (
                <SelectItem key={group} value={group}>
                  {SPOT_GROUP_LABELS[group].replace(" (Open Raise)", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Stack">
          <Select
            value={stackDepth?.toString() ?? ANY_VALUE}
            onValueChange={value =>
              onStackDepthChange(value === ANY_VALUE ? undefined : Number(value))
            }
          >
            <SelectTrigger className={selectClassName()}>
              <SelectValue placeholder="Any stack" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value={ANY_VALUE}>Any stack up to 40bb</SelectItem>
              {STACK_DEPTHS.map(depth => (
                <SelectItem
                  key={depth}
                  value={depth.toString()}
                  disabled={stackSet.size > 0 && !stackSet.has(depth)}
                >
                  {depth}bb
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Players">
          <Select value={PLAYER_COUNT}>
            <SelectTrigger className={selectClassName()}>
              <SelectValue placeholder="9 players" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value={PLAYER_COUNT}>9 players</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Hero">
          <Select
            value={heroPosition ?? ANY_VALUE}
            onValueChange={value =>
              onHeroPositionChange(value === ANY_VALUE ? undefined : value)
            }
          >
            <SelectTrigger className={selectClassName()}>
              <SelectValue placeholder="Any hero" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value={ANY_VALUE}>Any hero</SelectItem>
              {POSITIONS.map(position => (
                <SelectItem
                  key={position}
                  value={position}
                  disabled={!heroSet.has(position)}
                >
                  {displayPosition(position)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Opener / Villain">
          <Select
            value={villainPosition ?? ANY_VALUE}
            onValueChange={value =>
              onVillainPositionChange(value === ANY_VALUE ? undefined : value)
            }
            disabled={villainOptions.length === 0}
          >
            <SelectTrigger
              className={selectClassName(villainOptions.length === 0)}
            >
              <SelectValue placeholder="No opener" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value={ANY_VALUE}>Any / no opener</SelectItem>
              {POSITIONS.map(position => (
                <SelectItem
                  key={position}
                  value={position}
                  disabled={!villainSet.has(position)}
                >
                  {displayPosition(position)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

export default PreflopSetupControls;
