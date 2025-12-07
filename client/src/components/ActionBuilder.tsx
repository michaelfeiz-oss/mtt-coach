import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const POSITIONS = ["UTG", "UTG+1", "HJ", "CO", "BTN", "SB", "BB"];
const ACTIONS = ["Folds", "Checks", "Calls", "Raises", "3-bets", "4-bets", "Shoves", "Limps"];

interface ActionItem {
  id: string;
  position: string;
  action: string;
  amount?: string;
}

interface ActionBuilderProps {
  value: string;
  onChange: (sequence: string) => void;
  label?: string;
}

export function ActionBuilder({ value, onChange, label = "Action Sequence" }: ActionBuilderProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const handleAddAction = () => {
    if (!selectedPosition || !selectedAction) return;

    const newAction: ActionItem = {
      id: Math.random().toString(),
      position: selectedPosition,
      action: selectedAction,
      amount: amount || undefined,
    };

    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    updateSequence(updatedActions);
    
    // Reset inputs
    setSelectedPosition("");
    setSelectedAction("");
    setAmount("");
  };

  const handleRemoveAction = (id: string) => {
    const updatedActions = actions.filter((a) => a.id !== id);
    setActions(updatedActions);
    updateSequence(updatedActions);
  };

  const updateSequence = (actionList: ActionItem[]) => {
    const sequence = actionList
      .map((a) => {
        if (a.amount) {
          return `${a.position} ${a.action.toLowerCase()} ${a.amount}`;
        }
        return `${a.position} ${a.action.toLowerCase()}`;
      })
      .join(", ");
    onChange(sequence);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>

      {/* Action Builder */}
      <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-3 gap-2">
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="">Position</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="">Action</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="e.g., 2.5x"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          />
        </div>

        <Button
          type="button"
          onClick={handleAddAction}
          disabled={!selectedPosition || !selectedAction}
          className="w-full"
          size="sm"
        >
          + Add Action
        </Button>
      </div>

      {/* Action List */}
      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded"
            >
              <span className="text-sm">
                <strong>{action.position}</strong> {action.action.toLowerCase()}
                {action.amount && ` ${action.amount}`}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAction(action.id)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="p-3 bg-gray-100 rounded text-sm text-gray-700">
          <strong>Preview:</strong> {value}
        </div>
      )}
    </div>
  );
}
