"use client";

import { cn } from "@/lib/cn";

export const STEP_LABELS = [
  "Identitas",
  "Upload",
  "Validasi",
  "Preview",
  "Export",
] as const;

interface NarasiStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function NarasiStepper({ currentStep }: NarasiStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4 | 5;
        const isDone = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isDone
                    ? "bg-success text-white"
                    : isActive
                      ? "bg-fammi text-white shadow-fammi"
                      : "bg-fammi-100 text-text-secondary",
                )}
              >
                {isDone ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  isActive ? "text-fammi" : isDone ? "text-success" : "text-text-secondary",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors",
                  isDone ? "bg-success" : "bg-fammi-100",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
