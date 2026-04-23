import { type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-xl flex-col overflow-hidden rounded-[1.25rem] border border-border bg-popover p-0 shadow-[0_18px_42px_rgba(15,23,42,0.2)]"
      >
        <DialogHeader className="flex-shrink-0 border-b border-border bg-accent/50 px-5 py-4 text-left sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="pr-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-border bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          {children}
        </div>

        {onSubmit && (
          <div className="flex flex-shrink-0 gap-2.5 border-t border-border bg-accent/45 px-5 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 flex-1 rounded-xl"
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : submitLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
