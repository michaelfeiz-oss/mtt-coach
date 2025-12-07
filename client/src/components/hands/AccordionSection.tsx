import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  previewText?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionSection({
  title,
  previewText,
  children,
  defaultOpen = false,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {!isOpen && previewText && (
            <p className="text-sm text-gray-500 mt-1">{previewText}</p>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}
