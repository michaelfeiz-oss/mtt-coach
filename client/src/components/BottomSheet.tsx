import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_14rem),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] shadow-2xl shadow-black/45">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-4 py-4 backdrop-blur">
          <h2 className="text-lg font-black tracking-tight text-zinc-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-5 pb-20">
          {children}
        </div>
      </div>
    </>
  );
}
