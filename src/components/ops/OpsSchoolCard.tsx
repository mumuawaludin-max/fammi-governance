import { cn } from "@/lib/cn";
import { computeNextDeadline, effectiveTrafficLight, daysLabelFull } from "@/lib/ops-urgency";
import type { ISchoolDelivery, DeliveryStage, TrafficLight } from "@/types";

// ── Config ────────────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<DeliveryStage, string> = {
  PERSIAPAN:  "Persiapan",
  PENGISIAN:  "Pengisian Data",
  PEMBUATAN:  "Pembuatan Rapor",
  PENGIRIMAN: "Pengiriman Laporan",
  DISTRIBUSI: "Distribusi Rapor",
  SELESAI:    "Selesai",
};

const PRODUK_CONFIG: Record<string, { label: string; color: string }> = {
  RK: { label: "Rapor Karakter",        color: "bg-fammi-100 text-fammi-dark" },
  CP: { label: "Capaian Pembelajaran",  color: "bg-pink-100 text-pink-700" },
  SP: { label: "Screening Psikologi",   color: "bg-blue-100 text-blue-700" },
};

const TRAFFIC_BORDER: Record<TrafficLight, string> = {
  MERAH:  "border-l-danger",
  KUNING: "border-l-warning",
  HIJAU:  "border-l-success",
};

const TRAFFIC_DOT: Record<TrafficLight, string> = {
  MERAH:  "bg-danger",
  KUNING: "bg-warning",
  HIJAU:  "bg-success",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function DaysChip({ delivery }: { delivery: ISchoolDelivery }) {
  if (delivery.isComplete) return null;
  const next = computeNextDeadline(delivery);
  if (!next) return null;

  const { days, label } = next;
  const overdue   = days < 0;
  const critical  = days >= 0 && days <= 3;
  const warning   = days > 3 && days <= 7;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums",
        overdue  ? "bg-danger text-white"           :
        critical ? "bg-danger/10 text-danger"       :
        warning  ? "bg-warning/10 text-warning"     :
                   "bg-fammi-50 text-text-secondary",
      )}>
        {daysLabelFull(days)}
      </span>
      <span className="text-[9px] text-text-secondary/60 pr-0.5">{label}</span>
    </div>
  );
}

