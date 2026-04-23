import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { HandPicker } from "../HandPicker";
import type { StreetAction, SizeBucket } from "./PlayerActionsForm";
import type { VillainRangeType, VillainType } from "./VillainProfileForm";
import type { GameType, TournamentPhase } from "./ContextForm";
import type { HandResult } from "./OutcomeForm";
import {
  buildStreetDataJson,
  deriveHeroDecision,
  mapUiSpotTypeToDb,
} from "./utils";
import { normalizeHandNotation, isValidHandNotation } from "@/lib/handNotation";
import {
  PREFLOP_SCENARIOS,
  type PreflopScenarioId,
} from "@shared/preflopScenarios";

interface LogHandModalV2_1Props {
  isOpen: boolean;
  onClose: () => void;
}

type EntryMode = "QUICK" | "FULL";
type HeroActionType = NonNullable<StreetAction["heroAction"]>["type"];
type VillainActionType = NonNullable<StreetAction["villainAction"]>["type"];

const STACK_PRESETS = ["15", "20", "25", "40"];
const POSITIONS = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
const HERO_ACTIONS: HeroActionType[] = ["FOLD", "CALL", "RAISE", "JAM"];
const VILLAIN_ACTIONS: VillainActionType[] = ["RAISE", "JAM"];
const SIZE_BUCKETS: SizeBucket[] = ["SMALL", "MEDIUM", "BIG"];
const TAG_OPTIONS = [
  "RFI",
  "DEFEND",
  "3BET",
  "FACING_3BET",
  "BVB",
  "JAM_SPOT",
];
const VILLAIN_TYPES: Array<{ id: VillainType; label: string }> = [
  { id: "UNKNOWN", label: "Unknown" },
  { id: "REC", label: "Recreational" },
  { id: "GOOD_REG", label: "Good reg" },
  { id: "AGGRO_REG", label: "Aggro reg" },
  { id: "NIT", label: "Nit" },
];
const RANGE_TYPES: Array<{ id: VillainRangeType; label: string }> = [
  { id: "WIDE", label: "Wide" },
  { id: "STANDARD", label: "Standard" },
  { id: "TIGHT", label: "Tight" },
  { id: "NUTS_WEIGHTED", label: "Nuts weighted" },
];
const RESULTS: Array<{ id: HandResult; label: string }> = [
  { id: "WON", label: "Won" },
  { id: "LOST", label: "Lost" },
  { id: "CHOPPED", label: "Chopped" },
  { id: "UNKNOWN", label: "Unknown" },
];
const GAME_TYPES: Array<{ id: GameType; label: string }> = [
  { id: "LIVE", label: "Live" },
  { id: "ONLINE", label: "Online" },
];
const PHASES: Array<{ id: TournamentPhase; label: string }> = [
  { id: "EARLY", label: "Early" },
  { id: "MID", label: "Mid" },
  { id: "LATE", label: "Late" },
  { id: "BUBBLE", label: "Bubble" },
  { id: "ITM", label: "ITM" },
  { id: "FINAL_TABLE", label: "Final table" },
];

function needsSize(action?: HeroActionType | VillainActionType) {
  return action === "RAISE";
}

function ChipButton({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary/12 text-primary"
          : "border-border bg-card text-secondary-foreground hover:bg-accent/80",
        className
      )}
    >
      {children}
    </button>
  );
}

