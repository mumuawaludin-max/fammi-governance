import * as XLSX from "xlsx";
import type { IParsedCapaianWorkbook, ICapaianRow } from "@/types/narasi";

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findElemenCol(headers: string[]): string | null {
  const candidates = ["elemen", "elemenpembelajaran", "aspek", "bidang", "area"];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

function findTujuanCol(headers: string[]): string | null {
  const candidates = [
    "tujuanpembelajaran",
    "capaianpembelajaran",
    "tujuancapaianpembelajaran",
    "tujuan",
    "capaian",
    "cp",
    "tp",
  ];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

function findIndikatorCol(headers: string[]): string | null {
  const candidates = [
    "indikator",
    "indikatorpencapaian",
    "indikatorpembelajaran",
    "pencapaian",
    "indikatorhasil",
    "subindikator",
  ];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, string>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).trim();
      if (!key || key.startsWith("__EMPTY")) continue;
      out[key] = String(v ?? "").trim();
    }
    return out;
  });
}

export async function parseCapaianWorkbook(file: File): Promise<IParsedCapaianWorkbook> {
  const warnings: string[] = [];
  const errors: string[] = [];

  const buffer = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "array" });
  } catch {
    errors.push("Gagal membaca file. Pastikan file adalah format .xlsx yang valid.");
    return { rows: [], elemenList: [], rawRows: [], rowCount: 0, indikatorPerElemen: {}, warnings, errors };
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    errors.push("Workbook kosong. Pastikan file memiliki minimal satu sheet.");
    return { rows: [], elemenList: [], rawRows: [], rowCount: 0, indikatorPerElemen: {}, warnings, errors };
  }

  const rawRows = sheetToRows(wb.Sheets[sheetName]);
  if (rawRows.length === 0) {
    errors.push("Sheet pertama tidak memiliki data. Pastikan workbook sudah terisi.");
    return { rows: [], elemenList: [], rawRows: [], rowCount: 0, indikatorPerElemen: {}, warnings, errors };
  }

  const headers = Object.keys(rawRows[0]);
  const elemenCol = findElemenCol(headers);
  const tujuanCol = findTujuanCol(headers);
  const indikatorCol = findIndikatorCol(headers);

  if (!elemenCol) errors.push("Kolom Elemen belum ditemukan. Pastikan workbook memiliki kolom Elemen atau nama yang setara.");
  if (!indikatorCol) errors.push("Kolom Indikator belum ditemukan. Pastikan workbook memiliki kolom Indikator atau Indikator Pencapaian.");
  if (!tujuanCol) warnings.push("Kolom Tujuan Pembelajaran tidak ditemukan. Kolom ini akan dikosongkan.");

  if (errors.length > 0) {
    return { rows: [], elemenList: [], rawRows, rowCount: 0, indikatorPerElemen: {}, warnings, errors };
  }

  const rows: ICapaianRow[] = rawRows
    .filter((row) => {
      const elemen = elemenCol ? row[elemenCol] : "";
      const indikator = indikatorCol ? row[indikatorCol] : "";
      return (elemen || indikator) && (elemen || indikator).trim() !== "";
    })
    .map((row) => ({
      elemen: elemenCol ? row[elemenCol] : "",
      tujuanPembelajaran: tujuanCol ? row[tujuanCol] : "",
      indikator: indikatorCol ? row[indikatorCol] : "",
    }));

  const elemenSet = new Set<string>();
  const indikatorPerElemen: Record<string, number> = {};

  for (const row of rows) {
    if (row.elemen) {
      elemenSet.add(row.elemen);
      indikatorPerElemen[row.elemen] = (indikatorPerElemen[row.elemen] ?? 0) + 1;
    }
  }

  const elemenList = Array.from(elemenSet);

  if (elemenList.length === 0) {
    warnings.push("Tidak ada elemen yang terdeteksi. Pastikan kolom Elemen terisi.");
  }

  return {
    rows,
    elemenList,
    rawRows,
    rowCount: rows.length,
    indikatorPerElemen,
    warnings,
    errors,
  };
}
