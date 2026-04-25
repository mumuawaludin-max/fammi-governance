/**
 * Deadline urgency helpers — dipakai di card, urgency section, dan modal.
 *
 * Logika sequential:
 *   RK/SP: selesaiInput → rWalas → rIndividu → rKepsek
 *   CP   : selesaiInput → rOrtu
 *
 * "Next deadline" = deadline dari checklist pertama yang belum dicentang.
 * Kalau selesaiInput sudah ✓, langsung lompat ke cek rWalas, dst.
 */

import type { ISchoolDelivery, TrafficLight } from "@/types";

export interface NextDeadline {
  /** Label singkat milestone ini */
  label: string;
  /** Hari dari sekarang — negatif = terlambat */
  days: number;
  /** ISO date string yang dipakai */
  dateIso?: string;
}

function daysFromIso(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Cari deadline paling relevan: checklist terdepan yang belum dicentang
 * dan punya tanggal deadline.
 */
export function computeNextDeadline(d: ISchoolDelivery): NextDeadline | null {
  if (d.isComplete) return null;

  type Check = { done: boolean; date: string | undefined; label: string };

  const baseChecks: Check[] = d.produk === "CP"
    ? [
        { done: d.selesaiInput ?? false, date: d.batasInput,    label: "Selesai input" },
        { done: d.rOrtu        ?? false, date: d.deliverOrtu,   label: "Kirim ke orang tua" },
      ]
    : [
        // RK & SP
        { done: d.selesaiInput ?? false, date: d.batasInput,       label: "Selesai input" },
        { done: d.rWalas       ?? false, date: d.deliverWalas,     label: "Kirim ke wali kelas" },
        { done: d.rIndividu    ?? false, date: d.deliverIndividu,  label: "Kirim ke siswa" },
        { done: d.rKepsek      ?? false, date: d.deliverKepsek,    label: "Kirim ke kepsek" },
      ];

  const distribusiChecks: Check[] = [
    { done: d.statusPaparanKepsek ?? false, date: d.deadlinePaparanKepsek, label: "Paparan kepsek" },
    { done: d.statusPaparanWalas  ?? false, date: d.deadlinePaparanWalas,  label: "Paparan walas" },
    { done: d.statusPaparanOrtu   ?? false, date: d.deadlinePaparanOrtu,   label: "Paparan ortu" },
  ].filter(c => c.date !== undefined);

  const checks = [...baseChecks, ...distribusiChecks];

  for (const c of checks) {
    if (!c.done && c.date) {
      const days = daysFromIso(c.date);
      if (days !== undefined) return { label: c.label, days, dateIso: c.date };
    }
  }

  // Fallback ke daysUntilBatasInput dari API
  if (d.daysUntilBatasInput !== undefined) {
    return { label: "Batas input", days: d.daysUntilBatasInput };
  }

  return null;
}

/**
 * Traffic light berdasarkan next deadline yang paling relevan.
 * Selalu cek computeNextDeadline() tanpa bergantung pada selesaiInput —
 * penting untuk robustness: Apps Script lama bisa saja salah memetakan
 * kolom sehingga selesaiInput tidak akurat.
 *
 * Urutan pemeriksaan (lihat computeNextDeadline):
 *   batasInput → deliverWalas/Individu/Kepsek/Ortu → deadlinePaparan
 *
 * Fallback ke d.trafficLight jika tidak ada deadline yang terdeteksi.
 */
export function effectiveTrafficLight(d: ISchoolDelivery): TrafficLight {
  if (d.isComplete) return "HIJAU";

  const next = computeNextDeadline(d);
  if (next) {
    if (next.days < 0 || next.days <= 3) return "MERAH";
    if (next.days <= 7) return "KUNING";
    return "HIJAU";
  }

  return d.trafficLight;
}

/** Format label hari untuk display ringkas (mini card) */
export function daysLabelShort(days: number): string {
  if (days < 0) return `${Math.abs(days)}h terlambat`;
  if (days === 0) return "Hari ini!";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

/** Format label hari untuk display panjang (chip di card) */
export function daysLabelFull(days: number): string {
  if (days < 0) return `${Math.abs(days)} hari terlambat`;
  if (days === 0) return "Deadline hari ini!";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}
