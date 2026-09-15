"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  stub?: boolean; // "coming soon" steps not yet active
}

export const PIPELINE_STEPS: Step[] = [
  { id: "import",    label: "Import" },
  { id: "analyze",   label: "Analyze" },
  { id: "review",    label: "Review" },
  { id: "configure", label: "Configure" },
  { id: "security",  label: "Security",  stub: true },
  { id: "build",     label: "Build",     stub: true },
  { id: "preview",   label: "Preview",   stub: true },
  { id: "release",   label: "Release" },
  { id: "publish",   label: "Publish" },
];

interface StepWizardProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  completedSteps?: string[];
}

export function StepWizard({ steps, currentStep, onStepClick, completedSteps = [] }: StepWizardProps) {
  return (
    <nav aria-label="Progress" className="w-full overflow-x-auto pb-1">
      <ol className="flex items-center min-w-max">
        {steps.map((step, i) => {
          const isActive    = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const isStub      = !!step.stub;
          const isClickable = !!onStepClick && (isCompleted || isActive) && !isStub;

          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                title={isStub ? "Coming soon" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full text-sm font-medium transition",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                {/* Circle */}
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 shrink-0",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-neutral-900 text-white ring-4 ring-neutral-900/10"
                      : isStub
                      ? "border-2 border-dashed border-neutral-200 text-neutral-300 bg-white"
                      : "border-2 border-neutral-200 text-neutral-400 bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isStub ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "hidden sm:block text-xs",
                    isActive
                      ? "text-neutral-900 font-semibold"
                      : isCompleted
                      ? "text-emerald-600"
                      : isStub
                      ? "text-neutral-300"
                      : "text-neutral-400"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px transition-colors duration-300",
                    isCompleted ? "bg-emerald-300 w-6" : isStub ? "w-4 border-t border-dashed border-neutral-200" : "bg-neutral-200 w-6"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