function MilestoneDots({ delivery, trafficLight }: { delivery: ISchoolDelivery; trafficLight: import("@/types").TrafficLight }) {
  type Dot = { done: boolean; label: string };
  const dots: Dot[] = [];

  // Helper: hanya tambahkan dot jika nilai tidak undefined
  function add(v: boolean | undefined, label: string) {
    if (v !== undefined) dots.push({ done: v, label });
  }

  // Persiapan (semua produk)
  dots.push({ done: delivery.dataSiswa, label: "Data Siswa" });
  add(delivery.dataGuru,   "Data Guru");
  add(delivery.sosialisasi,"Sosialisasi");
  add(delivery.setupGuru,  "Guru Online");
  add(delivery.setupOrtu,  "Ortu Online");
  add(delivery.setupSiswa, "Siswa Online");

  // Pengisian
  dots.push({ done: delivery.selesaiInput ?? false, label: "Status Pengisian" });

  // Pembuatan
  add(delivery.approval,             "Walas Approval");
  add(delivery.coda,                 "CODA");
  add(delivery.excel,                "Excel");
  add(delivery.foto,                 "Foto");
  add(delivery.excelApproval,        "Excel Approval");
  add(delivery.codaPembuatanRapor,   "CODA Rapor");
  add(delivery.pluginPembuatanRapor, "Plugin Rapor");

  // Pengiriman
  add(delivery.rWalas,   "Kirim Walas");
  add(delivery.rIndividu,"Kirim Individu");
  add(delivery.rKepsek,  "Kirim Kepsek");
  add(delivery.rOrtu,    "Kirim Ortu");

  // Distribusi
  add(delivery.statusPaparanKepsek, "Paparan Kepsek");
  add(delivery.statusPaparanWalas,  "Paparan Walas");
  add(delivery.statusPaparanOrtu,   "Paparan Ortu");

  // Selesai
  dots.push({ done: delivery.polling, label: "Polling" });

  const done = dots.filter((x) => x.done).length;

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {dots.map((dot, i) => (
          <span
            key={i}
            title={dot.label}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              dot.done ? "bg-success" : "bg-fammi-100",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-secondary">
          {done}/{dots.length} milestone selesai
        </span>
        <span className="text-[10px] font-mono font-semibold text-text-primary">
          {delivery.progressPct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-fammi-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            trafficLight === "MERAH"  ? "bg-danger"  :
            trafficLight === "KUNING" ? "bg-warning" : "bg-success",
          )}
          style={{ width: `${delivery.progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OpsSchoolCardProps {
  delivery: ISchoolDelivery;
  onClick?: (d: ISchoolDelivery) => void;
}

export function OpsSchoolCard({ delivery, onClick }: OpsSchoolCardProps) {
  const produkCfg = PRODUK_CONFIG[delivery.produk] ?? { label: delivery.produk, color: "bg-gray-100 text-gray-700" };
  const tl        = effectiveTrafficLight(delivery);
  const borderCls = TRAFFIC_BORDER[tl];
  const dotCls    = TRAFFIC_DOT[tl];

  return (
    <div
      onClick={() => onClick?.(delivery)}
      className={cn(
        "rounded-card bg-white border border-fammi-100 border-l-4 p-6",
        "transition-all duration-200 hover:shadow-fammi-hover hover:scale-[1.01]",
        onClick && "cursor-pointer",
        borderCls,
      )}
    >
      {/* Row 1: nama + produk badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2 w-2 shrink-0 rounded-full mt-0.5", dotCls)} />
          <p className="text-sm font-semibold text-text-primary leading-tight truncate">
            {delivery.schoolName}
          </p>
        </div>
        <span className={cn("shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full", produkCfg.color)}>
          {produkCfg.label}
        </span>
      </div>

      {/* Row 2: stage + days chip */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs text-text-secondary bg-fammi-50 px-2.5 py-1 rounded-lg">
          {STAGE_LABEL[delivery.deliveryStage]}
        </span>
        <DaysChip delivery={delivery} />
      </div>

      {/* Row 3: key dates */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        {delivery.mulaiInput && (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
            <span className="text-[10px] text-text-secondary">
              Mulai: <span className="font-medium text-text-primary">{fmtDate(delivery.mulaiInput)}</span>
            </span>
          </div>
        )}
        {delivery.batasInput && (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-danger shrink-0" />
            <span className="text-[10px] text-text-secondary">
              Batas: <span className={cn(
                "font-medium",
                (delivery.daysUntilBatasInput ?? 99) < 0 ? "text-danger" : "text-text-primary",
              )}>
                {fmtDate(delivery.batasInput)}
              </span>
            </span>
          </div>
        )}
        {(delivery.deliverWalas || delivery.deliverOrtu) && (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
            <span className="text-[10px] text-text-secondary">
              Deliver: <span className="font-medium text-text-primary">{fmtDate(delivery.deliverWalas ?? delivery.deliverOrtu)}</span>
            </span>
          </div>
        )}
        {delivery.jumlahKelas > 0 && (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-fammi-300 shrink-0" />
            <span className="text-[10px] text-text-secondary">
              {delivery.jumlahKelas} kelas
              {delivery.jumlahSiswa ? ` · ${delivery.jumlahSiswa.toLocaleString("id-ID")} siswa` : ""}
              {delivery.tipeInput ? ` · ${delivery.tipeInput}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Row 4: milestone progress */}
      <MilestoneDots delivery={delivery} trafficLight={tl} />

      {/* Row 5: status catatan */}
      {delivery.statusCatatan && !delivery.isComplete && (
        <p className="mt-3 text-[11px] text-text-secondary bg-fammi-50 rounded-xl px-3 py-2 leading-snug">
          {delivery.statusCatatan}
        </p>
      )}

      {/* Row 5 (SELESAI): testimoni */}
      {delivery.isComplete && delivery.detailTestimoni && (
        <p className="mt-3 text-[11px] text-success/80 bg-success/5 border border-success/15 rounded-xl px-3 py-2 leading-snug italic">
          &ldquo;{delivery.detailTestimoni}&rdquo;
        </p>
      )}
    </div>
  );
}