export function LogHandModalV2_1({ isOpen, onClose }: LogHandModalV2_1Props) {
  const [entryMode, setEntryMode] = useState<EntryMode>("QUICK");
  const [showOptional, setShowOptional] = useState(false);

  const [scenarioId, setScenarioId] = useState<PreflopScenarioId>("OPEN_RFI");
  const [heroHand, setHeroHand] = useState("");
  const [effectiveStackBb, setEffectiveStackBb] = useState("20");
  const [heroPosition, setHeroPosition] = useState("");
  const [openerPosition, setOpenerPosition] = useState("");
  const [heroDecision, setHeroDecision] = useState<HeroActionType | "">("");
  const [heroSizeBucket, setHeroSizeBucket] = useState<SizeBucket>("MEDIUM");
  const [villainAction, setVillainAction] = useState<VillainActionType | "">("");
  const [villainSizeBucket, setVillainSizeBucket] = useState<SizeBucket>("MEDIUM");
  const [villainType, setVillainType] = useState<VillainType | "">("");
  const [villainRangeType, setVillainRangeType] =
    useState<VillainRangeType | "">("");
  const [confidence, setConfidence] = useState("MEDIUM");
  const [reviewed, setReviewed] = useState(false);
  const [mistakeSeverity, setMistakeSeverity] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<HandResult | "">("");
  const [gameType, setGameType] = useState<GameType | "">("");
  const [tournamentPhase, setTournamentPhase] =
    useState<TournamentPhase | "">("");
  const [isPko, setIsPko] = useState(false);

  const utils = trpc.useUtils();
  const createHand = trpc.hands.create.useMutation({
    onSuccess: async () => {
      toast.success("Hand saved to review queue");
      await utils.hands.getByUser.invalidate();
      resetForm();
      onClose();
    },
    onError: error => {
      toast.error(`Error saving hand: ${error.message}`);
    },
  });

  const normalizedHand = normalizeHandNotation(heroHand);
  const stackNumber = Number.parseFloat(effectiveStackBb);
  const isStackValid =
    Number.isFinite(stackNumber) && stackNumber > 0 && stackNumber <= 40;
  const selectedScenario = useMemo(
    () => PREFLOP_SCENARIOS.find(item => item.id === scenarioId),
    [scenarioId]
  );
  const spotType = selectedScenario?.uiSpotType;

  const isFormValid = Boolean(
    selectedScenario &&
      heroPosition &&
      heroDecision &&
      isStackValid &&
      isValidHandNotation(normalizedHand)
  );

  function resetForm() {
    setEntryMode("QUICK");
    setShowOptional(false);
    setScenarioId("OPEN_RFI");
    setHeroHand("");
    setEffectiveStackBb("20");
    setHeroPosition("");
    setOpenerPosition("");
    setHeroDecision("");
    setHeroSizeBucket("MEDIUM");
    setVillainAction("");
    setVillainSizeBucket("MEDIUM");
    setVillainType("");
    setVillainRangeType("");
    setConfidence("MEDIUM");
    setReviewed(false);
    setMistakeSeverity(0);
    setTags([]);
    setNote("");
    setResult("");
    setGameType("");
    setTournamentPhase("");
    setIsPko(false);
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  function handleSave() {
    if (!isFormValid || !spotType || !heroDecision || !selectedScenario) {
      toast.error("Fill spot, hand, stack, position, and hero decision first.");
      return;
    }

    const streetAction: StreetAction = {
      street: "PREFLOP",
      heroAction: {
        type: heroDecision,
        sizeBucket: needsSize(heroDecision) ? heroSizeBucket : undefined,
      },
      villainAction: villainAction
        ? {
            type: villainAction,
            sizeBucket: needsSize(villainAction) ? villainSizeBucket : undefined,
          }
        : undefined,
    };

    const streetDataJson = buildStreetDataJson({
      spotType,
      heroPosition,
      heroHand: normalizedHand,
      effectiveStackBb: stackNumber,
      streetAction,
      villainType,
      villainRangeType,
      result,
      evLossBb: mistakeSeverity,
      notes: note.trim(),
    });

    if (streetDataJson.meta) {
      streetDataJson.meta.context = {
        openerPosition: openerPosition || undefined,
        confidence,
        gameType: gameType || undefined,
        tournamentPhase: tournamentPhase || undefined,
        isPko,
        entryMode,
      };
    }

    createHand.mutate({
      heroPosition,
      heroHand: normalizedHand,
      effectiveStackBb: stackNumber,
      spotType: mapUiSpotTypeToDb(spotType),
      streetDataJson: JSON.stringify(streetDataJson),
      reviewed: entryMode === "FULL" ? reviewed : false,
      mistakeStreet: mistakeSeverity > 0 ? "PREFLOP" : undefined,
      mistakeSeverity,
      tags: tags.length > 0 ? tags : undefined,
      lesson: note.trim() || undefined,
      heroDecisionPreflop: deriveHeroDecision(streetAction),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeModal()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col overflow-hidden rounded-2xl p-0"
      >
        <DialogHeader className="border-b border-border bg-accent/50 p-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-eyebrow mb-2">Quick Hand Capture</p>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Log a Hand
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Required first. Optional details can be added now or later.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={closeModal}
              aria-label="Close hand entry"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
            {(["QUICK", "FULL"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setEntryMode(mode)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-semibold transition",
                  entryMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                )}
              >
                {mode === "QUICK" ? "Quick Log" : "Full Review"}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-4">
              <section className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">Required details</h3>
                  <Badge variant="outline">15-30 sec</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Spot Type
                    </Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PREFLOP_SCENARIOS.map(option => (
                        <ChipButton
                          key={option.id}
                          active={scenarioId === option.id}
                          onClick={() => setScenarioId(option.id)}
                        >
                          <span className="block text-left text-[11px] font-semibold">
                            {option.label}
                          </span>
                        </ChipButton>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Hero Hand
                      </Label>
                      <div className="mt-2 space-y-2">
                        <HandPicker
                          value={normalizedHand}
                          onChange={value => setHeroHand(value)}
                        />
                        <Input
                          value={heroHand}
                          onChange={event => setHeroHand(event.target.value)}
                          placeholder="AKs, QQ, AhKh"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Effective Stack (bb)
                      </Label>
                      <div className="mt-2 space-y-2">
                        <Input
                          value={effectiveStackBb}
                          type="number"
                          min={1}
                          max={40}
                          onChange={event => setEffectiveStackBb(event.target.value)}
                          placeholder="20"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {STACK_PRESETS.map(stack => (
                            <ChipButton
                              key={stack}
                              active={effectiveStackBb === stack}
                              onClick={() => setEffectiveStackBb(stack)}
                              className="px-2.5 py-1"
                            >
                              {stack}bb
                            </ChipButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Hero Position
                      </Label>
                      <Select value={heroPosition} onValueChange={setHeroPosition}>
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue placeholder="Select hero position" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Opener / Villain (optional)
                      </Label>
                      <Select
                        value={openerPosition || "NONE"}
                        onValueChange={value =>
                          setOpenerPosition(value === "NONE" ? "" : value)
                        }
                      >
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue placeholder="No opener" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">No opener</SelectItem>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Hero Decision
                    </Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {HERO_ACTIONS.map(action => (
                        <ChipButton
                          key={action}
                          active={heroDecision === action}
                          onClick={() => setHeroDecision(action)}
                          className="text-center"
                        >
                          {action}
                        </ChipButton>
                      ))}
                    </div>
                    {needsSize(heroDecision || undefined) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {SIZE_BUCKETS.map(size => (
                          <ChipButton
                            key={size}
                            active={heroSizeBucket === size}
                            onClick={() => setHeroSizeBucket(size)}
                            className="px-2.5 py-1"
                          >
                            {size}
                          </ChipButton>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setShowOptional(current => !current)}
                >
                  <div>
                    <h3 className="text-base font-semibold">Optional details</h3>
                    <p className="text-xs text-muted-foreground">
                      Add reads, confidence, and deeper review context.
                    </p>
                  </div>
                  {showOptional ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {showOptional && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Villain Action
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {VILLAIN_ACTIONS.map(action => (
                            <ChipButton
                              key={action}
                              active={villainAction === action}
                              onClick={() => setVillainAction(action)}
                              className="px-2.5 py-1"
                            >
                              {action}
                            </ChipButton>
                          ))}
                        </div>
                        {needsSize(villainAction || undefined) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {SIZE_BUCKETS.map(size => (
                              <ChipButton
                                key={size}
                                active={villainSizeBucket === size}
                                onClick={() => setVillainSizeBucket(size)}
                                className="px-2.5 py-1"
                              >
                                {size}
                              </ChipButton>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Villain Type
                          </Label>
                          <Select
                            value={villainType || "NONE"}
                            onValueChange={value =>
                              setVillainType(value === "NONE" ? "" : (value as VillainType))
                            }
                          >
                            <SelectTrigger className="mt-2 w-full">
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Not set</SelectItem>
                              {VILLAIN_TYPES.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Range Read
                          </Label>
                          <Select
                            value={villainRangeType || "NONE"}
                            onValueChange={value =>
                              setVillainRangeType(
                                value === "NONE" ? "" : (value as VillainRangeType)
                              )
                            }
                          >
                            <SelectTrigger className="mt-2 w-full">
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Not set</SelectItem>
                              {RANGE_TYPES.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Confidence
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {["LOW", "MEDIUM", "HIGH"].map(level => (
                            <ChipButton
                              key={level}
                              active={confidence === level}
                              onClick={() => setConfidence(level)}
                              className="px-2.5 py-1"
                            >
                              {level}
                            </ChipButton>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Mistake Severity
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {[0, 1, 2, 3].map(level => (
                            <ChipButton
                              key={level}
                              active={mistakeSeverity === level}
                              onClick={() => setMistakeSeverity(level)}
                              className="px-2.5 py-1"
                            >
                              {level === 0 ? "None" : `Level ${level}`}
                            </ChipButton>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Tags
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {TAG_OPTIONS.map(tag => (
                          <ChipButton
                            key={tag}
                            active={tags.includes(tag)}
                            onClick={() =>
                              setTags(previous =>
                                previous.includes(tag)
                                  ? previous.filter(existing => existing !== tag)
                                  : [...previous, tag]
                              )
                            }
                            className="px-2.5 py-1"
                          >
                            {tag.replace(/_/g, " ")}
                          </ChipButton>
                        ))}
                      </div>
                    </div>

                    {entryMode === "FULL" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Result
                          </Label>
                          <Select
                            value={result || "NONE"}
                            onValueChange={value =>
                              setResult(value === "NONE" ? "" : (value as HandResult))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Not set</SelectItem>
                              {RESULTS.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Game Type
                          </Label>
                          <Select
                            value={gameType || "NONE"}
                            onValueChange={value =>
                              setGameType(value === "NONE" ? "" : (value as GameType))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Not set</SelectItem>
                              {GAME_TYPES.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Tournament Phase
                          </Label>
                          <Select
                            value={tournamentPhase || "NONE"}
                            onValueChange={value =>
                              setTournamentPhase(
                                value === "NONE" ? "" : (value as TournamentPhase)
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Not set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Not set</SelectItem>
                              {PHASES.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Review Status
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            <ChipButton
                              active={!reviewed}
                              onClick={() => setReviewed(false)}
                              className="px-2.5 py-1"
                            >
                              Needs Review
                            </ChipButton>
                            <ChipButton
                              active={reviewed}
                              onClick={() => setReviewed(true)}
                              className="px-2.5 py-1"
                            >
                              Reviewed
                            </ChipButton>
                            <ChipButton
                              active={isPko}
                              onClick={() => setIsPko(current => !current)}
                              className="px-2.5 py-1"
                            >
                              PKO
                            </ChipButton>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label
                        htmlFor="quick-note"
                        className="text-xs font-semibold text-muted-foreground"
                      >
                        Quick Note
                      </Label>
                      <Textarea
                        id="quick-note"
                        value={note}
                        onChange={event => setNote(event.target.value.slice(0, 300))}
                        placeholder="Short takeaway or reminder for review."
                        className="mt-2 min-h-20"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-3">
              <div className="rounded-xl border border-border bg-accent/60 p-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Live Summary
                </p>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Spot:</span>{" "}
                    <span className="font-semibold">
                      {selectedScenario?.label ?? "Not set"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Hand:</span>{" "}
                    <span className="font-semibold">{normalizedHand || "-"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Position:</span>{" "}
                    <span className="font-semibold">{heroPosition || "-"}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Stack:</span>{" "}
                    <span className="font-semibold">
                      {isStackValid ? `${stackNumber}bb` : "-"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Action:</span>{" "}
                    <span className="font-semibold">{heroDecision || "-"}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Required fields are always visible. Optional detail is collapsed so
                quick capture stays fast.
              </p>
            </aside>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-accent/40 p-4">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid || createHand.isPending}
            className="min-w-44 rounded-xl"
          >
            {createHand.isPending
              ? "Saving..."
              : entryMode === "QUICK"
                ? "Save to Review Queue"
                : "Save Full Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
