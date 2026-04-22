import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[32px] border-2 border-dashed border-fammi-200 bg-fammi-50",
        "px-8 py-12 gap-4 animate-fade-in",
        className,
      )}
    >
      <div
        className="text-5xl select-none"
        role="img"
        aria-label={title}
      >
        {emoji}
      </div>
      <h3 className="text-lg font-bold text-text-primary tracking-tight">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
