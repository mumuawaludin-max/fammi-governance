"use client";

import { useRef } from "react";
import { ChevronRight, AlertTriangle, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import { computeNextDeadline, effectiveTrafficLight, daysLabelShort } from "@/lib/ops-urgency";
import type { ISchoolDelivery } from "@/types";

// ── Urgency band config ───────────────────────────────────────────────────────

interface UrgencyBand {
  id: string;
  label: string;
  sublabel: string;
  min: number;  // inclusive
  max: number;  // inclusive (Infinity = no upper)
  iconColor: string;
  bg: string;
  border: string;
  chip: string;
}

const BANDS: UrgencyBand[] = [
  {
    id: "overdue",
    label: "Sudah Lewat Deadline",
    sublabel: "Tindak lanjut segera",
    min: -Infinity, max: -1,
    iconColor: "text-danger",
    bg: "bg-danger/5",
    border: "border-danger/20",
    chip: "bg-danger text-white",
  },
  {
    id: "hari-ini",
    label: "Hari Ini",
    sublabel: "Deadline hari ini",
    min: 0, max: 0,
    iconColor: "text-danger",
    bg: "bg-danger/5",
    border: "border-danger/20",
    chip: "bg-danger text-white",
  },
  {
    id: "besok",
    label: "Besok",
    sublabel: "Deadline esok hari",
    min: 1, max: 1,
    iconColor: "text-danger",
    bg: "bg-danger/5",
    border: "border-danger/20",
    chip: "bg-danger/80 text-white",
  },
  {
    id: "2-hari",
    label: "2 Hari Lagi",
    sublabel: "Deadline dalam 2 hari",
    min: 2, max: 2,
    iconColor: "text-danger",
    bg: "bg-danger/5",
    border: "border-danger/15",
    chip: "bg-danger/70 text-white",
  },
  {
    id: "3-hari",
    label: "3 Hari Lagi",
    sublabel: "Deadline dalam 3 hari",
    min: 3, max: 3,
    iconColor: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/20",
    chip: "bg-warning text-white",
  },
  {
    id: "1-pekan",
    label: "1 Pekan Lagi",
    sublabel: "Deadline dalam 4–7 hari",
    min: 4, max: 7,
    iconColor: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/15",
    chip: "bg-warning/80 text-white",
  },
  {
    id: "2-pekan",
    label: "2 Pekan Lagi",
    sublabel: "Deadline dalam 8–14 hari",
    min: 8, max: 14,
    iconColor: "text-fammi",
    bg: "bg-fammi-50",
    border: "border-fammi-100",
    chip: "bg-fammi text-white",
  },
  {
    id: "1-bulan",
    label: "1 Bulan Lagi",
    sublabel: "Deadline dalam 15–30 hari",
    min: 15, max: 30,
    iconColor: "text-success",
    bg: "bg-success/5",
    border: "border-success/15",
    chip: "bg-success text-white",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRODUK_CHIP: Record<string, string> = {
  RK: "bg-fammi-100 text-fammi-dark",
  CP: "bg-pink-100 text-pink-700",
  SP: "bg-blue-100 text-blue-700",
};

const PRODUK_SHORT: Record<string, string> = { RK: "RK", CP: "CP", SP: "SP" };

// ── Mini card ─────────────────────────────────────────────────────────────────

interface MiniCardProps {
  delivery: ISchoolDelivery;
  band: UrgencyBand;
  onClick: (d: ISchoolDelivery) => void;
}

function MiniCard({ delivery: d, band, onClick }: MiniCardProps) {
  const next = computeNextDeadline(d);
  const tl   = effectiveTrafficLight(d);

  return (
    <button
      onClick={() => onClick(d)}
      className={cn(
        "flex-shrink-0 w-48 rounded-[24px] p-4 border text-left",
        "transition-all duration-200 hover:shadow-fammi-hover hover:scale-[1.02]",
        band.bg, band.border,
      )}
    >
      {/* Product badge */}
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-2 inline-block", PRODUK_CHIP[d.produk] ?? "bg-gray-100")}>
        {PRODUK_SHORT[d.produk]}
      </span>

      {/* School name */}
      <p className="text-xs font-semibold text-text-primary leading-tight line-clamp-2 mb-1">
        {d.schoolName}
      </p>

      {/* Deadline label */}
      {next && (
        <p className="text-[9px] text-text-secondary/70 mb-1.5 leading-tight">{next.label}</p>
      )}

      {/* Days chip */}
      <span className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full",
        band.chip,
      )}>
        {next ? daysLabelShort(next.days) : "—"}
      </span>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full rounded-full bg-white/60 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            tl === "MERAH" ? "bg-danger" : tl === "KUNING" ? "bg-warning" : "bg-success",
          )}
          style={{ width: `${d.progressPct}%` }}
        />
      </div>
      <p className="text-[9px] text-text-secondary/70 mt-0.5 text-right font-mono">{d.progressPct}%</p>
    </button>
  );
}

// ── Band row ──────────────────────────────────────────────────────────────────

interface BandRowProps {
  band: UrgencyBand;
  deliveries: ISchoolDelivery[];
  onSchoolClick: (d: ISchoolDelivery) => void;
}

function BandRow({ band, deliveries, onSchoolClick }: BandRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div>
      {/* Band header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {band.max <= 3
            ? <AlertTriangle size={14} className={band.iconColor} />
            : band.max <= 7
              ? <Clock size={14} className={band.iconColor} />
              : <Calendar size={14} className={band.iconColor} />}
          <div>
            <span className="text-sm font-bold text-text-primary">{band.label}</span>
            <span className="ml-2 text-xs text-text-secondary">{band.sublabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", band.chip)}>
            {deliveries.length} sekolah
          </span>
          {deliveries.length > 3 && (
            <button
              onClick={scroll}
              className="p-1 rounded-full hover:bg-fammi-50 text-text-secondary"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {deliveries.map((d) => (
          <MiniCard
            key={`${d.produk}-${d.no}`}
            delivery={d}
            band={band}
            onClick={onSchoolClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface OpsUrgencySectionProps {
  deliveries: ISchoolDelivery[];
  onSchoolClick: (d: ISchoolDelivery) => void;
}

export function OpsUrgencySection({ deliveries, onSchoolClick }: OpsUrgencySectionProps) {
  // Compute next deadline for each active school, skip completed + no-deadline
  const withDeadline = deliveries
    .filter((d) => !d.isComplete)
    .map((d) => ({ d, next: computeNextDeadline(d) }))
    .filter(({ next }) => next !== null) as { d: ISchoolDelivery; next: NonNullable<ReturnType<typeof computeNextDeadline>> }[];

  const bands = BANDS.map((band) => ({
    band,
    items: withDeadline
      .filter(({ next }) => {
        const days = next.days;
        if (band.min === -Infinity) return days <= band.max;
        if (band.max === Infinity)  return days >= band.min;
        return days >= band.min && days <= band.max;
      })
      .map(({ d }) => d),
  })).filter(({ items }) => items.length > 0);

  if (bands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-semibold text-text-primary">Semua deadline aman</p>
        <p className="text-sm text-text-secondary mt-1">Tidak ada sekolah yang mendekati deadline saat ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {bands.map(({ band, items }) => (
        <BandRow
          key={band.id}
          band={band}
          deliveries={items}
          onSchoolClick={onSchoolClick}
        />
      ))}
    </div>
  );
}
