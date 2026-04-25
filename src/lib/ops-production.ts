/**
 * Kalkulasi beban produksi laporan per periode.
 *
 * Setiap card dihitung INDEPENDEN berdasarkan kolom deadline-nya masing-masing:
 *
 * Rapor Walas    → cek deliverWalas   (WALAS_DEADLINE_PENGIRIMAN_LAPORAN | DEADLINE_WALAS_KIRIM_RAPOR)
 *                  → jika ada, sum JML_KELAS
 *
 * Rapor Individu → cek deliverIndividu (INDIIVDU_DEADLINE_... | DEADLINE_INDIVIDU_KIRIM_RAPOR | DEADLINE_KIRIM_RAPOR)
 *                  + deliverOrtu untuk CP (DEADLINE_KIRIM_RAPOR)
 *                  → jika ada, sum JML_SISWA
 *
 * Rapor Kepsek   → cek deliverKepsek  (KEPSEK_DEADLINE_PENGIRIMAN_LAPORAN | DEADLINE_KEPSEK_KIRIM_RAPOR)
 *                  → jika ada, count rows (1 per sekolah)
 */

import type { ISchoolDelivery } from "@/types";

// ── Period utilities ──────────────────────────────────────────────────────────

export type PeriodPreset = "pekan-ini" | "pekan-depan" | "bulan-ini" | "bulan-depan" | "bulan-custom";

export interface PeriodRange {
  preset: PeriodPreset;
  start: Date;
  end: Date;
  label: string;
  sublabel: string;
}

export function getPeriodRange(preset: PeriodPreset): PeriodRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "pekan-ini": {
      const dow = today.getDay();
      const daysToMon = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(today);
      mon.setDate(today.getDate() + daysToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { preset, start: mon, end: sun, label: "Pekan Ini",   sublabel: fmtRange(mon, sun) };
    }
    case "pekan-depan": {
      const dow = today.getDay();
      const daysToMon = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(today);
      mon.setDate(today.getDate() + daysToMon + 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { preset, start: mon, end: sun, label: "Pekan Depan", sublabel: fmtRange(mon, sun) };
    }
    case "bulan-ini": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { preset, start, end, label: "Bulan Ini",   sublabel: fmtRange(start, end) };
    }
    case "bulan-depan": {
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end   = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { preset, start, end, label: "Bulan Depan", sublabel: fmtRange(start, end) };
    }
    case "bulan-custom":
      return getCustomMonthsRange(3);
  }
}

export function getCustomMonthsRange(months: number): PeriodRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth() + months, today.getDate() - 1);
  return {
    preset: "bulan-custom",
    start: today,
    end,
    label: `${months} Bulan Ke Depan`,
    sublabel: fmtRange(today, end),
  };
}

function fmtRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("id-ID", opts)} – ${end.toLocaleDateString("id-ID", opts)}`;
}

// ── Production computation ────────────────────────────────────────────────────

/** Satu baris di expanded list = satu deadline event (sekolah + kategori) */
export interface ProductionItem {
  schoolName:   string;
  produk:       string;
  /** Kategori deadline yang menyebabkan baris ini masuk periode */
  category:     "walas" | "individu" | "kepsek";
  /** Jumlah laporan: jumlahKelas (walas) | jumlahSiswa (individu) | 1 (kepsek) */
  count:        number;
  /** Apakah count berasal dari data JML_SISWA yang valid */
  hasSiswa:     boolean;
  triggerDate:  string;   // ISO date
  triggerLabel: string;   // Deskripsi singkat
  alreadyDone:  boolean;  // Sudah dikirim?
}

export interface ProductionSummary {
  period:             PeriodRange;
  /** Sum JML_KELAS untuk sekolah yang walas deadline-nya dalam periode */
  raporWalasTotal:    number;
  /** Sum JML_SISWA untuk sekolah yang individu/ortu deadline-nya dalam periode */
  raporIndividuTotal: number;
  /** Jumlah baris (sekolah) yang kepsek deadline-nya dalam periode */
  raporKepsekTotal:   number;
  /** Jumlah sekolah unik yang punya setidaknya satu deadline dalam periode */
  schoolCount:        number;
  hasSiswaData:       boolean;
  items:              ProductionItem[];
}

function inRange(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

export function computeProduction(
  deliveries: ISchoolDelivery[],
  period: PeriodRange,
): ProductionSummary {
  const { start, end } = period;
  const items: ProductionItem[] = [];
  let hasSiswaData = false;
  const uniqueSchools = new Set<string>();

  for (const d of deliveries) {
    if ((d.jumlahSiswa ?? 0) > 0) hasSiswaData = true;

    const key = `${d.schoolName}||${d.produk}`;

    // ── Rapor Walas (RK / SP only) ─────────────────────────────────────────────
    // Cek deliverWalas; jika ada dalam periode → sum JML_KELAS
    // Dihitung semua: sudah kirim (alreadyDone=true) maupun belum
    if ((d.produk === "RK" || d.produk === "SP") &&
        inRange(d.deliverWalas, start, end)) {
      items.push({
        schoolName:  d.schoolName,
        produk:      d.produk,
        category:    "walas",
        count:       d.jumlahKelas,
        hasSiswa:    false,
        triggerDate: d.deliverWalas!,
        triggerLabel: "Kirim ke wali kelas",
        alreadyDone: d.rWalas ?? false,
      });
      uniqueSchools.add(key);
    }

    // ── Rapor Individu (semua produk, termasuk CP) ─────────────────────────────
    // RK/SP: deliverIndividu
    // CP:    deliverIndividu (dari DEADLINE_KIRIM_RAPOR) atau fallback ke deliverOrtu
    // Jika ada dalam periode → sum JML_SISWA (atau JML_KELAS jika siswa tidak ada)
    // Dihitung semua: sudah kirim (alreadyDone=true) maupun belum
    const individuDate =
      d.produk === "CP"
        ? (d.deliverIndividu ?? d.deliverOrtu)
        : d.deliverIndividu;
    const individuDone =
      d.produk === "CP" ? (d.rOrtu ?? false) : (d.rIndividu ?? false);
    const siswaCount   = d.jumlahSiswa ?? 0;
    const individuCount =
      d.produk === "CP"
        ? (d.jumlahSiswa ?? d.jumlahKelas)
        : siswaCount;

    if (inRange(individuDate, start, end)) {
      items.push({
        schoolName:  d.schoolName,
        produk:      d.produk,
        category:    "individu",
        count:       individuCount,
        hasSiswa:    (d.jumlahSiswa ?? 0) > 0,
        triggerDate: individuDate!,
        triggerLabel: d.produk === "CP" ? "Kirim ke orang tua" : "Kirim ke siswa",
        alreadyDone: individuDone,
      });
      uniqueSchools.add(key);
    }

    // ── Rapor Kepsek (RK / SP only) ────────────────────────────────────────────
    // Cek deliverKepsek; jika ada dalam periode → count 1 per baris (per sekolah)
    // Dihitung semua: sudah kirim (alreadyDone=true) maupun belum
    if ((d.produk === "RK" || d.produk === "SP") &&
        inRange(d.deliverKepsek, start, end)) {
      items.push({
        schoolName:  d.schoolName,
        produk:      d.produk,
        category:    "kepsek",
        count:       1,
        hasSiswa:    false,
        triggerDate: d.deliverKepsek!,
        triggerLabel: "Kirim ke kepsek",
        alreadyDone: d.rKepsek ?? false,
      });
      uniqueSchools.add(key);
    }
  }

  // Urutkan: trigger date paling dekat dulu, lalu nama sekolah
  items.sort((a, b) =>
    a.triggerDate.localeCompare(b.triggerDate) ||
    a.schoolName.localeCompare(b.schoolName),
  );

  const walasItems    = items.filter((i) => i.category === "walas");
  const individuItems = items.filter((i) => i.category === "individu");
  const kepsekItems   = items.filter((i) => i.category === "kepsek");

  return {
    period,
    raporWalasTotal:    walasItems.reduce((s, i) => s + i.count, 0),
    raporIndividuTotal: individuItems.reduce((s, i) => s + i.count, 0),
    raporKepsekTotal:   kepsekItems.length,
    schoolCount:        uniqueSchools.size,
    hasSiswaData,
    items,
  };
}

/** Format angka ribuan: 1500 → "1.500" */
export function fmtNumber(n: number): string {
  return n.toLocaleString("id-ID");
}
