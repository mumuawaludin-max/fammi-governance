/**
 * Mock data matching real fammi_operations spreadsheet structure.
 * School names taken directly from screenshots (RK, CP, SP sheets).
 * Dates relative to today 2026-04-24.
 */
import type { ISchoolDelivery } from "@/types";

function tl(days: number, complete: boolean): "MERAH" | "KUNING" | "HIJAU" {
  if (complete) return "HIJAU";
  if (days < 0) return "MERAH";
  if (days <= 3) return "MERAH";
  if (days <= 7) return "KUNING";
  return "HIJAU";
}

// ── Rapor Karakter (RK) ───────────────────────────────────────────────────────
const RK: ISchoolDelivery[] = [
  {
    no: 1, produk: "RK", schoolName: "TK Telkom Makasar", jumlahKelas: 6,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-09", batasInput: "2026-04-23",
    statusCatatan: "perlu cek pengisian",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: "MERAH", progressPct: 34,
    daysUntilBatasInput: -1, isComplete: false,
  },
  {
    no: 2, produk: "RK", schoolName: "TK Telkom Palembang", jumlahKelas: 6,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-10", batasInput: "2026-04-23",
    statusCatatan: "perlu cek pengisian",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: "MERAH", progressPct: 34,
    daysUntilBatasInput: -1, isComplete: false,
  },
  {
    no: 9, produk: "RK", schoolName: "SD Telkom Makasar", jumlahKelas: 20,
    dataSiswa: true, sosialisasi: true, setupGuru: false, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-14", batasInput: "2026-04-23",
    statusCatatan: "baru kirim guru",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: "MERAH", progressPct: 28,
    daysUntilBatasInput: -1, isComplete: false,
  },
  {
    no: 7, produk: "RK", schoolName: "TK Telkom Bali", jumlahKelas: 2,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-15", batasInput: "2026-04-17",
    statusCatatan: "perlu cek pengisian",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: "MERAH", progressPct: 34,
    daysUntilBatasInput: -7, isComplete: false,
  },
  {
    no: 3, produk: "RK", schoolName: "TK Telkom Buah Batu", jumlahKelas: 2,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-03", batasInput: "2026-04-06",
    deliverWalas: "2026-04-21", deliverIndividu: "2026-06-03",
    statusCatatan: "selesai pengisian",
    approval: true, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PEMBUATAN", trafficLight: "MERAH", progressPct: 63,
    daysUntilBatasInput: -18, isComplete: false,
  },
  {
    no: 8, produk: "RK", schoolName: "SD Telkom Bandung", jumlahKelas: 15,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-08", batasInput: "2026-04-14",
    deliverWalas: "2026-04-21", deliverIndividu: "2026-06-03",
    statusCatatan: "selesai pengisian",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PEMBUATAN", trafficLight: "MERAH", progressPct: 56,
    daysUntilBatasInput: -10, isComplete: false,
  },
  // ─ At risk (daysLeft 1-7)
  {
    no: 15, produk: "RK", schoolName: "SMA Telkom Bandung", jumlahKelas: 35, tipeInput: "Wali Siswa",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-18", batasInput: "2026-04-25",
    statusCatatan: "perlu cek pengisian",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(1, false), progressPct: 34,
    daysUntilBatasInput: 1, isComplete: false,
  },
  {
    no: 4, produk: "RK", schoolName: "TK Telkom Dago", jumlahKelas: 4,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-03", batasInput: "2026-04-26",
    deliverWalas: "2026-04-25", deliverIndividu: "2026-06-03",
    statusCatatan: "selesai pengisian",
    approval: true, coda: true, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PEMBUATAN", trafficLight: tl(2, false), progressPct: 69,
    daysUntilBatasInput: 2, isComplete: false,
  },
  {
    no: 27, produk: "RK", schoolName: "KB TK Istiqamah", jumlahKelas: 9, tipeInput: "Walas",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-20", batasInput: "2026-04-26",
    deliverWalas: "2026-03-13", deliverIndividu: "2026-03-09",
    statusCatatan: "Sudah kirim laporan",
    approval: true, coda: true, excel: true,
    rWalas: true, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "DISTRIBUSI", trafficLight: tl(2, false), progressPct: 81,
    daysUntilBatasInput: 2, isComplete: false,
  },
  // ─ On track (daysLeft > 7)
  {
    no: 5, produk: "RK", schoolName: "TK Telkom Bandung", jumlahKelas: 3,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-17", batasInput: "2026-05-01",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(7, false), progressPct: 34,
    daysUntilBatasInput: 7, isComplete: false,
  },
  {
    no: 11, produk: "RK", schoolName: "SMP Telkom Bandung", jumlahKelas: 27, tipeInput: "Walas",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: false, setupSiswa: true,
    mulaiInput: "2026-04-17", batasInput: "2026-05-01",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(7, false), progressPct: 28,
    daysUntilBatasInput: 7, isComplete: false,
  },
  {
    no: 12, produk: "RK", schoolName: "SMP Telkom Mataram", jumlahKelas: 27, tipeInput: "Walas",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-17", batasInput: "2026-05-08",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(14, false), progressPct: 34,
    daysUntilBatasInput: 14, isComplete: false,
  },
  {
    no: 22, produk: "RK", schoolName: "SMK Telkom Malang", jumlahKelas: 44,
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-16", batasInput: "2026-05-08",
    approval: false, coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(14, false), progressPct: 34,
    daysUntilBatasInput: 14, isComplete: false,
  },
  {
    no: 42, produk: "RK", schoolName: "SDIP Al Madani", jumlahKelas: 25, tipeInput: "Walas",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-23", batasInput: "2026-05-01",
    deliverWalas: "2026-04-17",
    statusCatatan: "Sudah kirim laporan",
    approval: true, coda: true, excel: true,
    rWalas: true, rIndividu: true, rKepsek: true, polling: false,
    deliveryStage: "DISTRIBUSI", trafficLight: tl(7, false), progressPct: 94,
    daysUntilBatasInput: 7, isComplete: false,
  },
  // ─ SELESAI
  {
    no: 28, produk: "RK", schoolName: "TK Sabilina", jumlahKelas: 8, tipeInput: "Walas",
    dataSiswa: true, sosialisasi: true, setupGuru: true, setupOrtu: true, setupSiswa: true,
    mulaiInput: "2026-04-27", batasInput: "2026-05-01",
    deliverWalas: "2026-03-13", deliverIndividu: "2026-03-12",
    statusCatatan: "Sudah kirim laporan",
    approval: true, coda: true, excel: true,
    rWalas: true, rIndividu: true, rKepsek: true, polling: true,
    detailTestimoni: "Sangat membantu guru memahami karakter siswa.",
    deliveryStage: "SELESAI", trafficLight: "HIJAU", progressPct: 100,
    daysUntilBatasInput: 7, isComplete: true,
  },
];

