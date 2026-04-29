import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { LEAK_FAMILIES, type LeakFamilyDefinition } from "@/../../shared/leakFamilies";

// ─── Types ────────────────────────────────────────────────────────────────────

type SpotTypeValue =
  | "RFI"
  | "DEFEND_VS_RFI"
  | "THREE_BET"
  | "FACING_3BET"
  | "BVB"
  | "LIMP_ISO"
  | "FOUR_BET_JAM"
  | "OTHER_PREFLOP";

type HeroPosition = "UTG" | "UTG+1" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB";
type ActionActor = "UTG" | "UTG+1" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB" | "Hero" | "Villain";
type ActionType = "Fold" | "Check" | "Limp" | "Raise" | "Call" | "3-Bet" | "4-Bet" | "Jam";
type SizeUnit = "bb" | "% pot" | "x raise" | "all-in";
type Street = "PREFLOP" | "FLOP" | "TURN" | "RIVER";

interface HandAction {
  id: string;
  actor: ActionActor;
  action: ActionType;
  size?: string;
  sizeUnit?: SizeUnit;
}

interface StreetData {
  board?: string;
  actions: HandAction[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = ["s", "h", "d", "c"] as const;
const SUIT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  s: { symbol: "♠", color: "text-gray-800" },
  h: { symbol: "♥", color: "text-red-600" },
  d: { symbol: "♦", color: "text-red-600" },
  c: { symbol: "♣", color: "text-green-700" },
};

const SPOT_TYPES: Array<{ value: SpotTypeValue; label: string }> = [
  { value: "RFI", label: "RFI / Open" },
  { value: "DEFEND_VS_RFI", label: "Defend vs RFI" },
  { value: "THREE_BET", label: "3-Bet" },
  { value: "FACING_3BET", label: "Facing 3-Bet" },
  { value: "BVB", label: "BvB" },
  { value: "LIMP_ISO", label: "Limp / Iso" },
  { value: "FOUR_BET_JAM", label: "4-Bet / Jam" },
  { value: "OTHER_PREFLOP", label: "Other Preflop" },
];

const HERO_POSITIONS: HeroPosition[] = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
const ACTION_ACTORS: ActionActor[] = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB", "Hero", "Villain"];
const ACTIONS: ActionType[] = ["Fold", "Check", "Limp", "Raise", "Call", "3-Bet", "4-Bet", "Jam"];
const SIZE_UNITS: SizeUnit[] = ["bb", "% pot", "x raise", "all-in"];
const STACK_CHIPS = [10, 15, 20, 25, 40, 60, 100];
const TOURNAMENT_STAGES = ["Early", "Mid", "Late", "Bubble", "ITM", "FT", "HU"];
const VILLAIN_TYPES = ["Unknown", "Rec", "Nit", "Tight Reg", "Aggro Reg", "Whale", "Fish", "Maniac"];
const RANGE_READS = ["Unknown", "Wide", "Tight", "Polar", "Linear", "Capped", "Strong"];
const MISTAKE_STREETS: Array<{ value: Street; label: string }> = [
  { value: "PREFLOP", label: "Preflop" },
  { value: "FLOP", label: "Flop" },
  { value: "TURN", label: "Turn" },
  { value: "RIVER", label: "River" },
];
const SEVERITIES = [
  { value: 0, label: "None" },
  { value: 1, label: "Small" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Big" },
];

// ─── Hand class derivation ────────────────────────────────────────────────────

function deriveHandClass(card1: string, card2: string): string {
  if (!card1 || !card2) return "";
  const r1 = card1[0];
  const s1 = card1[1];
  const r2 = card2[0];
  const s2 = card2[1];
  if (r1 === r2) return r1 + r2; // pair
  const rankOrder = "AKQJT98765432";
  const idx1 = rankOrder.indexOf(r1);
  const idx2 = rankOrder.indexOf(r2);
  const [high, low, hs, ls] = idx1 < idx2 ? [r1, r2, s1, s2] : [r2, r1, s2, s1];
  const suited = hs === ls ? "s" : "o";
  return high + low + suited;
}

function parseHandInput(raw: string): { card1: string; card2: string; handClass: string; exactKnown: boolean } | null {
  const s = raw.trim();
  if (!s) return null;

  // Exact: AhKh, AsKd, KcKs (case-insensitive suits)
  const exactMatch = s.match(/^([AKQJT2-9])([SHDCshdc])([AKQJT2-9])([SHDCshdc])$/i);
  if (exactMatch) {
    const c1 = exactMatch[1].toUpperCase() + exactMatch[2].toLowerCase();
    const c2 = exactMatch[3].toUpperCase() + exactMatch[4].toLowerCase();
    if (c1 === c2) return null; // duplicate
    return { card1: c1, card2: c2, handClass: deriveHandClass(c1, c2), exactKnown: true };
  }

  // Class: AKs, AKo, QQ
  const classMatch = s.match(/^([AKQJT2-9])([AKQJT2-9])([SO]?)$/i);
  if (classMatch) {
    const r1 = classMatch[1].toUpperCase();
    const r2 = classMatch[2].toUpperCase();
    const suf = classMatch[3].toUpperCase();
    const rankOrder = "AKQJT98765432";
    const idx1 = rankOrder.indexOf(r1);
    const idx2 = rankOrder.indexOf(r2);
    if (r1 === r2) return { card1: "", card2: "", handClass: r1 + r2, exactKnown: false };
    const [high, low] = idx1 < idx2 ? [r1, r2] : [r2, r1];
    const suited = suf === "S" ? "s" : suf === "O" ? "o" : "s";
    return { card1: "", card2: "", handClass: high + low + suited, exactKnown: false };
  }

  return null;
}

// ─── Card Picker ──────────────────────────────────────────────────────────────

interface CardPickerProps {
  card1: string;
  card2: string;
  onChange: (c1: string, c2: string) => void;
}

function CardPicker({ card1, card2, onChange }: CardPickerProps) {
  const [selecting, setSelecting] = useState<1 | 2 | null>(null);

  const handleCardClick = useCallback(
    (rank: string, suit: string) => {
      const card = rank + suit;
      if (selecting === 1) {
        if (card === card2) return;
        onChange(card, card2);
        setSelecting(2);
      } else if (selecting === 2) {
        if (card === card1) return;
        onChange(card1, card);
        setSelecting(null);
      }
    },
    [selecting, card1, card2, onChange]
  );

  const renderCard = (card: string, slot: 1 | 2) => {
    if (!card) {
      return (
        <button
          onClick={() => setSelecting(slot)}
          className={`w-12 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-sm font-bold transition-all ${
            selecting === slot ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-400 text-gray-400"
          }`}
        >
          ?
        </button>
      );
    }
    const rank = card[0];
    const suit = card[1];
    const { symbol, color } = SUIT_SYMBOLS[suit] || { symbol: suit, color: "text-gray-700" };
    return (
      <button
        onClick={() => setSelecting(slot)}
        className={`w-12 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all bg-white ${
          selecting === slot ? "border-orange-500" : "border-gray-300 hover:border-orange-400"
        }`}
      >
        <span className={`text-lg font-bold ${color}`}>{rank}</span>
        <span className={`text-sm ${color}`}>{symbol}</span>
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {renderCard(card1, 1)}
        {renderCard(card2, 2)}
        {(card1 || card2) && (
          <button
            onClick={() => { onChange("", ""); setSelecting(1); }}
            className="text-xs text-gray-400 hover:text-red-500 ml-1"
          >
            Clear
          </button>
        )}
      </div>
      {selecting && (
        <div className="border rounded-lg p-2 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">Select card {selecting}</div>
          {SUITS.map(suit => {
            const { symbol, color } = SUIT_SYMBOLS[suit];
            return (
              <div key={suit} className="flex gap-1 mb-1 flex-wrap">
                {RANKS.map(rank => {
                  const card = rank + suit;
                  const taken = card === card1 || card === card2;
                  return (
                    <button
                      key={card}
                      disabled={taken}
                      onClick={() => handleCardClick(rank, suit)}
                      className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                        taken
                          ? "opacity-30 cursor-not-allowed bg-gray-100"
                          : `bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 ${color}`
                      }`}
                    >
                      {rank}{symbol}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Action Row ───────────────────────────────────────────────────────────────

interface ActionRowProps {
  action: HandAction;
  onChange: (updated: HandAction) => void;
  onRemove: () => void;
}

function ActionRow({ action, onChange, onRemove }: ActionRowProps) {
  const needsSize = ["Raise", "3-Bet", "4-Bet"].includes(action.action);
  return (
    <div className="flex gap-1 items-center flex-wrap">
      <Select value={action.actor} onValueChange={v => onChange({ ...action, actor: v as ActionActor })}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTION_ACTORS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={action.action} onValueChange={v => onChange({ ...action, action: v as ActionType })}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
      {needsSize && (
        <>
          <Input
            className="w-16 h-8 text-xs"
            placeholder="size"
            value={action.size || ""}
            onChange={e => onChange({ ...action, size: e.target.value })}
          />
          <Select value={action.sizeUnit || "bb"} onValueChange={v => onChange({ ...action, sizeUnit: v as SizeUnit })}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </>
      )}
      <button onClick={onRemove} className="text-gray-400 hover:text-red-500 ml-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Street Builder ───────────────────────────────────────────────────────────

interface StreetBuilderProps {
  label: string;
  data: StreetData | null;
  onToggle: () => void;
  onChange: (data: StreetData) => void;
}

function StreetBuilder({ label, data, onToggle, onChange }: StreetBuilderProps) {
  const addAction = () => {
    const newAction: HandAction = {
      id: Math.random().toString(36).slice(2),
      actor: "Hero",
      action: "Check",
    };
    onChange({ ...(data || { actions: [] }), actions: [...(data?.actions || []), newAction] });
  };

  const updateAction = (idx: number, updated: HandAction) => {
    const actions = [...(data?.actions || [])];
    actions[idx] = updated;
    onChange({ ...(data || { actions: [] }), actions });
  };

  const removeAction = (idx: number) => {
    const actions = (data?.actions || []).filter((_, i) => i !== idx);
    onChange({ ...(data || { actions: [] }), actions });
  };

  if (!data) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        <Plus className="w-4 h-4" /> Add {label}
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <button onClick={onToggle} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
      </div>
      <Input
        className="h-8 text-xs"
        placeholder="Board cards or text (e.g. 7c4h2d or low rainbow)"
        value={data.board || ""}
        onChange={e => onChange({ ...data, board: e.target.value })}
      />
      <div className="space-y-1.5">
        {data.actions.map((a, i) => (
          <ActionRow
            key={a.id}
            action={a}
            onChange={updated => updateAction(i, updated)}
            onRemove={() => removeAction(i)}
          />
        ))}
      </div>
      <button
        onClick={addAction}
        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
      >
        <Plus className="w-3.5 h-3.5" /> Add action
      </button>
    </div>
  );
}

// ─── Action preview ───────────────────────────────────────────────────────────

function buildActionPreview(actions: HandAction[]): string {
  return actions
    .map(a => {
      const sizeStr = a.size ? ` to ${a.size}${a.sizeUnit === "bb" ? "bb" : ` ${a.sizeUnit}`}` : "";
      return `${a.actor} ${a.action.toLowerCase()}${sizeStr}`;
    })
    .join(", ");
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface LogHandModalV2_1Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LogHandModalV2_1({ isOpen, onClose }: LogHandModalV2_1Props) {
  const utils = trpc.useUtils();

  // Hand context
  const [handInput, setHandInput] = useState("");
  const [card1, setCard1] = useState("");
  const [card2, setCard2] = useState("");
  const [handClass, setHandClass] = useState("");
  const [exactKnown, setExactKnown] = useState(false);
  const [stackInput, setStackInput] = useState("");
  const [spotType, setSpotType] = useState<SpotTypeValue | "">("");
  const [heroPosition, setHeroPosition] = useState<HeroPosition | "">("");
  const [villainPosition, setVillainPosition] = useState("");
  const [tournamentStage, setTournamentStage] = useState("");
  const [villainType, setVillainType] = useState("");
  const [rangeRead, setRangeRead] = useState("");
  const [showOptionalContext, setShowOptionalContext] = useState(false);

  // Preflop actions
  const [preflopActions, setPreflopActions] = useState<HandAction[]>([]);

  // Streets
  const [flopData, setFlopData] = useState<StreetData | null>(null);
  const [turnData, setTurnData] = useState<StreetData | null>(null);
  const [riverData, setRiverData] = useState<StreetData | null>(null);

  // Review tagging
  const [isMistake, setIsMistake] = useState<"yes" | "no" | "unsure">("unsure");
  const [mistakeStreet, setMistakeStreet] = useState<Street | "">("");
  const [severity, setSeverity] = useState(0);
  const [leakFamilyId, setLeakFamilyId] = useState("");
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH" | "">("");
  const [lesson, setLesson] = useState("");

  // Card picker mode
  const [useCardPicker, setUseCardPicker] = useState(false);

  const createHand = trpc.hands.create.useMutation({
    onSuccess: () => {
      utils.hands.getByUser.invalidate();
      toast.success("Hand saved.");
      handleClose();
    },
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  const handleClose = () => {
    setHandInput(""); setCard1(""); setCard2(""); setHandClass(""); setExactKnown(false);
    setStackInput(""); setSpotType(""); setHeroPosition(""); setVillainPosition("");
    setTournamentStage(""); setVillainType(""); setRangeRead(""); setShowOptionalContext(false);
    setPreflopActions([]);
    setFlopData(null); setTurnData(null); setRiverData(null);
    setIsMistake("unsure"); setMistakeStreet(""); setSeverity(0);
    setLeakFamilyId(""); setConfidence(""); setLesson("");
    setUseCardPicker(false);
    onClose();
  };

  const handleHandInputChange = (val: string) => {
    setHandInput(val);
    const parsed = parseHandInput(val);
    if (parsed) {
      setCard1(parsed.card1);
      setCard2(parsed.card2);
      setHandClass(parsed.handClass);
      setExactKnown(parsed.exactKnown);
    } else {
      setCard1(""); setCard2(""); setHandClass(""); setExactKnown(false);
    }
  };

  const handleCardPickerChange = (c1: string, c2: string) => {
    setCard1(c1); setCard2(c2);
    if (c1 && c2) {
      const hc = deriveHandClass(c1, c2);
      setHandClass(hc);
      setExactKnown(true);
      setHandInput(c1 + c2);
    } else {
      setHandClass(""); setExactKnown(false);
      setHandInput("");
    }
  };

  const addPreflopAction = () => {
    setPreflopActions(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), actor: "Hero" as ActionActor, action: "Raise" as ActionType },
    ]);
  };

  const buildActionsJson = () => {
    const all: Array<{ street: string; actor: string; action: string; size?: string; sizeUnit?: string }> = [];
    preflopActions.forEach(a => all.push({ street: "PREFLOP", actor: a.actor, action: a.action, size: a.size, sizeUnit: a.sizeUnit }));
    flopData?.actions.forEach(a => all.push({ street: "FLOP", actor: a.actor, action: a.action, size: a.size, sizeUnit: a.sizeUnit }));
    turnData?.actions.forEach(a => all.push({ street: "TURN", actor: a.actor, action: a.action, size: a.size, sizeUnit: a.sizeUnit }));
    riverData?.actions.forEach(a => all.push({ street: "RIVER", actor: a.actor, action: a.action, size: a.size, sizeUnit: a.sizeUnit }));
    return all.length > 0 ? JSON.stringify(all) : undefined;
  };

  const buildBoardJson = () => {
    const board: Record<string, string | null> = {
      flopText: flopData?.board || null,
      turnCard: turnData?.board || null,
      riverCard: riverData?.board || null,
    };
    const hasBoard = Object.values(board).some(v => v !== null);
    return hasBoard ? JSON.stringify(board) : undefined;
  };

  const handleSave = (reviewStatus: "NEEDS_REVIEW" | "REVIEWED" | "DRAFT") => {
    if (!spotType) { toast.error("Select a spot type."); return; }
    if (!heroPosition) { toast.error("Select hero position."); return; }
    const stack = parseFloat(stackInput);
    if (!stackInput || isNaN(stack) || stack <= 0) { toast.error("Enter a valid stack in bb."); return; }
    if (!handClass && !card1) { toast.error("Enter hero hand (e.g. AKs or AhKh)."); return; }

    createHand.mutate({
      spotType: spotType as any,
      heroPosition,
      villainPosition: villainPosition && villainPosition !== "none" ? villainPosition : undefined,
      heroCard1: card1 || undefined,
      heroCard2: card2 || undefined,
      handClass: handClass || undefined,
      exactSuitsKnown: exactKnown,
      actualStackBB: stack,
      effectiveStackBb: stack,
      tournamentStage: tournamentStage && tournamentStage !== "none" ? tournamentStage : undefined,
      villainType: villainType && villainType !== "none" ? villainType : undefined,
      rangeRead: rangeRead && rangeRead !== "none" ? rangeRead : undefined,
      preflopDecision: preflopActions.length > 0 ? buildActionPreview(preflopActions) : undefined,
      actionsJson: buildActionsJson(),
      boardJson: buildBoardJson(),
      mistakeStreet: isMistake !== "no" && mistakeStreet ? (mistakeStreet as any) : undefined,
      mistakeSeverity: isMistake !== "no" ? severity : 0,
      leakFamilyId: leakFamilyId && leakFamilyId !== "none" ? leakFamilyId : undefined,
      confidence: confidence || undefined,
      lesson: lesson.trim() || undefined,
      reviewStatus,
    });
  };

  const preflopPreview = preflopActions.length > 0 ? buildActionPreview(preflopActions) : null;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-base font-semibold">Log a Hand</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">

          {/* ── Section 1: Hand Context ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hand Context</h3>

            {/* Hero Hand */}
            <div className="space-y-1.5">
              <Label className="text-sm">Hero Hand</Label>
              <div className="flex gap-2 items-start flex-wrap">
                {!useCardPicker ? (
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      className="w-28 h-9 text-sm font-mono"
                      placeholder="AKs or AhKh"
                      value={handInput}
                      onChange={e => handleHandInputChange(e.target.value)}
                    />
                    {handClass && (
                      <Badge variant="secondary" className="text-xs">{handClass}{exactKnown ? " (exact)" : ""}</Badge>
                    )}
                    <button
                      onClick={() => setUseCardPicker(true)}
                      className="text-xs text-orange-600 hover:text-orange-700 underline"
                    >
                      Pick cards
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <CardPicker card1={card1} card2={card2} onChange={handleCardPickerChange} />
                    {handClass && (
                      <Badge variant="secondary" className="text-xs">{handClass} (exact)</Badge>
                    )}
                    <button
                      onClick={() => { setUseCardPicker(false); setCard1(""); setCard2(""); setHandClass(""); setExactKnown(false); setHandInput(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Type instead
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stack + Spot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Stack (bb)</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. 37.5"
                  value={stackInput}
                  onChange={e => setStackInput(e.target.value)}
                />
                <div className="flex gap-1 flex-wrap">
                  {STACK_CHIPS.map(c => (
                    <button
                      key={c}
                      onClick={() => setStackInput(String(c))}
                      className={`px-2 py-0.5 rounded text-xs border transition-all ${
                        stackInput === String(c) ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 hover:border-orange-400 text-gray-600"
                      }`}
                    >
                      {c}bb
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Spot Type <span className="text-red-500">*</span></Label>
                <Select value={spotType} onValueChange={v => setSpotType(v as SpotTypeValue)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select spot" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOT_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Positions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Hero Position <span className="text-red-500">*</span></Label>
                <Select value={heroPosition} onValueChange={v => setHeroPosition(v as HeroPosition)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {HERO_POSITIONS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Villain / Opener</Label>
                <Select value={villainPosition} onValueChange={setVillainPosition}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {HERO_POSITIONS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional context toggle */}
            <button
              onClick={() => setShowOptionalContext(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {showOptionalContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showOptionalContext ? "Hide" : "Show"} optional context
            </button>

            {showOptionalContext && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Stage</Label>
                  <Select value={tournamentStage} onValueChange={setTournamentStage}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {TOURNAMENT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Villain Type</Label>
                  <Select value={villainType} onValueChange={setVillainType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {VILLAIN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Range Read</Label>
                  <Select value={rangeRead} onValueChange={setRangeRead}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {RANGE_READS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Preflop Line ── */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preflop Line</h3>
            <div className="space-y-1.5">
              {preflopActions.map((a, i) => (
                <ActionRow
                  key={a.id}
                  action={a}
                  onChange={updated => {
                    const next = [...preflopActions];
                    next[i] = updated;
                    setPreflopActions(next);
                  }}
                  onRemove={() => setPreflopActions(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
            <button
              onClick={addPreflopAction}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Add action
            </button>
            {preflopPreview && (
              <p className="text-xs text-gray-500 italic">{preflopPreview}</p>
            )}
          </div>

          {/* ── Section 3: Optional Streets ── */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optional Streets</h3>
            <div className="space-y-2">
              <StreetBuilder
                label="Flop"
                data={flopData}
                onToggle={() => setFlopData(d => d ? null : { actions: [] })}
                onChange={setFlopData}
              />
              <StreetBuilder
                label="Turn"
                data={turnData}
                onToggle={() => setTurnData(d => d ? null : { actions: [] })}
                onChange={setTurnData}
              />
              <StreetBuilder
                label="River"
                data={riverData}
                onToggle={() => setRiverData(d => d ? null : { actions: [] })}
                onChange={setRiverData}
              />
            </div>
          </div>

          {/* ── Section 4: Review Tagging ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review & Tagging</h3>

            {/* Mistake? */}
            <div className="space-y-1.5">
              <Label className="text-sm">Mistake?</Label>
              <div className="flex gap-2">
                {(["yes", "no", "unsure"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setIsMistake(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                      isMistake === v ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 hover:border-orange-400 text-gray-600"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {isMistake !== "no" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Mistake Street</Label>
                  <Select value={mistakeStreet} onValueChange={v => setMistakeStreet(v as Street)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Street" />
                    </SelectTrigger>
                    <SelectContent>
                      {MISTAKE_STREETS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Severity</Label>
                  <div className="flex gap-1">
                    {SEVERITIES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSeverity(s.value)}
                        className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${
                          severity === s.value ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 hover:border-orange-400 text-gray-600"
                        }`}
                      >
                        {s.value} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Leak Family */}
            <div className="space-y-1.5">
              <Label className="text-sm">Leak Family</Label>
              <Select value={leakFamilyId} onValueChange={setLeakFamilyId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="No leak family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No leak family</SelectItem>
                  {LEAK_FAMILIES.map((f: LeakFamilyDefinition) => (
                    <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confidence */}
            <div className="space-y-1.5">
              <Label className="text-sm">Confidence</Label>
              <div className="flex gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setConfidence(prev => prev === c ? "" : c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      confidence === c ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 hover:border-orange-400 text-gray-600"
                    }`}
                  >
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson */}
            <div className="space-y-1.5">
              <Label className="text-sm">Lesson</Label>
              <Textarea
                className="text-sm resize-none"
                rows={2}
                placeholder="What is the one thing to remember next time?"
                value={lesson}
                onChange={e => setLesson(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-2 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("NEEDS_REVIEW")}
              disabled={createHand.isPending}
            >
              Save & Review Later
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleSave("REVIEWED")}
              disabled={createHand.isPending}
            >
              Save as Reviewed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
