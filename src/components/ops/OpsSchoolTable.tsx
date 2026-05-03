"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { computeNextDeadline, effectiveTrafficLight, daysLabelShort } from "@/lib/ops-urgency";
import type { ISchoolDelivery, TrafficLight, DeliveryStage } from "@/types";

const STAGE_LABEL: Record<DeliveryStage, string> = {
  PERSIAPAN:  "Persiapan",
  PENGISIAN:  "Pengisian",
  PEMBUATAN:  "Pembuatan",
  PENGIRIMAN: "Pengiriman",
  DISTRIBUSI: "Distribusi",
  SELESAI:    "Selesai",
};

const STAGE_COLOR: Record<DeliveryStage, string> = {
  PERSIAPAN:  "bg-gray-100 text-gray-600",
  PENGISIAN:  "bg-blue-100 text-blue-700",
  PEMBUATAN:  "bg-fammi-100 text-fammi",
  PENGIRIMAN: "bg-warning/10 text-warning",
  DISTRIBUSI: "bg-orange-100 text-orange-700",
  SELESAI:    "bg-success/10 text-success",
};

const PRODUK_LABEL: Record<string, string> = {
  RK: "Rapor Karakter",
  CP: "Capaian Pembelajaran",
  SP: "Screening Psikologi",
};

const PRODUK_COLOR: Record<string, string> = {
  RK: "bg-fammi-100 text-fammi-dark",
  CP: "bg-pink-100 text-pink-700",
  SP: "bg-blue-100 text-blue-700",
};

const TL_BORDER: Record<TrafficLight, string> = {
  MERAH:  "border-l-danger",
  KUNING: "border-l-warning",
  HIJAU:  "border-l-success",
};

const TL_DOT: Record<TrafficLight, string> = {
  MERAH:  "bg-danger",
  KUNING: "bg-warning",
  HIJAU:  "bg-success",
};

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function SisaKirimCell({ d }: { d: ISchoolDelivery }) {
  const items: { key: string; target: number; dikirim: number }[] = [];

  if (d.produk === "RK" || d.produk === "SP") {
    if (d.targetWalasRapor !== undefined)
      items.push({ key: "Walas", target: d.targetWalasRapor, dikirim: d.raporWalasDikirim ?? 0 });
    if (d.targetIndividuRapor !== undefined)
      items.push({ key: "Individu", target: d.targetIndividuRapor, dikirim: d.raporIndividuDikirim ?? 0 });
    if (d.targetKepsekRapor !== undefined)
      items.push({ key: "Kepsek", target: d.targetKepsekRapor, dikirim: d.raporKepsekDikirim ?? 0 });
  }

  if (items.length === 0) {
    return <span className="text-[10px] text-text-secondary/30">—</span>;
  }

  const allDone = items.every(({ target, dikirim }) => dikirim >= target);
  if (allDone) {
    return <span className="text-[10px] font-semibold text-success">Lunas</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map(({ key, target, dikirim }) => {
        const sisa = Math.max(0, target - dikirim);
        if (sisa === 0) return null;
        return (
          <div key={key} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] text-text-secondary w-12 shrink-0">{key}</span>
            <span className="text-[10px] font-bold text-danger">{sisa}x lagi</span>
          </div>
        );
      })}
    </div>
  );
}

type SortKey = "no" | "schoolName" | "progressPct" | "days" | "batasInput";
type SortDir = "asc" | "desc";

function SortTh({ label, sortKey, active, dir, onSort, className }: {
  label: string; sortKey: SortKey; active: boolean; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        "px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
        "cursor-pointer select-none hover:text-text-primary whitespace-nowrap",
        className,
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          : <ChevronsUpDown size={12} className="opacity-30" />}
      </span>
    </th>
  );
}

interface OpsSchoolTableProps {
  deliveries: ISchoolDelivery[];
  onSchoolClick?: (d: ISchoolDelivery) => void;
}