// ── Capaian Pembelajaran PAUD (CP) ────────────────────────────────────────────
const CP: ISchoolDelivery[] = [
  {
    no: 1, produk: "CP", schoolName: "Daycare DT", jumlahKelas: 5,
    dataSiswa: true, setupGuru: true,
    mulaiInput: "2026-04-27", batasInput: "2026-06-01",
    deliverOrtu: "2026-05-08",
    foto: false, excel: false, rOrtu: false, polling: false,
    deliveryStage: "PERSIAPAN", trafficLight: tl(38, false), progressPct: 22,
    daysUntilBatasInput: 38, isComplete: false,
  },
  {
    no: 2, produk: "CP", schoolName: "Daycare Al Madani", jumlahKelas: 5,
    dataSiswa: true, setupGuru: true,
    mulaiInput: "2026-05-20", batasInput: "2026-05-29",
    deliverOrtu: "2026-06-08",
    foto: false, excel: false, rOrtu: false, polling: false,
    deliveryStage: "PERSIAPAN", trafficLight: tl(35, false), progressPct: 22,
    daysUntilBatasInput: 35, isComplete: false,
  },
  {
    no: 3, produk: "CP", schoolName: "PAUD Imanda", jumlahKelas: 6,
    dataSiswa: true, setupGuru: true,
    mulaiInput: "2026-05-20", batasInput: "2026-05-29",
    deliverOrtu: "2026-06-10",
    foto: false, excel: false, rOrtu: false, polling: false,
    deliveryStage: "PERSIAPAN", trafficLight: tl(35, false), progressPct: 22,
    daysUntilBatasInput: 35, isComplete: false,
  },
  {
    no: 9, produk: "CP", schoolName: "KB TK Al Fadhol", jumlahKelas: 6,
    dataSiswa: true, setupGuru: true,
    mulaiInput: "2026-04-24", batasInput: "2026-05-29",
    deliverOrtu: "2026-06-10",
    statusCatatan: "selesai pengisian",
    foto: true, excel: true, rOrtu: false, polling: false,
    deliveryStage: "PEMBUATAN", trafficLight: tl(35, false), progressPct: 56,
    daysUntilBatasInput: 35, isComplete: false,
  },
  {
    no: 4, produk: "CP", schoolName: "KB TK Istiqamah Pasar Minggu", jumlahKelas: 9,
    dataSiswa: true, setupGuru: true,
    mulaiInput: "2026-05-20", batasInput: "2026-05-29",
    deliverOrtu: "2026-06-10",
    foto: false, excel: false, rOrtu: false, polling: false,
    deliveryStage: "PERSIAPAN", trafficLight: tl(35, false), progressPct: 22,
    daysUntilBatasInput: 35, isComplete: false,
  },
];

// ── Screening Psikologi (SP) ──────────────────────────────────────────────────
const SP: ISchoolDelivery[] = [
  {
    no: 1, produk: "SP", schoolName: "SD Kajaolalido", jumlahKelas: 15, tipeInput: "siswa",
    dataSiswa: true, sosialisasi: true, setupGuru: false, setupOrtu: false, setupSiswa: true,
    mulaiInput: "2026-04-24", batasInput: "2026-04-25",
    deliverWalas: "2026-05-08", deliverIndividu: "2026-05-08", deliverKepsek: "2026-05-08",
    coda: false, excel: false,
    rWalas: false, rIndividu: false, rKepsek: false, polling: false,
    deliveryStage: "PENGISIAN", trafficLight: tl(1, false), progressPct: 36,
    daysUntilBatasInput: 1, isComplete: false,
  },
];

export const OPS_MOCK: ISchoolDelivery[] = [...RK, ...CP, ...SP];
