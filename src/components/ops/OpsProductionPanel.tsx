"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Users, Crown,
  ChevronDown, ChevronUp, Info, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getPeriodRange,
  getCustomMonthsRange,
  computeProduction,
  fmtNumber,
  type PeriodPreset,
  type ProductionSummary,
  type ProductionItem,
} from "@/lib/ops-production";
import type { ISchoolDelivery } from "@/types";

// ── Config ─────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { key: PeriodPreset; label: string }[] = [
  { key: "pekan-ini",    label: "Pekan Ini" },
  { key: "pekan-depan",  label: "Pekan Depan" },
  { key: "bulan-ini",    label: "Bulan Ini" },
  { key: "bulan-depan",  label: "Bulan Depan" },
  { key: "bulan-custom", label: "Kustom" },
];

const CUSTOM_MONTH_OPTIONS = [2, 3, 4, 5, 6, 9, 12];

const PRODUK_CHIP: Record<string, string> = {
  RK: "bg-fammi-100 text-fammi-dark",
  CP: "bg-pink-100 text-pink-700",
  SP: "bg-blue-100 text-blue-700",
};

const CATEGORY_STYLE: Record<
  ProductionItem["category"],
  { chip: string; label: string }
> = {
  walas:    { chip: "bg-fammi-50 text-fammi",       label: "kelas"  },
  individu: { chip: "bg-blue-50 text-blue-600",     label: "siswa"  },
  kepsek:   { chip: "bg-warning/10 text-warning",   label: "kepsek" },
};

// ── Metric card ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  sublabel: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  faded?: boolean;
}

