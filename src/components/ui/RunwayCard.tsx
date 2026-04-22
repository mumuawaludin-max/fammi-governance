"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { THRESHOLDS } from "@/lib/constants";

export interface RunwayCardProps {
  runwayMonths: number;
  burnRatePerMonth?: number;
  cashBalance?: number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  className?: string;
}

function ChipIcon() {
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
      <rect x="1" y="1" width="38" height="28" rx="5" fill="#D4C2FF" opacity="0.4" />
      <rect x="1" y="1" width="38" height="28" rx="5" stroke="#D4C2FF" strokeWidth="1" />
      <line x1="14" y1="1" x2="14" y2="29" stroke="#D4C2FF" strokeWidth="1" />
      <line x1="26" y1="1" x2="26" y2="29" stroke="#D4C2FF" strokeWidth="1" />
      <line x1="1" y1="10" x2="39" y2="10" stroke="#D4C2FF" strokeWidth="1" />
      <line x1="1" y1="20" x2="39" y2="20" stroke="#D4C2FF" strokeWidth="1" />
    </svg>
  );
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration]);

  return value;
}

function getRunwayColor(months: number) {
  if (months <= THRESHOLDS.RUNWAY_CRITICAL) return { bar: "bg-danger", text: "text-danger/80" };
  if (months <= THRESHOLDS.RUNWAY_WARNING) return { bar: "bg-warning", text: "text-warning/80" };
  return { bar: "bg-success", text: "text-success/80" };
}

const TREND_ICON = {
  up: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  down: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  neutral: null,
};

export function RunwayCard({
  runwayMonths,
  trendLabel,
  trend = "neutral",
  className,
}: RunwayCardProps) {
  const animated = useCountUp(runwayMonths);
  const pct = Math.min(100, (runwayMonths / 12) * 100);
  const { bar, text } = getRunwayColor(runwayMonths);

  const statusLabel =
    runwayMonths <= THRESHOLDS.RUNWAY_CRITICAL
      ? "Kritis"
      : runwayMonths <= THRESHOLDS.RUNWAY_WARNING
        ? "Perlu perhatian"
        : "Aman";

  const cardDots = "\u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  2026";

  return (
    <div
      className={cn(
        "rounded-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden",
        "bg-gradient-wallet text-white",
        "transition-all duration-300 hover:shadow-neon hover:scale-[1.015]",
        "min-h-[200px]",
        className,
      )}
    >
      {/* decorative circles */}
      <span className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/5" />
      <span className="pointer-events-none absolute -right-4 top-10 w-24 h-24 rounded-full bg-white/5" />

      {/* top row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">
            Fammi
          </p>
          <p className="text-xs text-white/60">Dompet Operasional</p>
        </div>
        <ChipIcon />
      </div>

      {/* main amount */}
      <div className="relative z-10">
        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Runway</p>
        <div className="flex items-end gap-2">
          <span className="font-mono text-5xl font-bold tabular-nums leading-none">
            {animated}
          </span>
          <span className="text-lg font-medium text-white/70 pb-1">bulan</span>
        </div>
        {trendLabel && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", text)}>
            {TREND_ICON[trend]}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {/* bottom row */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* progress bar runway */}
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
          <span>0</span>
          <span className={cn("font-semibold", text)}>{statusLabel}</span>
          <span>12 bln</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", bar)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* card number style */}
        <p className="font-mono text-xs text-white/30 tracking-[0.25em] mt-2">
          {cardDots}
        </p>
      </div>
    </div>
  );
}
