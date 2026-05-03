"use client";

import { X, CheckCircle2, Circle, Calendar, AlertTriangle, Clock, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ISchoolDelivery, DeliveryStage, TrafficLight } from "@/types";

// ── Config ────────────────────────────────────────────────────────────────────

const PRODUK_LABEL: Record<string, string> = {
  RK: "Rapor Karakter",
  CP: "Capaian Pembelajaran",
  SP: "Screening Psikologi",
};

const STAGE_ORDER: DeliveryStage[] = [
  "PERSIAPAN", "PENGISIAN", "PEMBUATAN", "PENGIRIMAN", "DISTRIBUSI", "SELESAI",
];

const STAGE_LABEL: Record<DeliveryStage, string> = {
  PERSIAPAN:  "Persiapan",
  PENGISIAN:  "Pengisian Data",
  PEMBUATAN:  "Pembuatan Rapor",
  PENGIRIMAN: "Pengiriman",
  DISTRIBUSI: "Distribusi",
  SELESAI:    "Selesai",
};

const TRAFFIC_COLOR: Record<TrafficLight, string> = {
  MERAH:  "text-danger",
  KUNING: "text-warning",
  HIJAU:  "text-success",
};

const TRAFFIC_BG: Record<TrafficLight, string> = {
  MERAH:  "bg-danger/10 border-danger/20",
  KUNING: "bg-warning/10 border-warning/20",
  HIJAU:  "bg-success/10 border-success/20",
};

const TRAFFIC_LABEL: Record<TrafficLight, string> = {
  MERAH:  "Butuh Perhatian",
  KUNING: "Perlu Dipantau",
  HIJAU:  "Tepat Jadwal",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFrom(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today().getTime()) / 86_400_000);
}

function rekomendasiAksi(d: ISchoolDelivery): string {
  if (d.isComplete) return "Sekolah ini sudah selesai. Pastikan testimoni sudah masuk.";
  if (d.selesaiInput) return "Pengisian data sudah selesai. Lanjut ke tahap pembuatan rapor.";
  const days = d.daysUntilBatasInput;
  const overdue = days !== undefined && days < 0;
  if (overdue) {
    return `Deadline sudah lewat ${Math.abs(days!)} hari. Hubungi sekolah segera dan konfirmasi status pengisian data.`;
  }
  switch (d.deliveryStage) {
    case "PERSIAPAN":
      return "Lengkapi persiapan: pastikan data siswa, sosialisasi, dan setup guru/ortu/siswa sudah beres sebelum mulai input.";
    case "PENGISIAN":
      return days !== undefined
        ? `${days} hari tersisa untuk pengisian data. Pantau progress sekolah dan ingatkan jika belum mengisi.`
        : "Pantau pengisian data sekolah. Hubungi jika ada kendala.";
    case "PEMBUATAN":
      return "Periksa kelengkapan berkas: approval walas, CODA, file Excel, dan foto jika diperlukan.";
    case "PENGIRIMAN":
      return "Kirim laporan ke wali kelas, siswa individu, dan kepala sekolah. Tandai status masing-masing.";
    case "DISTRIBUSI":
      return "Distribusikan rapor ke wali kelas, siswa, kepsek, dan orang tua. Tandai setelah selesai.";
    default:
      return "Tidak ada aksi yang diperlukan saat ini.";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MilestoneRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {done
        ? <CheckCircle2 size={15} className="text-success shrink-0" />
        : <Circle size={15} className="text-fammi-100 shrink-0" />}
      <span className={cn("text-sm", done ? "text-text-primary" : "text-text-secondary/60 line-through")}>
        {label}
      </span>
    </div>
  );
}

function MilestoneGroup({ title, items }: { title: string; items: { done: boolean; label: string }[] }) {
  const doneCount = items.filter((x) => x.done).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{title}</p>
        <span className="text-xs font-mono text-text-secondary">{doneCount}/{items.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 pl-1">
        {items.map((item, i) => <MilestoneRow key={i} {...item} />)}
      </div>
    </div>
  );
}

