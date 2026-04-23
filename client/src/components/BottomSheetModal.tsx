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
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Centered Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] border border-border/80 bg-popover/96 shadow-[0_16px_40px_rgba(0,0,0,0.34)]">
          {/* Header */}
          <div className="flex flex-shrink-0 items-start justify-between border-b border-border/80 bg-background/45 px-5 py-4 sm:px-6">
            <div className="pr-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-border/80 bg-accent/45 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
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
            <div className="flex flex-shrink-0 gap-2.5 border-t border-border/80 bg-background/40 px-5 py-3 sm:px-6">
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
