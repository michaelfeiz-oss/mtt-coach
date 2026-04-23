import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { generateHandGrid, RANKS } from "@shared/strategy";
import { normalizeHandNotation } from "@/lib/handNotation";

interface HandPickerProps {
  value: string;
  onChange: (hand: string) => void;
}

const HAND_GRID = generateHandGrid();

function handCellTone(handCode: string) {
  if (handCode.length === 2) return "bg-violet-100 text-violet-800 border-violet-200";
  if (handCode.endsWith("s")) return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

export function HandPicker({ value, onChange }: HandPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const normalizedValue = normalizeHandNotation(value);
  const normalizedSearch = normalizeHandNotation(search);

  const filteredGrid = useMemo(() => {
    if (!normalizedSearch) return HAND_GRID;
    return HAND_GRID.map(row =>
      row.map(handCode =>
        handCode.includes(normalizedSearch) || normalizedSearch.includes(handCode)
          ? handCode
          : ""
      )
    );
  }, [normalizedSearch]);

  function choose(handCode: string) {
    onChange(handCode);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-11 w-full justify-between rounded-xl px-3"
      >
        <span>{normalizedValue || "Choose hand"}</span>
        <span className="text-xs text-muted-foreground">Matrix</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] w-[calc(100vw-1rem)] max-w-3xl overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b border-border bg-accent/60 px-4 py-3 text-left">
            <DialogTitle className="text-lg">Select Hero Hand</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Pick from the 13x13 preflop grid or search with shorthand like AKs.
            </p>
          </DialogHeader>

          <div className="space-y-3 px-4 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search hand class (AKs, QQ, JTo)"
                className="pl-9"
              />
            </div>

            <div className="max-h-[58dvh] overflow-auto rounded-xl border border-border bg-card p-2">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${RANKS.length}, minmax(0, 1fr))` }}
              >
                {filteredGrid.flat().map((handCode, index) => {
                  if (!handCode) {
                    return (
                      <span
                        key={`empty-${index}`}
                        className="h-8 rounded-md border border-transparent bg-transparent"
                      />
                    );
                  }

                  const selected = normalizedValue === handCode;
                  return (
                    <button
                      key={handCode}
                      type="button"
                      onClick={() => choose(handCode)}
                      className={cn(
                        "h-8 rounded-md border text-[11px] font-semibold transition",
                        handCellTone(handCode),
                        selected &&
                          "border-primary bg-primary text-primary-foreground shadow-sm"
                      )}
                    >
                      {handCode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Pair: violet • Suited: blue • Offsuit: amber
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

