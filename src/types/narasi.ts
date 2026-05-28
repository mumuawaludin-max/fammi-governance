// ============================================================
// Types untuk fitur Narasi Generator
// Struktur persis mengikuti workbook "NARASI KARAKTER"
// ============================================================

export type Jenjang = "DAYCARE" | "TK" | "SD" | "SMP" | "SMA";

export const JENJANG_LABELS: Record<Jenjang, string> = {
  DAYCARE: "Daycare",
  TK: "TK",
  SD: "SD",
  SMP: "SMP",
  SMA: "SMA",
};

export const LEVEL_OPTIONS: Record<Jenjang, string[]> = {
  DAYCARE: ["1 Tahun", "2 Tahun", "3 Tahun", "4 Tahun", "5 Tahun", "6 Tahun"],
  TK: ["KB", "TK A", "TK B"],
  SD: ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"],
  SMP: ["Kelas 7", "Kelas 8", "Kelas 9"],
  SMA: ["Kelas 10", "Kelas 11", "Kelas 12"],
};

// ── Tier rentang skor — Narasi Karakter (6 tier) ──────────────
// Sesuai workbook: Nilai Awal/Akhir dalam format desimal 0-1

export const NARASI_KARAKTER_TIERS = [
  { rentang: "100%",    nilaiAwal: "1",   nilaiAkhir: "1"    },
  { rentang: "90–99%",  nilaiAwal: "0,9", nilaiAkhir: "0,99" },
  { rentang: "80–89%",  nilaiAwal: "0,8", nilaiAkhir: "0,89" },
  { rentang: "70–76%",  nilaiAwal: "0,7", nilaiAkhir: "0,79" },
  { rentang: "50–69%",  nilaiAwal: "0,5", nilaiAkhir: "0,69" },
  { rentang: "<50%",    nilaiAwal: "0",   nilaiAkhir: "0,49" },
] as const;

// ── Tier rentang skor — Narasi Keselarasan (5 tier) ──────────
// Tier ke-5 selalu: Sekolah = "—", Orangtua = template tetap

export const NARASI_KESELARASAN_TIERS = [
  { rentang: "76-100%",             nilaiAwal: "0,76", nilaiAkhir: "1"    },
  { rentang: "51-75%",              nilaiAwal: "0,51", nilaiAkhir: "0,75" },
  { rentang: "26-50%",              nilaiAwal: "0,26", nilaiAkhir: "0,5"  },
  { rentang: "1-25%",               nilaiAwal: "0,1",  nilaiAkhir: "0,25" },
  { rentang: "0% (belum ada refleksi)", nilaiAwal: "0", nilaiAkhir: "0"  },
] as const;

// ── Tier Narasi Umum (6 tier) ─────────────────────────────────

export const NARASI_UMUM_TIERS = [
  { hasilPredikat: "A+ (100%) – Sangat Istimewa",   nilaiAwal: "1",   nilaiAkhir: "1"    },
  { hasilPredikat: "A+ (90–99%) – Sangat Istimewa", nilaiAwal: "0,9", nilaiAkhir: "0,99" },
  { hasilPredikat: "A (80–89%) – Istimewa",          nilaiAwal: "0,8", nilaiAkhir: "0,89" },
  { hasilPredikat: "B+ (70–76%) – Sangat Baik",      nilaiAwal: "0,7", nilaiAkhir: "0,79" },
  { hasilPredikat: "B (50–69%) – Baik",              nilaiAwal: "0,5", nilaiAkhir: "0,69" },
  { hasilPredikat: "B− (<50%) – Perlu Penguatan",    nilaiAwal: "0",   nilaiAkhir: "0,49" },
] as const;

// BGCOLOR dan TEXTCOLOR selalu sama untuk semua baris Keselarasan
export const KESELARASAN_BGCOLOR  = "ECE4FB";
export const KESELARASAN_TEXTCOLOR = "834FE3";

// ── Row types (persis sesuai kolom workbook) ──────────────────

// Sheet: Indikator Guru — kolom: Karakter, Indikator Pencapaian, Item
export interface IIndikatorGuruRow {
  karakter: string;
  indikatorPencapaian: string;
  [key: string]: string;
}

// Sheet: Rubrik Orangtua — kolom: Karakter, Indikator Pencapaian, Pertanyaan di Apps, Konsisten (4), dst
export interface IRubrikOrangtuaRow {
  karakter: string;
  indikatorPencapaian: string;
  pertanyaanDiApps: string;
  [key: string]: string;
}

// Sheet: Narasi Umum — kolom: Hasil Predikat, Catatan Umum Perkembangan, Nilai Awal, Nilai Akhir
export interface INarasiUmumRow {
  hasilPredikat: string;             // "A+ (100%) – Sangat Istimewa", dst
  catatanUmumPerkembangan: string;   // narasi panjang dengan placeholder
  nilaiAwal: string;
  nilaiAkhir: string;
}

