"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { THRESHOLDS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunwayCardProps {
  /** Sisa runway dalam bulan */
  runwayMonths: number;
  /** Saldo kas saat ini (Rupiah) */
  cashBalance: number;
  /** Pemasukan bulan ini (Rupiah) */
  incomeMonthly: number;
  /** Pengeluaran / burn rate bulan ini (Rupiah) */
  burnRateMonthly: number;
  cardHolder?: string;
  cardExpiry?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function getRunwayHealth(months: number) {
  if (months <= THRESHOLDS.RUNWAY_CRITICAL)
    return { bar: "bg-danger", label: "Kritis", color: "text-danger" };
  if (months <= THRESHOLDS.RUNWAY_WARNING)
    return { bar: "bg-warning", label: "Perlu perhatian", color: "text-warning-dark" };
  return { bar: "bg-success", label: "Aman", color: "text-success" };
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChipSVG() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
      <rect x="1" y="1" width="42" height="32" rx="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="15" y="1" width="14" height="32" fill="rgba(255,255,255,0.08)" />
      <rect x="1" y="11" width="42" height="12" fill="rgba(255,255,255,0.08)" />
      <circle cx="22" cy="17" r="4" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

// ─── Physical Credit Card ─────────────────────────────────────────────────────

interface CreditCardProps {
  cardHolder: string;
  cardExpiry: string;
}

function CreditCard({ cardHolder, cardExpiry }: CreditCardProps) {
  return (
    <div
      className="relative rounded-[20px] overflow-hidden flex flex-col justify-between p-5 text-white select-none"
      style={{
        background: "linear-gradient(135deg, #1E0857 0%, #4A0F99 45%, #6323DA 100%)",
        minWidth: 240,
        height: 150,
      }}
    >
      {/* decorative circles */}
      <span className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute right-6 top-8 w-20 h-20 rounded-full bg-white/10" />

      {/* top: brand + chip */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-bold tracking-tight leading-none">fammi</p>
          <p className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Akun Utama</p>
        </div>
        <ChipSVG />
      </div>

      {/* card number */}
      <div className="relative z-10 font-mono text-sm tracking-[0.2em] text-white/90">
        5789 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 2026
      </div>

      {/* bottom: holder + expiry */}
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <p className="text-[8px] text-white/40 uppercase">Pemegang kartu</p>
          <p className="text-xs font-semibold">{cardHolder}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-white/40 uppercase">Berlaku hingga</p>
          <p className="text-xs font-semibold">{cardExpiry}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RunwayCard({
  runwayMonths,
  cashBalance,
  incomeMonthly,
  burnRateMonthly,
  cardHolder = "Tim Fammi",
  cardExpiry = "12/26",
  className,
}: RunwayCardProps) {
  const animatedBalance = useCountUp(cashBalance);
  const animatedIncome = useCountUp(incomeMonthly);
  const animatedBurn = useCountUp(burnRateMonthly);

  const pct = Math.min(100, (runwayMonths / 12) * 100);
  const health = getRunwayHealth(runwayMonths);

  const limitLabel = `${runwayMonths} bln / 12 bln`;

  return (
    <div
      className={cn(
        "rounded-card bg-surface p-6 flex flex-col gap-5",
        "transition-all duration-300 hover:shadow-neon hover:scale-[1.005]",
        className,
      )}
    >
      {/* title */}
      <p className="text-base font-bold text-text-primary">Dompet Kas</p>

      {/* middle: card + arrows + stats */}
      <div className="flex items-center gap-4">
        {/* left arrow */}
        <button
          type="button"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-fammi-100 hover:text-fammi transition-colors"
          aria-label="Sebelumnya"
        >
          <ChevronLeft />
        </button>

        {/* physical card */}
        <div className="flex-1 min-w-0">
          <CreditCard cardHolder={cardHolder} cardExpiry={cardExpiry} />
        </div>

        {/* right arrow */}
        <button
          type="button"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-fammi-100 hover:text-fammi transition-colors"
          aria-label="Berikutnya"
        >
          <ChevronRight />
        </button>

        {/* stats */}
        <div className="shrink-0 flex flex-col gap-3 min-w-[140px]">
          {/* saldo kas */}
          <div>
            <p className="font-mono text-xl font-bold text-text-primary tabular-nums">
              {formatIDR(animatedBalance)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Saldo Kas</p>
          </div>

          <div className="h-px bg-fammi-100" />

          {/* pemasukan */}
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowUp className="text-success" />
              <p className="font-mono text-sm font-semibold text-success tabular-nums">
                {formatIDR(animatedIncome)}
              </p>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">Pemasukan</p>
          </div>

          {/* pengeluaran */}
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowDown className="text-danger" />
              <p className="font-mono text-sm font-semibold text-danger tabular-nums">
                {formatIDR(animatedBurn)}
              </p>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">Pengeluaran</p>
          </div>

          <div className="h-px bg-fammi-100" />

          {/* toggle runway status */}
          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-xs font-medium", health.color)}>
              {health.label}
            </span>
            <span
              className={cn(
                "w-9 h-5 rounded-full relative transition-colors",
                runwayMonths > THRESHOLDS.RUNWAY_WARNING ? "bg-success" : "bg-danger",
              )}
              role="img"
              aria-label={`Runway ${health.label}`}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  runwayMonths > THRESHOLDS.RUNWAY_WARNING ? "right-0.5" : "left-0.5",
                )}
              />
            </span>
          </div>
        </div>
      </div>

      {/* bottom: runway progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Runway tersisa</span>
          <span className={cn("font-semibold", health.color)}>{limitLabel}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-fammi-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", health.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
