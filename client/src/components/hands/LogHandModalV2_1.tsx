import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { HandPicker } from "../HandPicker";
import type { SpotType } from "./SpotTypeSelector";
import type { StreetAction, SizeBucket } from "./PlayerActionsForm";
import type { VillainRangeType, VillainType } from "./VillainProfileForm";
import type { GameType, TournamentPhase } from "./ContextForm";
import type { HandResult } from "./OutcomeForm";
import {
  buildStreetDataJson,
  deriveHeroDecision,
  extractSpotPosition,
  extractSpotSubtype,
  mapUiSpotTypeToDb,
} from "./utils";

interface LogHandModalV2_1Props {
  isOpen: boolean;
  onClose: () => void;
}

type EntryMode = "QUICK" | "FULL";
type StepIndex = 0 | 1 | 2 | 3;
type HeroActionType = NonNullable<StreetAction["heroAction"]>["type"];
type VillainActionType = NonNullable<StreetAction["villainAction"]>["type"];

const STEPS = ["Context", "Action", "Review", "Save"] as const;

const SPOT_OPTIONS: Array<{
  id: SpotType;
  label: string;
  helper: string;
}> = [
  {
    id: "SINGLE_RAISED_POT_IP",
    label: "RFI / Open",
    helper: "Open or continue before the flop",
  },
  {
    id: "SINGLE_RAISED_POT_OOP",
    label: "Defend vs RFI",
    helper: "Blind or position defend",
  },
  { id: "THREE_BET_POT_IP", label: "3-Bet", helper: "Apply preflop pressure" },
  { id: "THREE_BET_POT_OOP", label: "Facing 3-Bet", helper: "Continue, fold, or jam" },
  { id: "BLINDS_VS_BLIND", label: "BvB", helper: "Blind versus blind" },
  { id: "LIMPED_POT", label: "Limp", helper: "Limp or iso spot" },
  { id: "FOUR_BET_POT", label: "4-Bet / Jam", helper: "High-pressure preflop spot" },
];

const POSITIONS = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
const STACK_PRESETS = ["15", "20", "25", "40"];
const STREETS: StreetAction["street"][] = ["PREFLOP"];
const HERO_ACTIONS: HeroActionType[] = [
  "CALL",
  "RAISE",
  "JAM",
  "FOLD",
];
const VILLAIN_ACTIONS: VillainActionType[] = ["RAISE", "JAM"];
const SIZE_BUCKETS: SizeBucket[] = ["SMALL", "MEDIUM", "BIG"];
const VILLAIN_TYPES: Array<{ id: VillainType; label: string }> = [
  { id: "UNKNOWN", label: "Unknown" },
  { id: "REC", label: "Rec" },
  { id: "GOOD_REG", label: "Good reg" },
  { id: "AGGRO_REG", label: "Aggro" },
  { id: "NIT", label: "Nit" },
  { id: "MANIAC", label: "Maniac" },
];
const RANGE_TYPES: Array<{ id: VillainRangeType; label: string }> = [
  { id: "WIDE", label: "Wide" },
  { id: "STANDARD", label: "Standard" },
  { id: "TIGHT", label: "Tight" },
  { id: "NUTS_WEIGHTED", label: "Nuts-heavy" },
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
const TAG_OPTIONS = [
  "PREFLOP",
  "BLIND_DEFENSE",
  "3BET_POT",
  "OVERFOLD",
  "SPEW",
];

function needsSize(action?: HeroActionType | VillainActionType) {
  return action === "BET" || action === "RAISE";
}

function normalizeHandInput(value: string) {
  const clean = value.trim().replace(/\s+/g, "");

  if (clean.length === 3) {
    return `${clean.slice(0, 2).toUpperCase()}${clean[2].toLowerCase()}`;
  }

  if (clean.length === 4) {
    return `${clean[0].toUpperCase()}${clean[1].toLowerCase()}${clean[2].toUpperCase()}${clean[3].toLowerCase()}`;
  }

  return clean.toUpperCase();
}

function ChipButton({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition active:scale-[0.99]",
        active
          ? "border-primary/55 bg-primary/15 text-foreground shadow-sm shadow-black/20"
          : "border-border/80 bg-accent/45 text-secondary-foreground hover:border-border hover:bg-accent/70",
        className
      )}
    >
      {children}
    </button>
  );
}

