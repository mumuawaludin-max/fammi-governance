import { AlertTriangle, Clock, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ISchoolDelivery, DeliveryStage, TrafficLight } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<DeliveryStage, string> = {
  BELUM_MULAI: "Belum Mulai",
  PERSIAPAN: "Persiapan",
  PENGERJAAN: "Pengerjaan",
  LAPORAN: "Laporan",
  PAPARAN: "Paparan",
  SELESAI: "Selesai",
};

const PRODUK_LABELS: Record<string, { label: string; color: string }> = {
  RAPOR_KARAKTER: { label: "Rapor Karakter", color: "bg-fammi-100 text-fammi-dark" },
  SCREENING: { label: "Screening", color: "bg-blue-100 text-blue-700" },
  RAPOR_PAUD: { label: "Rapor PAUD", color: "bg-pink-100 text-pink-700" },
};

const TRAFFIC_CONFIG: Record<TrafficLight, { bar: string; border: string; dot: string; label: string }> = {
  MERAH: { bar: "bg-danger", border: "border-l-danger", dot: "bg-danger", label: "Butuh Perhatian" },
  KUNING: { bar: "bg-warning", border: "border-l-warning", dot: "bg-warning", label: "At Risk" },
  HIJAU: { bar: "bg-success", border: "border-l-success", dot: "bg-success", label: "On Track" },
};

// ── component ─────────────────────────────────────────────────────────────────

interface OpsSchoolCardProps {
  delivery: ISchoolDelivery;
}

export function OpsSchoolCard({ delivery }: OpsSchoolCardProps) {
  const { bar, border, dot, label } = TRAFFIC_CONFIG[delivery.trafficLight];
  const produk = PRODUK_LABELS[delivery.produk] ?? { label: delivery.produk, color: "bg-gray-100 text-gray-700" };
  const isSelesai = delivery.deliveryStage === "SELESAI";
  const isCritical = delivery.hariTersisa <= 3 && !isSelesai;

  return (
    <div
      className={cn(
        "rounded-[28px] bg-white border border-fammi-100 border-l-4 p-5",
        "transition-all duration-200 hover:shadow-fammi-hover hover:scale-[1.01]",
        border,
      )}
    >
      {/* Top row: name + produk badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2 w-2 shrink-0 rounded-full mt-0.5", dot)} />
          <p className="text-sm font-semibold text-text-primary leading-tight truncate">
            {delivery.schoolName}
          </p>
        </div>
        <span className={cn("shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full", produk.color)}>
          {produk.label}
        </span>
      </div>

      {/* Stage + days row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-secondary bg-fammi-50 px-2 py-1 rounded-lg">
          {STAGE_LABELS[delivery.deliveryStage]}
        </span>
        {isSelesai ? (
          <div className="flex items-center gap-1 text-success">
            <Star size={12} className="fill-warning text-warning" />
            <span className="text-xs font-semibold">
              {delivery.csatScore?.toFixed(1) ?? "—"}
            </span>
          </div>
        ) : (
          <div className={cn("flex items-center gap-1", isCritical ? "text-danger" : "text-text-secondary")}>
            <Clock size={12} />
            <span className="text-xs font-semibold tabular-nums">
              {delivery.hariTersisa} hari
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isSelesai && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-text-secondary">{label}</span>
            <span className="text-[10px] font-mono font-semibold text-text-primary">
              {delivery.progressPct}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-fammi-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", bar)}
              style={{ width: `${delivery.progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottleneck warning */}
      {delivery.bottleneckFlag && delivery.bottleneckDesc && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/5 border border-danger/15 p-2.5 mt-1">
          <AlertTriangle size={13} className="text-danger shrink-0 mt-0.5" />
          <p className="text-[11px] text-danger/80 leading-snug">{delivery.bottleneckDesc}</p>
        </div>
      )}
    </div>
  );
}
