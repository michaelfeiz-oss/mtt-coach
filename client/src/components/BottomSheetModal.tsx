import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function BottomSheetModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  isLoading = false,
}: BottomSheetModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="px-6 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>

          {/* Footer - always visible */}
          {onSubmit && (
            <div className="border-t border-border px-6 py-4 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={onSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : submitLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
