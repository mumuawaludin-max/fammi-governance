"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ISchoolDelivery } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventKind = "mulai" | "batas" | "deliver";

interface CalEvent {
  schoolName: string;
  produk: string;
  kind: EventKind;
  label: string;
  trafficLight: "MERAH" | "KUNING" | "HIJAU";
}

const KIND_COLOR: Record<EventKind, { dot: string; chip: string; label: string }> = {
  mulai:   { dot: "bg-success",  chip: "bg-success/10 text-success border-success/20",   label: "Mulai Input" },
  batas:   { dot: "bg-danger",   chip: "bg-danger/10 text-danger border-danger/20",     label: "Batas Input" },
  deliver: { dot: "bg-warning",  chip: "bg-warning/10 text-warning border-warning/20",  label: "Deliver Rapor" },
};

const PRODUK_SHORT: Record<string, string> = { RK: "RK", CP: "CP", SP: "SP" };
const HARI: string[] = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN: string[] = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

// ── Build event map ────────────────────────────────────────────────────────────

function buildEventMap(deliveries: ISchoolDelivery[]): Map<string, CalEvent[]> {
  const map = new Map<string, CalEvent[]>();

  function add(iso: string | undefined, ev: CalEvent) {
    if (!iso) return;
    const key = iso.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }

  for (const d of deliveries) {
    const base = { schoolName: d.schoolName, produk: PRODUK_SHORT[d.produk] ?? d.produk, trafficLight: d.trafficLight };
    add(d.mulaiInput,   { ...base, kind: "mulai",   label: "Mulai Input" });
    add(d.batasInput,   { ...base, kind: "batas",   label: "Batas Input" });
    add(d.deliverWalas,    { ...base, kind: "deliver", label: "Kirim ke Wali Kelas" });
    add(d.deliverIndividu, { ...base, kind: "deliver", label: "Kirim ke Siswa" });
    add(d.deliverKepsek,   { ...base, kind: "deliver", label: "Kirim ke Kepsek" });
    add(d.deliverOrtu,     { ...base, kind: "deliver", label: "Kirim ke Orang Tua" });
  }

  return map;
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

interface OpsCalendarProps {
  deliveries: ISchoolDelivery[];
}

export function OpsCalendar({ deliveries }: OpsCalendarProps) {
  const today   = new Date();
  const [year,  setYear]   = useState(today.getFullYear());
  const [month, setMonth]  = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(
    today.toISOString().slice(0, 10),
  );

  const eventMap = useMemo(() => buildEventMap(deliveries), [deliveries]);

  // Build grid: array of { date, iso, isCurrentMonth, isToday }
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = today.toISOString().slice(0, 10);
    const cells: { iso: string; day: number; curMonth: boolean }[] = [];

    // padding before
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ iso, day: d, curMonth: false });
    }
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ iso, day: d, curMonth: true });
    }
    // padding after (fill to complete rows)
    let next = 1;
    while (cells.length % 7 !== 0) {
      const nm = month + 1 > 11 ? 0 : month + 1;
      const ny = month + 1 > 11 ? year + 1 : year;
      const iso = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(next).padStart(2, "0")}`;
      cells.push({ iso, day: next++, curMonth: false });
    }

    return { cells, todayISO };
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const selectedEvents = selected ? (eventMap.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Calendar */}
      <div className="rounded-[32px] bg-white border border-fammi-100 p-6 min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-2xl hover:bg-fammi-50 transition-colors text-text-secondary"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-semibold text-text-primary">
            {BULAN[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-2xl hover:bg-fammi-50 transition-colors text-text-secondary"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {HARI.map((h) => (
            <div key={h} className="text-center text-[11px] font-semibold text-text-secondary py-1">
              {h}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {grid.cells.map((cell) => {
            const events  = eventMap.get(cell.iso) ?? [];
            const isToday = cell.iso === grid.todayISO;
            const isSel   = cell.iso === selected;
            const hasBatas   = events.some((e) => e.kind === "batas");
            const hasMulai   = events.some((e) => e.kind === "mulai");
            const hasDeliver = events.some((e) => e.kind === "deliver");

            return (
              <button
                key={cell.iso}
                onClick={() => setSelected(cell.iso === selected ? null : cell.iso)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-2xl py-2 px-1 transition-all",
                  !cell.curMonth && "opacity-30",
                  isSel  ? "bg-fammi text-white" :
                  isToday ? "bg-fammi-100 text-fammi" :
                             "hover:bg-fammi-50 text-text-primary",
                )}
              >
                <span className="text-xs font-medium leading-none">{cell.day}</span>
                {/* Event dots */}
                {events.length > 0 && (
                  <div className="flex gap-0.5">
                    {hasMulai   && <span className={cn("h-1.5 w-1.5 rounded-full", isSel ? "bg-white" : "bg-success")} />}
                    {hasBatas   && <span className={cn("h-1.5 w-1.5 rounded-full", isSel ? "bg-white" : "bg-danger")} />}
                    {hasDeliver && <span className={cn("h-1.5 w-1.5 rounded-full", isSel ? "bg-white" : "bg-warning")} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-fammi-100">
          {(Object.entries(KIND_COLOR) as [EventKind, typeof KIND_COLOR[EventKind]][]).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", v.dot)} />
              <span className="text-[11px] text-text-secondary">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event detail panel */}
      <div className="rounded-[32px] bg-white border border-fammi-100 p-6 lg:w-80 min-h-[240px]">
        {selected ? (
          <>
            <p className="text-xs font-semibold text-text-secondary mb-3">
              {new Date(selected + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-text-secondary">Tidak ada jadwal hari ini.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedEvents.map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2.5 rounded-2xl border p-3",
                      KIND_COLOR[ev.kind].chip,
                    )}
                  >
                    <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", KIND_COLOR[ev.kind].dot)} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-tight truncate">
                        {ev.schoolName}
                      </p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {ev.produk} · {ev.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-secondary">Pilih tanggal untuk melihat jadwal.</p>
        )}
      </div>
    </div>
  );
}