function DeliveryComparison({ d }: { d: ISchoolDelivery }) {
  const hasAny = d.deliverWalas || d.deliverIndividu || d.deliverKepsek || d.deliverOrtu;
  const hasTargetData =
    d.targetWalasRapor !== undefined ||
    d.targetIndividuRapor !== undefined ||
    d.targetKepsekRapor !== undefined;
  if (!hasAny && !hasTargetData) return null;

  type Row = {
    label: string;
    date?: string;
    checked: boolean;
    target?: number;
    dikirim?: number;
  };
  const rows: Row[] = [];

  if (d.produk === "RK" || d.produk === "SP") {
    rows.push({ label: "Wali kelas",  date: d.deliverWalas,    checked: d.rWalas    ?? false, target: d.targetWalasRapor,    dikirim: d.raporWalasDikirim });
    rows.push({ label: "Siswa",       date: d.deliverIndividu, checked: d.rIndividu ?? false, target: d.targetIndividuRapor, dikirim: d.raporIndividuDikirim });
    rows.push({ label: "Kepsek",      date: d.deliverKepsek,   checked: d.rKepsek   ?? false, target: d.targetKepsekRapor,   dikirim: d.raporKepsekDikirim });
  } else {
    rows.push({ label: "Orang tua",   date: d.deliverOrtu,     checked: d.rOrtu     ?? false });
  }

  const totalSisa = rows.reduce((acc, r) => {
    if (r.target === undefined) return acc;
    return acc + Math.max(0, r.target - (r.dikirim ?? 0));
  }, 0);
  const hasAnyTarget = rows.some((r) => r.target !== undefined);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Pengiriman Rapor
        </p>
        {hasAnyTarget && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            totalSisa === 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}>
            {totalSisa === 0 ? "Semua terkirim" : `Sisa ${totalSisa} laporan`}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const dayDiff = daysFrom(row.date);
          const isPast  = dayDiff !== undefined && dayDiff < 0;
          const sisa    = row.target !== undefined ? Math.max(0, row.target - (row.dikirim ?? 0)) : undefined;
          const status  = row.checked
            ? "sudah"
            : isPast ? "terlambat" : row.date ? "terjadwal" : "belum";
          const pct     = row.target ? Math.min(100, ((row.dikirim ?? 0) / row.target) * 100) : 0;

          return (
            <div key={i} className="flex flex-col gap-1.5 py-2 border-b border-fammi-100 last:border-0">
              {/* Top row: label + date + status badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {row.checked
                    ? <CheckCircle2 size={14} className="text-success shrink-0" />
                    : isPast
                      ? <AlertTriangle size={14} className="text-danger shrink-0" />
                      : <Circle size={14} className="text-fammi-200 shrink-0" />}
                  <span className="text-sm font-medium text-text-primary">{row.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {row.date && (
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Calendar size={11} />
                      {fmtDate(row.date)}
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    status === "sudah"     ? "bg-success/10 text-success"   :
                    status === "terlambat" ? "bg-danger/10 text-danger"     :
                    status === "terjadwal" ? "bg-fammi-100 text-fammi"      :
                                            "bg-fammi-50 text-text-secondary",
                  )}>
                    {status === "sudah"     ? "Sudah"     :
                     status === "terlambat" ? "Terlambat" :
                     status === "terjadwal" ? "Terjadwal" : "Belum"}
                  </span>
                </div>
              </div>

              {/* Progress bar: target vs dikirim */}
              {row.target !== undefined && (
                <div className="pl-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-secondary">
                      {row.dikirim ?? 0} dari {row.target} terkirim
                    </span>
                    {sisa !== undefined && sisa > 0 ? (
                      <span className="text-[10px] font-bold text-danger">Sisa {sisa}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-success">Lunas</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-fammi-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        sisa === 0 ? "bg-success" : "bg-fammi",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageStepper({ stage }: { stage: DeliveryStage }) {
  const current = STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGE_ORDER.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold border-2 transition-all",
              done   ? "bg-success border-success text-white"      :
              active ? "bg-fammi border-fammi text-white"          :
                       "bg-white border-fammi-100 text-fammi-200",
            )}>
              {done ? "✓" : i + 1}
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div className={cn("h-0.5 w-4", done ? "bg-success" : "bg-fammi-100")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface OpsSchoolModalProps {
  delivery: ISchoolDelivery | null;
  onClose: () => void;
}

export function OpsSchoolModal({ delivery: d, onClose }: OpsSchoolModalProps) {
  if (!d) return null;

  const produkLabel = PRODUK_LABEL[d.produk] ?? d.produk;
  const aksi = rekomendasiAksi(d);

  // Helper: hanya masukkan item jika kolom memang ada di spreadsheet (bukan undefined)
  function opt(v: boolean | undefined, label: string): { done: boolean; label: string }[] {
    return v !== undefined ? [{ done: v, label }] : [];
  }

  // Persiapan — tampilkan hanya kolom yang ada (undefined = tidak ada checkbox di sheet)
  const persiapanItems: { done: boolean; label: string }[] = [
    { done: d.dataSiswa, label: "Data siswa" },
    ...opt(d.dataGuru,    "Data guru"),
    ...opt(d.sosialisasi, "Sosialisasi"),
    ...opt(d.setupGuru,   "Setup guru"),
    ...opt(d.setupOrtu,   "Setup ortu"),
    ...opt(d.setupSiswa,  "Setup siswa"),
  ];

  // Pengisian — mulaiInput ada tanggal = sudah mulai; selesaiInput hanya muncul jika ada kolomnya
  const pengisianItems: { done: boolean; label: string }[] = [
    { done: !!d.mulaiInput, label: "Mulai input" },
    ...opt(d.selesaiInput,  "Selesai input"),
  ];

  const kelengkapanItems: { done: boolean; label: string }[] = [];
  if (d.produk === "RK") {
    if (d.approval !== undefined) kelengkapanItems.push({ done: d.approval, label: "Approval" });
    if (d.coda          !== undefined) kelengkapanItems.push({ done: d.coda,           label: "CODA" });
    if (d.excel         !== undefined) kelengkapanItems.push({ done: d.excel,          label: "File Excel" });
  } else if (d.produk === "CP") {
    if (d.foto  !== undefined) kelengkapanItems.push({ done: d.foto,  label: "Foto" });
    if (d.excel !== undefined) kelengkapanItems.push({ done: d.excel, label: "File Excel" });
  } else {
    if (d.coda  !== undefined) kelengkapanItems.push({ done: d.coda,  label: "CODA" });
    if (d.excel !== undefined) kelengkapanItems.push({ done: d.excel, label: "File Excel" });
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        key="dialog"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="pointer-events-auto w-full max-w-lg max-h-[90vh] bg-white rounded-[32px] flex flex-col shadow-fammi-elevated overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-fammi-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                TRAFFIC_BG[d.trafficLight],
                TRAFFIC_COLOR[d.trafficLight],
              )}>
                {d.isComplete ? "Selesai" : TRAFFIC_LABEL[d.trafficLight]}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-fammi-100 text-fammi">
                {produkLabel}
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-tight mt-2">{d.schoolName}</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {d.jumlahKelas} kelas
              {d.jumlahSiswa ? ` · ${d.jumlahSiswa.toLocaleString("id-ID")} siswa` : ""}
              {d.tipeInput ? ` · ${d.tipeInput}` : ""}
              {d.kode ? ` · ${d.kode}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="ml-3 p-2 rounded-xl hover:bg-fammi-50 transition-colors shrink-0">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Stage stepper */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Tahap Saat Ini</p>
            <StageStepper stage={d.deliveryStage} />
            <p className="mt-2 text-xs font-semibold text-fammi">{STAGE_LABEL[d.deliveryStage]}</p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-text-secondary">Progress keseluruhan</span>
              <span className="text-xs font-mono font-bold text-text-primary">{d.progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-fammi-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  d.trafficLight === "MERAH" ? "bg-danger" : d.trafficLight === "KUNING" ? "bg-warning" : "bg-success",
                )}
                style={{ width: `${d.progressPct}%` }}
              />
            </div>
          </div>

          {/* Key dates */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Tanggal Penting</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Mulai input",   value: fmtDate(d.mulaiInput),   color: "text-success" },
                { label: "Batas input",   value: fmtDate(d.batasInput),   color: d.daysUntilBatasInput !== undefined && d.daysUntilBatasInput < 0 ? "text-danger font-semibold" : "text-text-primary" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-fammi-50 rounded-2xl p-3">
                  <p className="text-[10px] text-text-secondary mb-0.5">{label}</p>
                  <p className={cn("text-xs font-medium", color)}>{value}</p>
                </div>
              ))}
            </div>
            {d.daysUntilBatasInput !== undefined && !d.isComplete && (
              d.selesaiInput ? (
                <div className="mt-2 flex items-center gap-2 rounded-2xl px-3 py-2 border text-xs font-semibold bg-success/5 border-success/20 text-success">
                  <CheckCircle2 size={13} />
                  Pengisian sudah selesai
                </div>
              ) : (
                <div className={cn(
                  "mt-2 flex items-center gap-2 rounded-2xl px-3 py-2 border text-xs font-semibold",
                  d.daysUntilBatasInput < 0  ? "bg-danger/5 border-danger/20 text-danger" :
                  d.daysUntilBatasInput <= 3 ? "bg-danger/5 border-danger/20 text-danger" :
                  d.daysUntilBatasInput <= 7 ? "bg-warning/5 border-warning/20 text-warning" :
                                               "bg-success/5 border-success/20 text-success",
                )}>
                  {d.daysUntilBatasInput < 0
                    ? <AlertTriangle size={13} />
                    : d.daysUntilBatasInput <= 7 ? <Clock size={13} /> : <CheckCircle2 size={13} />}
                  {d.daysUntilBatasInput < 0
                    ? `Terlambat ${Math.abs(d.daysUntilBatasInput)} hari`
                    : d.daysUntilBatasInput === 0 ? "Deadline hari ini!"
                    : `${d.daysUntilBatasInput} hari tersisa`}
                </div>
              )
            )}
          </div>

          {/* Milestone checklist */}
          <div className="flex flex-col gap-5">
            <MilestoneGroup title="Persiapan" items={persiapanItems} />
            <MilestoneGroup title="Pengisian Data" items={pengisianItems} />
            {kelengkapanItems.length > 0 && (
              <MilestoneGroup title="Pembuatan" items={kelengkapanItems} />
            )}
            <MilestoneGroup
              title="Testimoni & Polling"
              items={[{ done: d.polling, label: "Polling testimoni" }]}
            />
          </div>

          {/* Delivery comparison */}
          <DeliveryComparison d={d} />

          {/* Status catatan */}
          {d.statusCatatan && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Catatan Status</p>
              <p className="text-sm text-text-primary bg-fammi-50 rounded-2xl px-4 py-3 leading-relaxed">
                {d.statusCatatan}
              </p>
            </div>
          )}

          {/* Testimoni (selesai) */}
          {d.isComplete && d.detailTestimoni && (
            <div className="bg-success/5 border border-success/15 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1.5">
                <PartyPopper size={13} /> Testimoni
              </p>
              <p className="text-sm text-success/80 italic">&ldquo;{d.detailTestimoni}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Sticky footer — recommended action */}
        <div className="border-t border-fammi-100 p-4 bg-fammi-50">
          <p className="text-[10px] font-bold text-fammi uppercase tracking-wider mb-1.5">
            Tindakan Selanjutnya
          </p>
          <p className="text-sm text-text-primary leading-snug">{aksi}</p>
        </div>
      </motion.div>
      </div>
    </AnimatePresence>
  );
}
