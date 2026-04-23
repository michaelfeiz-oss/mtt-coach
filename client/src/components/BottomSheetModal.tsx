import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function BottomSheetModal({
  isOpen,
  onClose,
  title,
  description,
  eyebrow = "Quick Capture",
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
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_14rem),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] shadow-2xl shadow-black/45">
          {/* Header */}
          <div className="flex flex-shrink-0 items-start justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="pr-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                {eyebrow}
              </p>
              <h2 className="text-lg font-black tracking-tight text-zinc-100">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-zinc-400">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-white/10 p-0 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content - scrollable */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
            {children}
          </div>

          {/* Footer - always visible */}
          {onSubmit && (
            <div className="flex flex-shrink-0 gap-2.5 border-t border-white/10 bg-black/20 px-5 py-3 sm:px-6">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
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
