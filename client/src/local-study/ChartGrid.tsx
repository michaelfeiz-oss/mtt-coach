import {
  ACTION_LABELS,
  ACTION_TOKENS,
  ALL_HANDS,
  generateHandGrid,
  type ActionToken,
  type ChartCells,
} from "@shared/strategy-v2/model";

const ACTION_CLASS: Record<ActionToken, string> = {
  FOLD: "bg-slate-200 text-slate-600 border-slate-300",
  RAISE: "bg-orange-600 text-white border-orange-600",
  JAM: "bg-orange-700 text-white border-orange-700",
  LIMP: "bg-amber-200 text-amber-950 border-amber-300",
  CALL: "bg-emerald-600 text-white border-emerald-600",
  CALL_JAM: "bg-rose-600 text-white border-rose-600",
  CHECK: "bg-slate-500 text-white border-slate-500",
  THREE_BET: "bg-blue-600 text-white border-blue-600",
  FOUR_BET: "bg-purple-600 text-white border-purple-600",
  BET_SMALL: "bg-sky-500 text-white border-sky-500",
  BET_BIG: "bg-indigo-600 text-white border-indigo-600",
};

export function ActionLegend({
  actions,
  density = "comfortable",
}: {
  actions: ActionToken[];
  density?: "comfortable" | "compact";
}) {
  const compact = density === "compact";
  return (
    <div className={`flex w-fit flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {actions.map(action => (
        <span
          key={action}
          className={`inline-flex items-center gap-1 rounded-full border font-semibold ${ACTION_CLASS[action]} ${
            compact ? "px-2 py-0.5 text-[0.68rem]" : "px-2.5 py-1 text-xs"
          }`}
        >
          {ACTION_LABELS[action]}
        </span>
      ))}
    </div>
  );
}

export function ChartGrid({
  cells,
  allowedActions,
  selectedHands = [],
  onToggleHand,
  compact = false,
  density,
  wrap = false,
  fixedCellSizePx,
  highlightedHand,
  highlightTone = "neutral",
}: {
  cells: Partial<ChartCells> | null | undefined;
  allowedActions: ActionToken[];
  selectedHands?: string[];
  onToggleHand?: (handCode: string) => void;
  compact?: boolean;
  density?: "comfortable" | "compact";
  wrap?: boolean;
  fixedCellSizePx?: number;
  highlightedHand?: string;
  highlightTone?: "correct" | "wrong" | "neutral";
}) {
  const grid = generateHandGrid();
  const selected = new Set(selectedHands);
  const missing = ALL_HANDS.filter(hand => !cells?.[hand]);
  const isCompact = density === "compact" || compact;

  if (!cells || missing.length > 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        This chart is missing {missing.length || ALL_HANDS.length} hands. It will not render as
        Fold. Missing/unseeded spots stay Not yet reviewed.
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto bg-slate-100 ${isCompact ? "rounded-xl p-1" : "rounded-2xl p-2"} ${
        wrap ? "w-fit max-w-full" : "w-full"
      }`}
    >
      <div
        className={`mx-auto grid w-max ${isCompact ? "gap-0.5" : "gap-1"}`}
        style={{
          gridTemplateColumns: fixedCellSizePx
            ? `repeat(13, ${fixedCellSizePx}px)`
            : isCompact
            ? "repeat(13, clamp(1.85rem, 2.6vw, 2.05rem))"
            : "repeat(13, minmax(2.25rem, 1fr))",
          minWidth: isCompact ? undefined : "36rem",
        }}
      >
        {grid.flat().map(hand => {
          const action = cells[hand] as ActionToken;
          const isSelected = selected.has(hand);
          const isHighlighted = highlightedHand === hand;
          const label = ACTION_LABELS[action];
          const cell = <span className={`block font-bold leading-none ${isCompact ? "text-[0.64rem]" : "text-[0.7rem] sm:text-xs"}`}>{hand}</span>;
          const highlightClass = isHighlighted
            ? highlightTone === "correct"
              ? "ring-4 ring-emerald-300 ring-offset-2"
              : highlightTone === "wrong"
                ? "ring-4 ring-red-300 ring-offset-2"
                : "ring-4 ring-orange-300 ring-offset-2"
            : "";

          if (!onToggleHand) {
            return (
              <div
                key={hand}
                title={`${hand}: ${label}`}
                className={`aspect-square border text-center shadow-sm ${ACTION_CLASS[action]} flex items-center justify-center ${
                  isCompact ? "rounded-md" : "rounded-lg"
                } ${highlightClass}`}
              >
                {cell}
              </div>
            );
          }

          return (
            <button
              key={hand}
              type="button"
              title={`${hand}: ${label}`}
              aria-pressed={isSelected}
              onClick={() => onToggleHand(hand)}
              className={`aspect-square border text-center shadow-sm transition ${ACTION_CLASS[action]} ${
                isCompact ? "rounded-md" : "rounded-lg"
              } ${
                isSelected ? "ring-4 ring-amber-300 ring-offset-1" : ""
              } ${highlightClass}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      {allowedActions.some(action => !ACTION_TOKENS.includes(action)) ? (
        <p className="mt-2 text-sm text-red-700">Unknown action token detected.</p>
      ) : null}
    </div>
  );
}