// Sheet: Narasi Karakter — kolom: Karakter, Rentang Skor Indikator, Narasi, Nilai Awal, Nilai Akhir
export interface INarasiKarakterRow {
  karakter: string;
  rentangSkorIndikator: string;      // "100%", "90–99%", "80–89%", "70–76%", "50–69%", "<50%"
  narasi: string;                    // kolom bernama "Narasi" di workbook
  nilaiAwal: string;
  nilaiAkhir: string;
}

// Sheet: Narasi Keselarasan — kolom: Karakter, Rentang Skor Indikator, Narasi Hasil dari Sekolah,
//        Narasi Hasil dari Orangtua, Nilai Awal, Nilai Akhir, BGCOLOR, TEXTCOLOR
export interface INarasiKeselarasanRow {
  karakter: string;
  rentangSkorIndikator: string;      // "76-100%", "51-75%", "26-50%", "1-25%", "0% (belum ada refleksi)"
  narasiHasilDariSekolah: string;    // "—" jika 0%
  narasiHasilDariOrangtua: string;
  nilaiAwal: string;
  nilaiAkhir: string;
  bgcolor: string;                   // selalu ECE4FB
  textcolor: string;                 // selalu 834FE3
}

// ── Parsed workbook ─────────────────────────────────────────

export interface IParsedWorkbook {
  indikatorGuru: IIndikatorGuruRow[];
  rubrikOrangtua: IRubrikOrangtuaRow[];
  rawIndikatorGuru: Record<string, string>[];
  rawRubrikOrangtua: Record<string, string>[];
  karakterList: string[];
  indikatorCount: number;
  rubrikCount: number;
  hasPredikat: boolean;
  hasColor: boolean;
  warnings: string[];
  errors: string[];
}

// ── Preview data ─────────────────────────────────────────────

export interface IPreviewData {
  indikatorGuru: Record<string, string>[];
  rubrikOrangtua: Record<string, string>[];
  narasiUmum: INarasiUmumRow[];
  narasiKarakter: INarasiKarakterRow[];
  narasiKeselarasan: INarasiKeselarasanRow[];
  indikatorGuruColumns: string[];
  rubrikOrangtuaColumns: string[];
}

// ── Narrative tone ────────────────────────────────────────────

export type NarrativeTone = "islami" | "general";

// ── Form state ───────────────────────────────────────────────

export interface INarasiFormState {
  namaSekolah: string;
  jenjang: Jenjang | "";
  levelList: string[];
  narrativeTone: NarrativeTone;
  file: File | null;
  parsedWorkbook: IParsedWorkbook | null;
  previewData: IPreviewData | null;
  isApproved: boolean;
  step: 1 | 2 | 3 | 4 | 5;
}

// ============================================================
// Types untuk fitur Narasi Capaian Pembelajaran
// ============================================================

export interface ICapaianRow {
  elemen: string;
  tujuanPembelajaran: string;
  indikator: string;
}

export interface IParsedCapaianWorkbook {
  rows: ICapaianRow[];
  elemenList: string[];
  rawRows: Record<string, string>[];
  rowCount: number;
  indikatorPerElemen: Record<string, number>;
  warnings: string[];
  errors: string[];
}

export interface ICapaianOutputRow {
  elemen: string;
  tujuanPembelajaran: string;
  indikator: string;
  deskripsiBSBBSH: string;
  deskripsiMBBB: string;
  solusiRumah: string;
}

export interface ICapaianPembukaRow {
  namaElemen: string;
  rentangSkor: string;
  kalimatPembuka: string;
  kalimatPenutup: string;
}

export interface ICapaian100Row {
  namaElemen: string;
  narasiCapaian: string;   // kolom "Ganti dilatih pelan-pelan jadi:"
  ideSederhana: string;   // kolom "Ide sederhana di rumah:"
}

export interface ICapaianTKB100Row {
  namaElemen: string;
  perluDilatih: string;    // kolom "Perlu dilatih pelan2" (narasi pencapaian penuh)
  fokusEndampingan: string; // kolom "Fokus pendampingan"
}

export interface ICapaian0Row {
  elemen: string;
  total: string;
  masih: string;
  halHalBaik: string;
}

export interface ICapaianLevelSection {
  levelName: string;
  level: string;
  rows: ICapaianOutputRow[];
}

export interface ICapaian100LevelSection {
  levelName: string;
  level: string;
  rows: ICapaian100Row[];
}

export interface ICapaian0LevelSection {
  levelName: string;
  level: string;
  rows: ICapaian0Row[];
}

export interface ICapaianPreviewData {
  levelSections: ICapaianLevelSection[];
  narasiPembukaData: ICapaianPembukaRow[];
  narasi100Sections: ICapaian100LevelSection[];
  narasi0Sections: ICapaian0LevelSection[];
}

export interface ICapaianFormState {
  namaSekolah: string;
  jenjang: Jenjang | "";
  levelList: string[];
  narrativeTone: NarrativeTone;
  file: File | null;
  parsedWorkbook: IParsedCapaianWorkbook | null;
  previewData: ICapaianPreviewData | null;
  isApproved: boolean;
  step: 1 | 2 | 3 | 4 | 5;
}
