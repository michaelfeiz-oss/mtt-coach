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
  displayPositionLabel,
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
  compact?: boolean;
  className?: string;
}

function Field({
  label,
  compact = false,
  children,
}: {
  label: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cn("min-w-0", compact ? "space-y-0.5" : "space-y-1")}>
      <span
        className={cn(
          "block font-semibold text-muted-foreground",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function selectClassName(disabled = false, compact = false) {
  return cn(
    compact
      ? "h-8 w-full rounded-lg border-border/80 bg-input/90 px-2 text-[11.5px] font-semibold text-foreground shadow-none hover:bg-input focus:ring-ring/35"
      : "h-9 w-full rounded-lg border-border/80 bg-input/90 px-2.5 text-[12px] font-semibold text-foreground shadow-none hover:bg-input focus:ring-ring/35",
    disabled && "opacity-50"
  );
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
  compact = false,
  className,
}: PreflopSetupControlsProps) {
  const stackSet = new Set(availableStacks);
  const heroSet = new Set(heroOptions);
  const villainSet = new Set(villainOptions);

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2", className)}>
      <div
        className={cn(
          "grid sm:grid-cols-2",
          compact ? "gap-1.5 lg:grid-cols-5" : "gap-2 xl:grid-cols-5"
        )}
      >
        <Field label="Decision" compact={compact}>
          <Select
            value={spotGroup ?? ANY_VALUE}
            onValueChange={value =>
              onSpotGroupChange(
                value === ANY_VALUE ? undefined : (value as SpotGroup)
              )
            }
          >
            <SelectTrigger className={selectClassName(false, compact)}>
              <SelectValue placeholder="Any decision" />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={ANY_VALUE}>Any decision</SelectItem>
              {SPOT_GROUPS.map(group => (
                <SelectItem key={group} value={group}>
                  {SPOT_GROUP_LABELS[group].replace(" (Open Raise)", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Stack" compact={compact}>
          <Select
            value={stackDepth?.toString() ?? ANY_VALUE}
            onValueChange={value =>
              onStackDepthChange(
                value === ANY_VALUE ? undefined : Number(value)
              )
            }
          >
            <SelectTrigger className={selectClassName(false, compact)}>
              <SelectValue placeholder="Any stack" />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={ANY_VALUE}>Any source-backed stack</SelectItem>
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

        <Field label="Players" compact={compact}>
          <Select value={PLAYER_COUNT}>
            <SelectTrigger className={selectClassName(false, compact)}>
              <SelectValue placeholder="9 players" />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={PLAYER_COUNT}>9 players</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Hero" compact={compact}>
          <Select
            value={heroPosition ?? ANY_VALUE}
            onValueChange={value =>
              onHeroPositionChange(value === ANY_VALUE ? undefined : value)
            }
          >
            <SelectTrigger className={selectClassName(false, compact)}>
              <SelectValue placeholder="Any hero" />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={ANY_VALUE}>Any hero</SelectItem>
              {POSITIONS.map(position => (
                <SelectItem
                  key={position}
                  value={position}
                  disabled={!heroSet.has(position)}
                >
                  {displayPositionLabel(position)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Opener / Villain" compact={compact}>
          <Select
            value={villainPosition ?? ANY_VALUE}
            onValueChange={value =>
              onVillainPositionChange(value === ANY_VALUE ? undefined : value)
            }
            disabled={villainOptions.length === 0}
          >
            <SelectTrigger
              className={selectClassName(villainOptions.length === 0, compact)}
            >
              <SelectValue placeholder="No opener" />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={ANY_VALUE}>Any / no opener</SelectItem>
              {POSITIONS.map(position => (
                <SelectItem
                  key={position}
                  value={position}
                  disabled={!villainSet.has(position)}
                >
                  {displayPositionLabel(position)}
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
