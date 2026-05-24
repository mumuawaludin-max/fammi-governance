import * as XLSX from "xlsx";
import type { IPreviewData, INarasiKarakterRow, INarasiKeselarasanRow, INarasiUmumRow } from "@/types/narasi";

const SHEET_NAMES_EXPORT = [
  "Indikator Guru",
  "Rubrik Orangtua",
  "Narasi Umum",
  "Narasi Karakter",
  "Narasi Keselarasan",
] as const;

function applyHeaderStyle(ws: XLSX.WorkSheet, numCols: number): void {
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!cols"] = Array.from({ length: numCols }, () => ({ wch: 30 }));
}

function rowsToSheet<T extends Record<string, unknown>>(rows: T[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  applyHeaderStyle(ws, Object.keys(rows[0] ?? {}).length);
  return ws;
}

function narasiUmumToExportRows(rows: INarasiUmumRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    "Hasil Predikat":            r.hasilPredikat,
    "Nilai Awal":                r.nilaiAwal,
    "Nilai Akhir":               r.nilaiAkhir,
    "Catatan Umum Perkembangan": r.catatanUmumPerkembangan,
  }));
}

function narasiKarakterToExportRows(rows: INarasiKarakterRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    Karakter:                 r.karakter,
    "Rentang Skor Indikator": r.rentangSkorIndikator,
    Narasi:                   r.narasi,
    "Nilai Awal":             r.nilaiAwal,
    "Nilai Akhir":            r.nilaiAkhir,
  }));
}

function narasiKeselarasanToExportRows(rows: INarasiKeselarasanRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    Karakter:                    r.karakter,
    "Rentang Skor Indikator":    r.rentangSkorIndikator,
    "Narasi Hasil dari Sekolah": r.narasiHasilDariSekolah,
    "Narasi Hasil dari Orangtua": r.narasiHasilDariOrangtua,
    "Nilai Awal":                r.nilaiAwal,
    "Nilai Akhir":               r.nilaiAkhir,
    BGCOLOR:                     r.bgcolor,
    TEXTCOLOR:                   r.textcolor,
  }));
}

export function exportToExcel(data: IPreviewData, namaSekolah: string, jenjang?: string, levelList?: string[]): void {
  const wb = XLSX.utils.book_new();

  const wsIG = rowsToSheet(data.indikatorGuru.length > 0 ? data.indikatorGuru : [{ "(Kosong)": "" }]);
  XLSX.utils.book_append_sheet(wb, wsIG, SHEET_NAMES_EXPORT[0]);

  const wsRO = rowsToSheet(data.rubrikOrangtua.length > 0 ? data.rubrikOrangtua : [{ "(Kosong)": "" }]);
  XLSX.utils.book_append_sheet(wb, wsRO, SHEET_NAMES_EXPORT[1]);

  const narasiUmumRows = narasiUmumToExportRows(data.narasiUmum);
  const wsNU = rowsToSheet(narasiUmumRows.length > 0 ? narasiUmumRows : [{ "(Kosong)": "" }]);
  XLSX.utils.book_append_sheet(wb, wsNU, SHEET_NAMES_EXPORT[2]);

  const narasiKarakterRows = narasiKarakterToExportRows(data.narasiKarakter);
  const wsNK = rowsToSheet(narasiKarakterRows.length > 0 ? narasiKarakterRows : [{ "(Kosong)": "" }]);
  XLSX.utils.book_append_sheet(wb, wsNK, SHEET_NAMES_EXPORT[3]);

  const narasiKeselarasanRows = narasiKeselarasanToExportRows(data.narasiKeselarasan);
  const wsNKS = rowsToSheet(narasiKeselarasanRows.length > 0 ? narasiKeselarasanRows : [{ "(Kosong)": "" }]);
  XLSX.utils.book_append_sheet(wb, wsNKS, SHEET_NAMES_EXPORT[4]);

  const sekolahSlug = (namaSekolah || "Fammi").replace(/\s+/g, "_");
  const jenjangSlug = jenjang ? `_${jenjang.replace(/\s*\/\s*/g, "-")}` : "";
  const levelSlug = levelList && levelList.length > 0 ? `_${levelList.join("-").replace(/\s+/g, "")}` : "";
  const tanggal = new Date().toISOString().slice(0, 10);
  const filename = `Narasi_Rapor_Karakter_${sekolahSlug}${jenjangSlug}${levelSlug}_${tanggal}.xlsx`;
  XLSX.writeFile(wb, filename);
}