function StepIndicator({ currentStep }: { currentStep: StepIndex }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {STEPS.map((step, index) => {
        const active = index === currentStep;
        const done = index < currentStep;

        return (
          <div
            key={step}
          className={cn(
              "rounded-full border px-2 py-1.5 text-center text-[10px] font-semibold tracking-[0.06em]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : done
                  ? "border-border bg-accent/70 text-foreground"
                  : "border-border/80 bg-accent/45 text-muted-foreground"
            )}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/80 bg-accent/45 px-3 py-2.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

export function LogHandModalV2_1({ isOpen, onClose }: LogHandModalV2_1Props) {
  const [entryMode, setEntryMode] = useState<EntryMode>("QUICK");
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);

  const [spotType, setSpotType] = useState<SpotType | "">("");
  const [heroPosition, setHeroPosition] = useState("");
  const [heroHand, setHeroHand] = useState("");
  const [effectiveStackBb, setEffectiveStackBb] = useState("");

  const [streetAction, setStreetAction] = useState<StreetAction | null>({
    street: "PREFLOP",
  });
  const [boardRunout, setBoardRunout] = useState("");
  const [showActionDetails, setShowActionDetails] = useState(false);

  const [villainType, setVillainType] = useState<VillainType | "">("");
  const [villainRangeType, setVillainRangeType] =
    useState<VillainRangeType | "">("");
  const [gameType, setGameType] = useState<GameType | "">("");
  const [tournamentPhase, setTournamentPhase] =
    useState<TournamentPhase | "">("");
  const [isPko, setIsPko] = useState(false);

  const [reviewed, setReviewed] = useState(false);
  const [mistakeStreet, setMistakeStreet] =
    useState<StreetAction["street"]>("PREFLOP");
  const [mistakeSeverity, setMistakeSeverity] = useState(0);
  const [result, setResult] = useState<HandResult | "">("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const createHand = trpc.hands.create.useMutation({
    onSuccess: async () => {
      toast.success("Hand saved");
      await utils.hands.getByUser.invalidate();
      resetForm();
      onClose();
    },
    onError: error => {
      toast.error(`Error saving hand: ${error.message}`);
    },
  });

  const stackNumber = Number.parseFloat(effectiveStackBb);
  const isStackValid =
    Number.isFinite(stackNumber) && stackNumber > 0 && stackNumber <= 40;
  const isContextValid = Boolean(
    spotType && heroPosition && heroHand && isStackValid
  );
  const isActionValid = Boolean(streetAction?.street && streetAction.heroAction);
  const canAdvance =
    currentStep === 0 ? isContextValid : currentStep === 1 ? isActionValid : true;
  const isValid = isContextValid && isActionValid;
  const fullDetailsVisible = entryMode === "FULL" || showActionDetails;

  const selectedSpotLabel = useMemo(
    () => SPOT_OPTIONS.find(option => option.id === spotType)?.label ?? "Not set",
    [spotType]
  );

  function resetForm() {
    setEntryMode("QUICK");
    setCurrentStep(0);
    setSpotType("");
    setHeroPosition("");
    setHeroHand("");
    setEffectiveStackBb("");
    setStreetAction({ street: "PREFLOP" });
    setBoardRunout("");
    setShowActionDetails(false);
    setVillainType("");
    setVillainRangeType("");
    setGameType("");
    setTournamentPhase("");
    setIsPko(false);
    setReviewed(false);
    setMistakeStreet("PREFLOP");
    setMistakeSeverity(0);
    setResult("");
    setSelectedTags([]);
    setNotes("");
  }

  function closeModal() {
    resetForm();
    onClose();
  }

  function updateStreet(street: StreetAction["street"]) {
    setStreetAction(previous => ({
      street,
      villainAction: previous?.villainAction,
      heroAction: previous?.heroAction,
    }));
    setMistakeStreet(street);
  }

  function updateHeroAction(action: HeroActionType) {
    setStreetAction(previous => ({
      street: previous?.street ?? "PREFLOP",
      villainAction: previous?.villainAction,
      heroAction: {
        type: action,
        sizeBucket: needsSize(action) ? "MEDIUM" : undefined,
      },
    }));
  }

  function updateHeroSize(sizeBucket: SizeBucket) {
    setStreetAction(previous => {
      if (!previous?.heroAction) return previous;
      return {
        ...previous,
        heroAction: {
          ...previous.heroAction,
          sizeBucket,
        },
      };
    });
  }

  function updateVillainAction(action: VillainActionType) {
    setStreetAction(previous => ({
      street: previous?.street ?? "PREFLOP",
      heroAction: previous?.heroAction,
      villainAction: {
        type: action,
        sizeBucket: needsSize(action) ? "MEDIUM" : undefined,
      },
    }));
  }

  function updateVillainSize(sizeBucket: SizeBucket) {
    setStreetAction(previous => {
      if (!previous?.villainAction) return previous;
      return {
        ...previous,
        villainAction: {
          ...previous.villainAction,
          sizeBucket,
        },
      };
    });
  }

  function toggleTag(tag: string) {
    setSelectedTags(previous =>
      previous.includes(tag)
        ? previous.filter(existing => existing !== tag)
        : [...previous, tag]
    );
  }

  function goNext() {
    if (!canAdvance) {
      toast.error(
        currentStep === 0
          ? "Add preflop spot, position, hand, and a stack up to 40bb first."
          : "Select the key street and hero decision first."
      );
      return;
    }

    setCurrentStep(step => Math.min(3, step + 1) as StepIndex);
  }

  function goBack() {
    setCurrentStep(step => Math.max(0, step - 1) as StepIndex);
  }

  function handleSave() {
    if (!isValid || !spotType || !streetAction) {
      toast.error("Complete context and key decision before saving.");
      return;
    }

    const dbSpotType = mapUiSpotTypeToDb(spotType);
    const spotPosition = extractSpotPosition(spotType);
    const spotSubtype = extractSpotSubtype(spotType);
    const heroDecision = deriveHeroDecision(streetAction);
    const cleanNotes = notes.trim();
    const cleanBoard = boardRunout.trim().toUpperCase();

    const streetDataJson = buildStreetDataJson({
      spotType,
      spotPosition,
      spotSubtype,
      heroPosition,
      heroHand: normalizeHandInput(heroHand),
      effectiveStackBb: stackNumber,
      flopBoard: cleanBoard,
      turnCard: "",
      riverCard: "",
      streetAction,
      villainType,
      villainRangeType,
      result,
      evLossBb: mistakeSeverity,
      notes: cleanNotes,
    });

    if (streetDataJson.meta) {
      streetDataJson.meta.context = {
        gameType: gameType || undefined,
        tournamentPhase: tournamentPhase || undefined,
        isPko,
        entryMode,
      };
    }

    createHand.mutate({
      heroPosition,
      heroHand: normalizeHandInput(heroHand),
      boardRunout: cleanBoard || undefined,
      effectiveStackBb: stackNumber,
      spotType: dbSpotType,
      streetDataJson: JSON.stringify(streetDataJson),
      reviewed,
      mistakeStreet:
        mistakeSeverity > 0 ? mistakeStreet || streetAction.street : undefined,
      mistakeSeverity,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      lesson: cleanNotes || undefined,
      heroDecisionPreflop:
        streetAction.street === "PREFLOP" ? heroDecision : undefined,
      heroDecisionFlop:
        streetAction.street === "FLOP" ? heroDecision : undefined,
      heroDecisionTurn:
        streetAction.street === "TURN" ? heroDecision : undefined,
      heroDecisionRiver:
        streetAction.street === "RIVER" ? heroDecision : undefined,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeModal()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-hidden rounded-[1.4rem] border border-border/80 bg-popover/96 p-0 shadow-[0_18px_44px_rgba(0,0,0,0.34)] sm:max-h-[88dvh]"
      >
        <DialogHeader className="border-b border-border/80 bg-background/45 p-5 text-left text-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
                Fast Hand Capture
              </p>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Log Hand
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Capture the preflop spot now. Add detail only when it helps.
              </DialogDescription>
            </div>
            <Button
              type="button"
              aria-label="Close hand entry"
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-accent/55 p-1.5">
            {(["QUICK", "FULL"] as EntryMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setEntryMode(mode)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition",
                  entryMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm shadow-black/20"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )}
              >
                {mode === "QUICK" ? "Quick Log" : "Full Review"}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="border-b border-border/80 bg-background/35 px-5 py-3">
          <StepIndicator currentStep={currentStep} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-zinc-100">
                      Context
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Required: preflop spot, position, hand, and stack up to 40bb.
                    </p>
                  </div>
                  <Badge className="rounded-full bg-orange-500 text-white">
                    Required
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SPOT_OPTIONS.map(option => (
                    <ChipButton
                      key={option.id}
                      active={spotType === option.id}
                      onClick={() => setSpotType(option.id)}
                      className="min-h-[4.5rem]"
                    >
                      <span className="block text-sm">{option.label}</span>
                      <span
                        className={cn(
                          "mt-1 block text-[11px] font-medium leading-tight",
                          spotType === option.id
                            ? "text-zinc-300"
                            : "text-zinc-500"
                        )}
                      >
                        {option.helper}
                      </span>
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-4">
                  <Label className="text-sm font-semibold text-foreground">
                    Hero Hand
                  </Label>
                  <div className="mt-2">
                    <HandPicker value={heroHand} onChange={setHeroHand} />
                  </div>
                  <Input
                    value={heroHand}
                    onChange={event =>
                      setHeroHand(normalizeHandInput(event.target.value))
                    }
                    placeholder="Or type AKs, QQ, AhKh"
                    className="mt-2 h-11 rounded-xl"
                  />
                </div>

                <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-4">
                  <Label
                    htmlFor="effective-stack"
                    className="text-sm font-semibold text-foreground"
                  >
                    Effective Stack
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="effective-stack"
                      type="number"
                      min="1"
                      max="40"
                      value={effectiveStackBb}
                      onChange={event => setEffectiveStackBb(event.target.value)}
                      placeholder="25"
                      className="h-11 rounded-xl"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">bb</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {STACK_PRESETS.map(stack => (
                      <Button
                        key={stack}
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-8 rounded-full px-3 text-xs font-bold",
                          effectiveStackBb === stack &&
                            "border-primary/55 bg-primary/15 text-foreground"
                        )}
                        onClick={() => setEffectiveStackBb(stack)}
                      >
                        {stack}bb
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-black text-zinc-100">
                  Hero Position
                </Label>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {POSITIONS.map(position => (
                    <ChipButton
                      key={position}
                      active={heroPosition === position}
                      onClick={() => setHeroPosition(position)}
                      className="text-center"
                    >
                      {position}
                    </ChipButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-zinc-100">
                      Key Action
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Capture the preflop hero decision. Opener action is
                      optional.
                    </p>
                  </div>
                  <Badge className="rounded-full border border-border/80 bg-accent/60 text-secondary-foreground">
                    Required
                  </Badge>
                </div>

                <div className="mt-4">
                  <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Scope
                  </Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {STREETS.map(street => (
                      <ChipButton
                        key={street}
                        active={streetAction?.street === street}
                        onClick={() => updateStreet(street)}
                        className="text-center"
                      >
                        {street}
                      </ChipButton>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Hero Decision
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {HERO_ACTIONS.map(action => (
                      <ChipButton
                        key={action}
                        active={streetAction?.heroAction?.type === action}
                        onClick={() => updateHeroAction(action)}
                        className="text-center"
                      >
                        {action}
                      </ChipButton>
                    ))}
                  </div>
                  {needsSize(streetAction?.heroAction?.type) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SIZE_BUCKETS.map(size => (
                        <ChipButton
                          key={size}
                          active={streetAction?.heroAction?.sizeBucket === size}
                          onClick={() => updateHeroSize(size)}
                          className="px-3 py-1.5"
                        >
                          {size}
                        </ChipButton>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-accent/40 p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setShowActionDetails(value => !value)}
                >
                  <div>
                    <p className="text-sm font-black text-zinc-100">
                      Optional action detail
                    </p>
                    <p className="text-xs text-zinc-400">
                      Add opener action and player profile when useful.
                    </p>
                  </div>
                  <span className="rounded-full border border-border/80 bg-accent/60 px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    {fullDetailsVisible ? "Hide" : "Add"}
                  </span>
                </button>

                {fullDetailsVisible && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                        Opener / Villain Action
                      </Label>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {VILLAIN_ACTIONS.map(action => (
                          <ChipButton
                            key={action}
                            active={
                              streetAction?.villainAction?.type === action
                            }
                            onClick={() => updateVillainAction(action)}
                            className="text-center"
                          >
                            {action}
                          </ChipButton>
                        ))}
                      </div>
                      {needsSize(streetAction?.villainAction?.type) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {SIZE_BUCKETS.map(size => (
                            <ChipButton
                              key={size}
                              active={
                                streetAction?.villainAction?.sizeBucket === size
                              }
                              onClick={() => updateVillainSize(size)}
                              className="px-3 py-1.5"
                            >
                              {size}
                            </ChipButton>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                          Villain Type
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {VILLAIN_TYPES.map(type => (
                            <ChipButton
                              key={type.id}
                              active={villainType === type.id}
                              onClick={() => setVillainType(type.id)}
                              className="px-3 py-1.5"
                            >
                              {type.label}
                            </ChipButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                          Range Read
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {RANGE_TYPES.map(type => (
                            <ChipButton
                              key={type.id}
                              active={villainRangeType === type.id}
                              onClick={() => setVillainRangeType(type.id)}
                              className="px-3 py-1.5"
                            >
                              {type.label}
                            </ChipButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-4">
                <h3 className="text-base font-black text-zinc-100">
                  Review Signal
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Keep this light. Mark the mistake and write one takeaway if
                  there is one.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ChipButton
                    active={!reviewed}
                    onClick={() => setReviewed(false)}
                    className="text-center"
                  >
                    Review Later
                  </ChipButton>
                  <ChipButton
                    active={reviewed}
                    onClick={() => setReviewed(true)}
                    className="text-center"
                  >
                    Reviewed Now
                  </ChipButton>
                </div>

                <div className="mt-4">
                  <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Mistake Severity
                  </Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[
                      { value: 0, label: "None" },
                      { value: 1, label: "Minor" },
                      { value: 2, label: "Medium" },
                      { value: 3, label: "Major" },
                    ].map(option => (
                      <ChipButton
                        key={option.value}
                        active={mistakeSeverity === option.value}
                        onClick={() => setMistakeSeverity(option.value)}
                        className="text-center"
                      >
                        {option.label}
                      </ChipButton>
                    ))}
                  </div>
                </div>

                {mistakeSeverity > 0 && (
                  <div className="mt-4">
                    <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Mistake Street
                    </Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {STREETS.map(street => (
                        <ChipButton
                          key={street}
                          active={mistakeStreet === street}
                          onClick={() => setMistakeStreet(street)}
                          className="text-center"
                        >
                          {street}
                        </ChipButton>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-accent/40 p-4">
                <Label
                  htmlFor="lesson"
                  className="text-sm font-black text-zinc-100"
                >
                  Lesson / Takeaway
                </Label>
                <Textarea
                  id="lesson"
                  value={notes}
                  onChange={event => setNotes(event.target.value.slice(0, 300))}
                  placeholder="One sentence about what to study or do differently next time."
                  className="mt-2 min-h-24 resize-none rounded-xl"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {300 - notes.length} characters remaining
                </p>
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-accent/40 p-4">
                <p className="text-sm font-black text-zinc-100">
                  Optional Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <ChipButton
                      key={tag}
                      active={selectedTags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5"
                    >
                      {tag.replace(/_/g, " ")}
                    </ChipButton>
                  ))}
                </div>
              </div>

              {entryMode === "FULL" && (
                <div className="rounded-[1rem] border border-border/80 bg-accent/40 p-4">
                  <p className="text-sm font-black text-zinc-100">
                    Tournament Context
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                        Result
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {RESULTS.map(item => (
                          <ChipButton
                            key={item.id}
                            active={result === item.id}
                            onClick={() => setResult(item.id)}
                            className="px-3 py-1.5"
                          >
                            {item.label}
                          </ChipButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                        Game Type
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {GAME_TYPES.map(item => (
                          <ChipButton
                            key={item.id}
                            active={gameType === item.id}
                            onClick={() => setGameType(item.id)}
                            className="px-3 py-1.5"
                          >
                            {item.label}
                          </ChipButton>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Tournament Phase
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PHASES.map(phase => (
                        <ChipButton
                          key={phase.id}
                          active={tournamentPhase === phase.id}
                          onClick={() => setTournamentPhase(phase.id)}
                          className="px-3 py-1.5"
                        >
                          {phase.label}
                        </ChipButton>
                      ))}
                      <ChipButton
                        active={isPko}
                        onClick={() => setIsPko(value => !value)}
                        className="px-3 py-1.5"
                      >
                        PKO
                      </ChipButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-black/20">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Ready to save
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Quick capture is complete. You can review or edit it
                      later from Hand Review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <SummaryRow label="Spot" value={selectedSpotLabel} />
                <SummaryRow label="Hero" value={`${heroHand || "-"} in ${heroPosition || "-"}`} />
                <SummaryRow
                  label="Stack"
                  value={isStackValid ? `${stackNumber}bb` : "Not set"}
                />
                <SummaryRow
                  label="Decision"
                  value={`${streetAction?.street ?? "-"} - ${
                    streetAction?.heroAction?.type ?? "-"
                  }`}
                />
                <SummaryRow
                  label="Review"
                  value={
                    mistakeSeverity > 0
                      ? `${mistakeStreet} mistake, severity ${mistakeSeverity}/3`
                      : reviewed
                        ? "Reviewed, no mistake marked"
                        : "Queued for review"
                  }
                />
                {notes.trim() && (
                  <SummaryRow label="Lesson" value={notes.trim()} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/80 bg-background/35 p-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:bg-accent/55 hover:text-foreground"
            onClick={currentStep === 0 ? closeModal : goBack}
          >
            {currentStep === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </>
            )}
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              className="h-11 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm shadow-black/20 hover:bg-[#FF8A1F]"
              onClick={goNext}
              disabled={!canAdvance}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm shadow-black/20 hover:bg-[#FF8A1F]"
              onClick={handleSave}
              disabled={!isValid || createHand.isPending}
            >
              {createHand.isPending ? "Saving..." : "Save Hand"}
              {!createHand.isPending && <Check className="ml-1 h-4 w-4" />}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