export function OpsSchoolTable({ deliveries, onSchoolClick }: OpsSchoolTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("days");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  const sorted = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      if (sortKey === "days") {
        va = computeNextDeadline(a)?.days ?? 9999;
        vb = computeNextDeadline(b)?.days ?? 9999;
      } else if (sortKey === "batasInput") {
        va = a.batasInput ?? "9999"; vb = b.batasInput ?? "9999";
      } else if (sortKey === "progressPct") {
        va = a.progressPct; vb = b.progressPct;
      } else if (sortKey === "schoolName") {
        va = a.schoolName; vb = b.schoolName;
      } else {
        va = a.no; vb = b.no;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [deliveries, sortKey, sortDir]);

  return (
    <div className="w-full overflow-x-auto rounded-[24px] border border-fammi-100 bg-white">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-fammi-100 bg-fammi-50/60">
            <th className="w-10 pl-5 pr-2 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide">#</th>
            <SortTh label="Sekolah"     sortKey="schoolName"  active={sortKey === "schoolName"}  dir={sortDir} onSort={handleSort} />
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">Produk</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">Tahap</th>
            <SortTh label="Progress"    sortKey="progressPct" active={sortKey === "progressPct"} dir={sortDir} onSort={handleSort} />
            <SortTh label="Batas Input" sortKey="batasInput"  active={sortKey === "batasInput"}  dir={sortDir} onSort={handleSort} />
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">Deliver</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">Sisa Kirim</th>
            <SortTh label="Sisa"        sortKey="days"        active={sortKey === "days"}        dir={sortDir} onSort={handleSort} />
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">Kelas / Siswa</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, idx) => {
            const tl   = effectiveTrafficLight(d);
            const next = computeNextDeadline(d);
            const overdue  = next && next.days < 0;
            const critical = next && next.days >= 0 && next.days <= 3;
            const warning  = next && next.days > 3  && next.days <= 7;
            const deliverDate = d.deliverWalas ?? d.deliverOrtu ?? d.deliverIndividu;

            return (
              <tr
                key={`${d.produk}-${d.no}`}
                onClick={() => onSchoolClick?.(d)}
                className={cn(
                  "border-b border-fammi-50 border-l-4 transition-colors last:border-b-0",
                  onSchoolClick && "cursor-pointer hover:bg-fammi-50/50",
                  TL_BORDER[tl],
                )}
              >
                {/* # */}
                <td className="pl-5 pr-2 py-3 font-mono text-[11px] text-text-secondary/50">{idx + 1}</td>

                {/* Sekolah */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TL_DOT[tl])} />
                    <span className="font-semibold text-text-primary text-xs max-w-[200px] truncate">
                      {d.schoolName}
                    </span>
                  </div>
                </td>

                {/* Produk */}
                <td className="px-3 py-3">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", PRODUK_COLOR[d.produk] ?? "bg-gray-100 text-gray-600")}>
                    {PRODUK_LABEL[d.produk] ?? d.produk}
                  </span>
                </td>

                {/* Tahap */}
                <td className="px-3 py-3">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap", STAGE_COLOR[d.deliveryStage])}>
                    {STAGE_LABEL[d.deliveryStage]}
                  </span>
                </td>

                {/* Progress */}
                <td className="px-3 py-3 min-w-[110px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-fammi-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          tl === "MERAH" ? "bg-danger" : tl === "KUNING" ? "bg-warning" : "bg-success")}
                        style={{ width: `${d.progressPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-text-primary w-8 text-right shrink-0">
                      {d.progressPct}%
                    </span>
                  </div>
                </td>

                {/* Batas Input */}
                <td className="px-3 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                  {fmtDate(d.batasInput)}
                </td>

                {/* Deliver */}
                <td className="px-3 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                  {fmtDate(deliverDate)}
                </td>

                {/* Sisa Kirim */}
                <td className="px-3 py-3">
                  <SisaKirimCell d={d} />
                </td>

                {/* Sisa */}
                <td className="px-3 py-3">
                  {next ? (
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap w-fit",
                        overdue  ? "bg-danger text-white"        :
                        critical ? "bg-danger/10 text-danger"    :
                        warning  ? "bg-warning/10 text-warning"  :
                                   "bg-fammi-50 text-text-secondary",
                      )}>
                        {daysLabelShort(next.days)}
                      </span>
                      <span className="text-[9px] text-text-secondary/50 pl-0.5 truncate max-w-[100px]">
                        {next.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-text-secondary/30">—</span>
                  )}
                </td>

                {/* Kelas / Siswa */}
                <td className="px-3 py-3 text-[11px] text-text-secondary whitespace-nowrap">
                  {d.jumlahKelas > 0
                    ? `${d.jumlahKelas} kelas${d.jumlahSiswa ? ` · ${d.jumlahSiswa.toLocaleString("id-ID")} siswa` : ""}`
                    : "—"}
                </td>

                {/* Catatan */}
                <td className="px-3 py-3 text-[11px] text-text-secondary max-w-[200px]">
                  <span className="line-clamp-2 leading-relaxed">
                    {d.statusCatatan || (d.isComplete && d.detailTestimoni ? `"${d.detailTestimoni}"` : "") || "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
