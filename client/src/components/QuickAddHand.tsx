import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeHandCode as normalizeCanonicalHandCode } from "@shared/handMatrix";
import { ACTION_LABELS, POSITIONS, type Action } from "@shared/strategy";

const STACK_PRESETS = [15, 20, 25, 40];
const SPOT_TYPES = [
  { value: "SINGLE_RAISED_POT", label: "RFI / Defend" },
  { value: "3BET_POT", label: "3-Bet / vs 3-Bet" },
  { value: "BVB", label: "Blind vs Blind" },
  { value: "LIMPED_POT", label: "Limp Pot" },
] as const;

const ACTIONS: Action[] = [
  "FOLD",
  "CALL",
  "RAISE",
  "THREE_BET",
  "JAM",
  "LIMP",
  "CHECK",
];

interface QuickHandForm {
  spotType: string;
  heroPosition: string;
  heroHand: string;
  effectiveStackBb: string;
  heroDecisionPreflop: Action | "";
  mistakeSeverity: string;
  lesson: string;
}

function normalizeHandCode(value: string) {
  return (
    normalizeCanonicalHandCode(value) ??
    value.trim().replace(/\s+/g, "").toUpperCase()
  );
}

export function QuickAddHand() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<QuickHandForm>({
    spotType: "",
    heroPosition: "",
    heroHand: "",
    effectiveStackBb: "",
    heroDecisionPreflop: "",
    mistakeSeverity: "0",
    lesson: "",
  });

  const createHand = trpc.hands.create.useMutation({
    onSuccess: () => {
      toast.success("Hand logged");
      void utils.hands.getByUser.invalidate();
      void utils.dashboard.getStats.invalidate();
      setOpen(false);
      setFormData({
        spotType: "",
        heroPosition: "",
        heroHand: "",
        effectiveStackBb: "",
        heroDecisionPreflop: "",
        mistakeSeverity: "0",
        lesson: "",
      });
    },
    onError: error => {
      toast.error(`Could not save hand: ${error.message}`);
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const stack = Number.parseFloat(formData.effectiveStackBb);
    if (!formData.spotType || !formData.heroPosition || !formData.heroHand) {
      toast.error("Spot, hero position, and hero hand are required.");
      return;
    }
    if (!Number.isFinite(stack) || stack <= 0 || stack > 40) {
      toast.error("Effective stack must be between 1 and 40bb.");
      return;
    }

    createHand.mutate({
      spotType: formData.spotType as
        | "SINGLE_RAISED_POT"
        | "3BET_POT"
        | "BVB"
        | "LIMPED_POT",
      heroPosition: formData.heroPosition,
      heroHand: normalizeHandCode(formData.heroHand),
      effectiveStackBb: stack,
      heroDecisionPreflop: formData.heroDecisionPreflop || undefined,
      mistakeStreet:
        Number.parseInt(formData.mistakeSeverity, 10) > 0 ? "PREFLOP" : undefined,
      mistakeSeverity: Number.parseInt(formData.mistakeSeverity, 10) || 0,
      lesson: formData.lesson.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-[#FF8A1F]">
          <Plus className="h-4 w-4" />
          Quick Add Hand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Preflop Capture</DialogTitle>
          <DialogDescription>
            Log the decision now. Add detail later in hand review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-spot">Spot Family *</Label>
              <Select
                value={formData.spotType}
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, spotType: value }))
                }
              >
                <SelectTrigger id="quick-spot">
                  <SelectValue placeholder="Select spot" />
                </SelectTrigger>
                <SelectContent>
                  {SPOT_TYPES.map(spot => (
                    <SelectItem key={spot.value} value={spot.value}>
                      {spot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-position">Hero Position *</Label>
              <Select
                value={formData.heroPosition}
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, heroPosition: value }))
                }
              >
                <SelectTrigger id="quick-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(position => (
                    <SelectItem key={position} value={position}>
                      {position === "UTG1" ? "UTG+1" : position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-hero-hand">Hero Hand *</Label>
              <Input
                id="quick-hero-hand"
                placeholder="AKs, QQ, KJo"
                value={formData.heroHand}
                onChange={event =>
                  setFormData(previous => ({
                    ...previous,
                    heroHand: normalizeHandCode(event.target.value),
                  }))
                }
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-stack">Effective Stack (bb) *</Label>
              <Input
                id="quick-stack"
                type="number"
                min="1"
                max="40"
                step="0.5"
                placeholder="20"
                value={formData.effectiveStackBb}
                onChange={event =>
                  setFormData(previous => ({
                    ...previous,
                    effectiveStackBb: event.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-1.5">
                {STACK_PRESETS.map(stack => (
                  <Button
                    key={stack}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full px-2.5 text-[11px]"
                    onClick={() =>
                      setFormData(previous => ({
                        ...previous,
                        effectiveStackBb: String(stack),
                      }))
                    }
                  >
                    {stack}bb
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-action">Hero Decision</Label>
              <Select
                value={formData.heroDecisionPreflop}
                onValueChange={value =>
                  setFormData(previous => ({
                    ...previous,
                    heroDecisionPreflop: value as Action,
                  }))
                }
              >
                <SelectTrigger id="quick-action">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(action => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-severity">Mistake Severity</Label>
              <Select
                value={formData.mistakeSeverity}
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, mistakeSeverity: value }))
                }
              >
                <SelectTrigger id="quick-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No mistake</SelectItem>
                  <SelectItem value="1">Minor (1)</SelectItem>
                  <SelectItem value="2">Moderate (2)</SelectItem>
                  <SelectItem value="3">Major (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-lesson">Lesson / Takeaway</Label>
            <Textarea
              id="quick-lesson"
              rows={3}
              placeholder="One quick takeaway from this hand."
              value={formData.lesson}
              onChange={event =>
                setFormData(previous => ({ ...previous, lesson: event.target.value }))
              }
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tournament preflop capture only - BBA context.
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-[#FF8A1F]"
              disabled={createHand.isPending}
            >
              {createHand.isPending ? "Saving..." : "Save Hand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
