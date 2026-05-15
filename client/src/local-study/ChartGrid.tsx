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
  CHECK: "bg-slate-500 text-white border-slate-500",
  THREE_BET: "bg-blue-600 text-white border-blue-600",
  FOUR_BET: "bg-purple-600 text-white border-purple-600",
  BET_SMALL: "bg-sky-500 text-white border-sky-500",
  BET_BIG: "bg-indigo-600 text-white border-indigo-600",
};

export function ActionLegend({ actions }: { actions: ActionToken[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <span
          key={action}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${ACTION_CLASS[action]}`}
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
}: {
  cells: Partial<ChartCells> | null | undefined;
  allowedActions: ActionToken[];
  selectedHands?: string[];
  onToggleHand?: (handCode: string) => void;
  compact?: boolean;
}) {
  const grid = generateHandGrid();
  const selected = new Set(selectedHands);
  const missing = ALL_HANDS.filter(hand => !cells?.[hand]);

  if (!cells || missing.length > 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        This chart is missing {missing.length || ALL_HANDS.length} hands. It will not render as
        Fold. Missing/unseeded spots stay Not yet reviewed.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-slate-100 p-2">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: "repeat(13, minmax(2.25rem, 1fr))",
          minWidth: compact ? "32rem" : "36rem",
        }}
      >
        {grid.flat().map(hand => {
          const action = cells[hand] as ActionToken;
          const isSelected = selected.has(hand);
          const label = ACTION_LABELS[action];
          const cell = (
            <span className="block text-[0.7rem] font-bold leading-none sm:text-xs">{hand}</span>
          );

          if (!onToggleHand) {
            return (
              <div
                key={hand}
                title={`${hand}: ${label}`}
                className={`aspect-square rounded-lg border text-center shadow-sm ${ACTION_CLASS[action]} flex items-center justify-center`}
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
              className={`aspect-square rounded-lg border text-center shadow-sm transition ${ACTION_CLASS[action]} ${
                isSelected ? "ring-4 ring-amber-300 ring-offset-1" : ""
              }`}
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
