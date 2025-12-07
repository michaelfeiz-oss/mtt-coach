import React from "react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; description?: string }>;
  onStepClick?: (step: number) => void;
}

export function Stepper({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
}: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick !== undefined;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div
                className={`flex flex-col items-center ${
                  isClickable ? "cursor-pointer" : ""
                }`}
                onClick={() => isClickable && onStepClick?.(index)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isCurrent
                      ? "bg-orange-500 text-white ring-2 ring-orange-300"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>

                {/* Step Label - hidden on mobile, shown on larger screens */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium hidden sm:block ${
                      isCurrent ? "text-orange-600" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 hidden md:block mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Text - mobile friendly */}
      <div className="text-center text-sm text-gray-600 mb-4">
        Step {currentStep + 1} of {totalSteps}
      </div>
    </div>
  );
}
