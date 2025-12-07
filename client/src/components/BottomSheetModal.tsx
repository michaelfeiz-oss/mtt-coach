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

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
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

        {/* Content */}
        <div className="px-4 py-6 space-y-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div className="bg-white border-t border-border px-4 py-4 flex gap-2 flex-shrink-0">
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
    </>
  );
}
