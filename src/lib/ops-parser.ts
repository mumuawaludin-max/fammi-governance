/**
 * Parser: raw Apps Script row → ISchoolDelivery
 * Handles rows from 3 product sheets: Rapor Karakter (RK), Capaian Pembelajaran PAUD (CP),
 * Screening Psikologi (SP).
 */

import type { ISchoolDelivery, DeliveryStage, TrafficLight, ProductKind } from "@/types";

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

function toBool(val: string): boolean {
  return ["true", "ya", "y", "yes", "1", "✓", "x"].includes(val.toLowerCase().trim());
}

function toOptBool(val: string): boolean | undefined {
  if (!val) return undefined;
  return toBool(val);
}

function toOptStr(val: string): string | undefined {
  return val || undefined;
}

function tl(days: number | undefined, complete: boolean, selesaiInput?: boolean): TrafficLight {
  if (complete) return "HIJAU";
  if (selesaiInput) return "HIJAU";  // input sudah selesai → tidak terlambat
  if (days === undefined) return "HIJAU";
  if (days < 0) return "MERAH";
  if (days <= 3) return "MERAH";
  if (days <= 7) return "KUNING";
  return "HIJAU";
}

export function parseOpsRow(row: Record<string, string>, produk: ProductKind, no: number): ISchoolDelivery | null {
  const schoolName = pick(row, "schoolName", "Nama Sekolah", "School Name");
  if (!schoolName) return null;

  const jumlahKelas = parseInt(pick(row, "jumlahKelas", "Jumlah Kelas"), 10) || 0;
  const jumlahSiswaRaw = pick(row, "jumlahSiswa", "Jumlah Siswa", "JML_SISWA", "jmlSiswa");
  const jumlahSiswa = jumlahSiswaRaw !== ""
    ? (parseInt(jumlahSiswaRaw, 10) || 0)
    : undefined;
  const progress    = parseFloat(pick(row, "progressPct", "Progress", "Progress (%)")) || 0;
  const daysRaw     = pick(row, "daysUntilBatasInput", "Hari Tersisa");
  const daysUntilBatasInput = daysRaw ? parseInt(daysRaw, 10) : undefined;
  const isComplete   = toBool(pick(row, "isComplete", "Selesai", "Complete"));
  const selesaiInput = toOptBool(pick(row, "selesaiInput", "Selesai Input", "Set"));

  return {
    no,
    produk,
    schoolName,
    jumlahKelas,
    jumlahSiswa,
    tipeInput: toOptStr(pick(row, "tipeInput", "Tipe Input")),

    dataSiswa:   toBool(pick(row, "dataSiswa",  "Data Siswa")),
    sosialisasi: toOptBool(pick(row, "sosialisasi", "Sosialisasi")),
    setupGuru:   toOptBool(pick(row, "setupGuru",   "Setup Guru")),
    setupOrtu:   toOptBool(pick(row, "setupOrtu",   "Setup Ortu")),
    setupSiswa:  toOptBool(pick(row, "setupSiswa",  "Setup Siswa")),

    mulaiInput:    toOptStr(pick(row, "mulaiInput",    "Mulai Input")),
    batasInput:    toOptStr(pick(row, "batasInput",    "Batas Input")),
    selesaiInput,
    // Nama baru (Code.gs baru) diutamakan; fallback ke nama lama untuk backward compat
    deliverWalas:    toOptStr(pick(row, "deliverWalas",    "deliverRapor1", "Deliver Rapor 1", "Deliver Rapor")),
    deliverIndividu: toOptStr(pick(row, "deliverIndividu", "deliverRapor2", "Deliver Rapor 2")),
    deliverKepsek:   toOptStr(pick(row, "deliverKepsek",   "deliverRapor3", "Deliver Rapor 3")),
    deliverOrtu:     toOptStr(pick(row, "deliverOrtu")),

    statusCatatan: toOptStr(pick(row, "statusCatatan", "Catatan", "Status Catatan", "keterangan")),

    approval:             toOptBool(pick(row, "approval",             "Walas Approval")),
    coda:                 toOptBool(pick(row, "coda",                 "CODA", "Pembuatan CODA")),
    excel:                toOptBool(pick(row, "excel",                "Excel", "Pembuatan Excel")),
    foto:                 toOptBool(pick(row, "foto",                 "Foto")),
    excelApproval:        toOptBool(pick(row, "excelApproval",        "Excel Approval")),
    codaPembuatanRapor:   toOptBool(pick(row, "codaPembuatanRapor",   "CODA Pembuatan Rapor")),
    pluginPembuatanRapor: toOptBool(pick(row, "pluginPembuatanRapor", "Plugin Pembuatan Rapor")),

    rWalas:    toOptBool(pick(row, "rWalas",    "Walas Status Pengiriman")),
    rIndividu: toOptBool(pick(row, "rIndividu", "Individu Status Pengiriman")),
    rKepsek:   toOptBool(pick(row, "rKepsek",   "Kepsek Status Pengiriman")),
    rOrtu:     toOptBool(pick(row, "rOrtu",     "R Ortu")),

    deadlinePaparanKepsek: toOptStr(pick(row, "deadlinePaparanKepsek")),
    statusPaparanKepsek:   toOptBool(pick(row, "statusPaparanKepsek")),
    deadlinePaparanWalas:  toOptStr(pick(row, "deadlinePaparanWalas")),
    statusPaparanWalas:    toOptBool(pick(row, "statusPaparanWalas")),
    deadlinePaparanOrtu:   toOptStr(pick(row, "deadlinePaparanOrtu")),
    statusPaparanOrtu:     toOptBool(pick(row, "statusPaparanOrtu")),

    polling:         toBool(pick(row, "polling", "Polling")),
    detailTestimoni: toOptStr(pick(row, "detailTestimoni", "Testimoni")),

    deliveryStage: (pick(row, "deliveryStage", "Stage") || "PERSIAPAN") as DeliveryStage,
    trafficLight:  (pick(row, "trafficLight",  "Traffic") || tl(daysUntilBatasInput, isComplete, selesaiInput)) as TrafficLight,
    progressPct:   Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress)),
    daysUntilBatasInput,
    isComplete,
  };
}