function MetricCard({ label, sublabel, value, unit, icon: Icon, color, bg, border, faded }: MetricCardProps) {
  return (
    <div className={cn(
      "rounded-card p-5 border flex flex-col gap-3",
      "transition-all duration-200 hover:shadow-neon hover:scale-[1.015]",
      bg, border,
      faded && "opacity-50",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70">
          <Icon size={16} className={color} />
        </div>
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", color)}>
          {unit}
        </span>
      </div>
      <div>
        <p className={cn("text-3xl font-bold font-mono tabular-nums leading-none", color)}>
          {fmtNumber(value)}
        </p>
        <p className="text-xs font-semibold text-text-primary mt-1">{label}</p>
        <p className="text-[10px] text-text-secondary mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

// ── Per-school breakdown row ───────────────────────────────────────────────────

function ItemRow({ item }: { item: ProductionItem }) {
  const fmtDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const style = CATEGORY_STYLE[item.category];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-fammi-50 last:border-0">
      {/* Produk badge */}
      <span className={cn(
        "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5",
        PRODUK_CHIP[item.produk] ?? "bg-gray-100 text-gray-600",
      )}>
        {item.produk}
      </span>

      {/* School name + trigger */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary leading-tight truncate">
          {item.schoolName}
        </p>
        <p className="text-[10px] text-text-secondary mt-0.5">
          {item.triggerLabel} ·{" "}
          <span className="font-medium text-text-primary">{fmtDate(item.triggerDate)}</span>
        </p>
      </div>

      {/* Count chip */}
      <span className={cn(
        "shrink-0 text-[10px] font-mono font-semibold px-2 py-1 rounded-xl",
        item.alreadyDone ? "bg-success/10 text-success line-through" : style.chip,
      )}>
        {item.category === "kepsek"
          ? `1 ${style.label}`
          : `${fmtNumber(item.count)} ${style.label}`
        }
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface OpsProductionPanelProps {
  deliveries: ISchoolDelivery[];
  hasSiswaData?: boolean;
}

export function OpsProductionPanel({ deliveries, hasSiswaData }: OpsProductionPanelProps) {
  const [preset, setPreset] = useState<PeriodPreset>("pekan-ini");
  const [customMonths, setCustomMonths] = useState(3);
  const [expanded, setExpanded] = useState(false);

  const summary: ProductionSummary = useMemo(() => {
    const period = preset === "bulan-custom"
      ? getCustomMonthsRange(customMonths)
      : getPeriodRange(preset);
    return computeProduction(deliveries, period);
  }, [deliveries, preset, customMonths]);

  const showSiswaHint = !hasSiswaData;
  const hasAny = summary.schoolCount > 0;

  return (
    <div className="rounded-[32px] bg-white border border-fammi-100 p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-primary">Beban Produksi Rapor</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Sekolah dengan deadline dalam periode ini
          </p>
        </div>

        {/* Period selector */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-fammi-50 rounded-2xl overflow-x-auto max-w-full">
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  preset === key
                    ? "bg-white text-fammi shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom months sub-row */}
          <AnimatePresence>
            {preset === "bulan-custom" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 p-1 bg-fammi-50 rounded-2xl"
              >
                {CUSTOM_MONTH_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setCustomMonths(m)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all tabular-nums",
                      customMonths === m
                        ? "bg-white text-fammi shadow-sm"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {m} bln
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Period sublabel */}
      <p className="text-xs text-text-secondary -mt-2">
        {summary.period.sublabel}
      </p>

      {/* Hint: jumlahSiswa tidak tersedia */}
      {showSiswaHint && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3">
          <Info size={14} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Kolom <span className="font-semibold">Jumlah Siswa</span> belum tersedia di spreadsheet.
            Tambahkan kolom dengan header &quot;Jumlah Siswa&quot; agar rapor individu bisa dihitung otomatis.
          </p>
        </div>
      )}

      {/* Metric grid — 3 cards */}
      {hasAny ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="Rapor Wali Kelas"
            sublabel="RK + SP (per kelas)"
            value={summary.raporWalasTotal}
            unit="Laporan"
            icon={BookOpen}
            color="text-fammi"
            bg="bg-fammi-50"
            border="border-fammi-200"
          />
          <MetricCard
            label="Rapor Individu"
            sublabel={hasSiswaData ? "RK + SP + CP (per siswa)" : "Perlu kolom jumlahSiswa"}
            value={summary.raporIndividuTotal}
            unit="Laporan"
            icon={Users}
            color="text-blue-600"
            bg="bg-blue-50"
            border="border-blue-200"
            faded={!hasSiswaData}
          />
          <MetricCard
            label="Rapor Kepsek"
            sublabel="RK + SP (per sekolah)"
            value={summary.raporKepsekTotal}
            unit="Laporan"
            icon={Crown}
            color="text-warning"
            bg="bg-warning/5"
            border="border-warning/20"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold text-text-primary text-sm">Tidak ada deadline di periode ini</p>
          <p className="text-xs text-text-secondary mt-1">
            Coba pilih periode lain untuk melihat beban produksi.
          </p>
        </div>
      )}

      {/* Sekolah count + expand toggle */}
      {hasAny && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-between w-full rounded-2xl bg-fammi-50 px-4 py-2.5 hover:bg-fammi-100 transition-colors"
        >
          <span className="text-xs font-semibold text-text-primary">
            {summary.schoolCount} sekolah masuk periode ini
          </span>
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            {expanded ? "Sembunyikan" : "Lihat rincian"}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>
      )}

      {/* Expanded: per-school breakdown */}
      <AnimatePresence>
        {expanded && hasAny && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mb-3 px-1">
              <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">
                Legenda:
              </span>
              <span className="flex items-center gap-1 text-[10px] text-fammi bg-fammi-50 px-2 py-0.5 rounded-full font-semibold">
                <BookOpen size={9} /> Walas (kelas)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                <Users size={9} /> Individu (siswa)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded-full font-semibold">
                <Crown size={9} /> Kepsek (1/sekolah)
              </span>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
              {summary.items.map((item, i) => (
                <ItemRow key={`${item.category}-${item.produk}-${item.schoolName}-${i}`} item={item} />
              ))}
            </div>

            {/* Total row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-fammi-100">
              <span className="text-xs font-bold text-text-primary">Total keseluruhan</span>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {summary.raporWalasTotal > 0 && (
                  <span className="text-xs font-mono font-bold text-fammi bg-fammi-50 px-2 py-1 rounded-xl">
                    {fmtNumber(summary.raporWalasTotal)} walas
                  </span>
                )}
                {summary.raporIndividuTotal > 0 && (
                  <span className={cn(
                    "text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-xl",
                    !hasSiswaData && "opacity-50",
                  )}>
                    {fmtNumber(summary.raporIndividuTotal)} individu
                  </span>
                )}
                {summary.raporKepsekTotal > 0 && (
                  <span className="text-xs font-mono font-bold text-warning bg-warning/10 px-2 py-1 rounded-xl">
                    {summary.raporKepsekTotal} kepsek
                  </span>
                )}
              </div>
            </div>

            {/* Note when no siswa data */}
            {showSiswaHint && summary.raporIndividuTotal > 0 && (
              <div className="flex items-start gap-2 mt-3 rounded-xl bg-fammi-50 px-3 py-2">
                <AlertCircle size={12} className="text-text-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Rapor individu belum bisa dihitung akurat karena data jumlah siswa tidak tersedia.
                  Tambahkan kolom &quot;Jumlah Siswa&quot; di spreadsheet.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
