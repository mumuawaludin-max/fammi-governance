"use client";

import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";
import { useCountUp } from "@/hooks/use-count-up";
import { useFinanceHealth } from "@/hooks/use-finance";
import { formatRupiah, formatPct } from "@/lib/format";
import { ROUTES, THRESHOLDS } from "@/lib/constants";
import type { IFinanceHealth } from "@/types";

const MOCK: IFinanceHealth = {
  runway: 7,
  cashflowPct: 72,
  burnRateChange: -8,
  rps: 350_000_000,
  dcr: 0.35,
  ccc: 42,
};

function runwayStatus(months: number): "hijau" | "kuning" | "merah" {
  if (months >= THRESHOLDS.RUNWAY_WARNING) return "hijau";
  if (months >= THRESHOLDS.RUNWAY_CRITICAL) return "kuning";
  return "merah";
}

function runwayLabel(months: number): string {
  if (months >= THRESHOLDS.RUNWAY_WARNING) return "AMAN";
  if (months >= THRESHOLDS.RUNWAY_CRITICAL) return "PERHATIAN";
  return "KRITIS";
}

export function DompetCard() {
  const router = useRouter();
  const { data, isLoading } = useFinanceHealth();
  const finance = data ?? MOCK;

  const runwayCount = useCountUp(finance.runway, 1400);
  const status = runwayStatus(finance.runway);
  const burnSign = finance.burnRateChange >= 0 ? "+" : "";

  return (
    <button
      onClick={() => router.push(ROUTES.FINANCE)}
      className={cn(
        "w-full text-left rounded-card p-8 min-h-[280px]",
        "bg-gradient-wallet",
        "flex flex-col justify-between",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-fammi-elevated",
        "cursor-pointer",
        isLoading && "opacity-80",
      )}
      aria-label="Lihat detail keuangan"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet size={28} className="text-white/90" />
          <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
            Kesehatan Keuangan
          </span>
        </div>
        <StatusBadge
          status={status}
          label={runwayLabel(finance.runway)}
          className="bg-white/15 border-white/20 text-white"
        />
      </div>

      {/* Center: runway besar */}
      <div className="flex-1 flex flex-col justify-center mb-6">
        <div className="flex items-end gap-2">
          <span className="font-mono text-7xl font-bold text-white tabular-nums leading-none">
            {runwayCount}
          </span>
          <span className="text-white/70 text-lg mb-2">bln</span>
        </div>
        <p className="text-white/60 text-sm mt-1">bulan operasional tersisa</p>
      </div>

      {/* Bottom row: 3 mini stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Cashflow</p>
          <p className="font-mono text-sm font-semibold text-white">
            {formatPct(finance.cashflowPct)}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Burn Rate</p>
          <p className={cn(
            "font-mono text-sm font-semibold",
            finance.burnRateChange <= 0 ? "text-success" : "text-warning",
          )}>
            {burnSign}{formatPct(finance.burnRateChange)}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">RPS</p>
          <p className="font-mono text-sm font-semibold text-white truncate">
            {formatRupiah(finance.rps)}
          </p>
        </div>
      </div>
    </button>
  );
}
