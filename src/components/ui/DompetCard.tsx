"use client";

import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";
import { useCountUp } from "@/hooks/use-count-up";
import { useFinanceHealth } from "@/hooks/use-finance";
import { formatRupiah, formatPct } from "@/lib/format";
import { ROUTES, THRESHOLDS } from "@/lib/constants";

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

  const runwayCount = useCountUp(data?.runway ?? 0, 1400);
  const status = data ? runwayStatus(data.runway) : "hijau";

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
          label={data ? runwayLabel(data.runway) : "—"}
          className="bg-white/15 border-white/20 text-white"
        />
      </div>

      {/* Center: runway besar */}
      <div className="flex-1 flex flex-col justify-center mb-6">
        <div className="flex items-end gap-2">
          <span className="font-mono text-7xl font-bold text-white tabular-nums leading-none">
            {data ? runwayCount : "—"}
          </span>
          {data && <span className="text-white/70 text-lg mb-2">bln</span>}
        </div>
        <p className="text-white/60 text-sm mt-1">bulan operasional tersisa</p>
      </div>

      {/* Bottom row: 3 mini stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Cashflow</p>
          <p className="font-mono text-sm font-semibold text-white">
            {data ? formatPct(data.cashflowPct) : "—"}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Opex Ratio</p>
          <p className={cn(
            "font-mono text-sm font-semibold",
            (data?.opexRatio ?? 0) < 0.7 ? "text-success" : "text-warning",
          )}>
            {data?.opexRatio != null ? formatPct(data.opexRatio * 100) : "—"}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Pipeline</p>
          <p className="font-mono text-sm font-semibold text-white truncate">
            {data?.wpvTotal != null ? formatRupiah(data.wpvTotal) : "—"}
          </p>
        </div>
      </div>
    </button>
  );
}
