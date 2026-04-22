"use client";

import { useEffect, useRef, useState } from "react";
import type { TrendDirection } from "@/types";
import { cn } from "@/lib/cn";

export interface StatBadgeProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: TrendDirection;
  trendValue?: string;
  accent?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
  animate?: boolean;
}

const ACCENT_TEXT: Record<NonNullable<StatBadgeProps["accent"]>, string> = {
  primary: "text-fammi",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-text-primary",
};

const TREND_MAP: Record<TrendDirection, { symbol: string; color: string }> = {
  up: { symbol: "▲", color: "text-success" },
  down: { symbol: "▼", color: "text-danger" },
  neutral: { symbol: "■", color: "text-text-secondary" },
};

function useCountUp(target: number, enabled: boolean, duration = 1200) {
  const [display, setDisplay] = useState<number>(enabled ? 0 : target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = target;

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      }
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, enabled, duration]);

  return display;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("id-ID");
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

export function StatBadge({
  label,
  value,
  unit,
  trend,
  trendValue,
  accent = "neutral",
  className,
  animate = true,
}: StatBadgeProps) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0, isNumeric && animate);
  const displayValue = isNumeric ? formatNumber(animated) : value;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono font-bold text-3xl md:text-4xl tabular-nums",
            ACCENT_TEXT[accent],
          )}
        >
          {displayValue}
        </span>
        {unit ? (
          <span className="text-sm font-medium text-text-secondary">
            {unit}
          </span>
        ) : null}
      </div>
      {trend ? (
        <div className="flex items-center gap-1 text-xs font-medium">
          <span className={TREND_MAP[trend].color}>
            {TREND_MAP[trend].symbol}
          </span>
          <span className="text-text-secondary">
            {trendValue ?? ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
