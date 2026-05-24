import * as XLSX from "xlsx";
import type { IParsedWorkbook, IIndikatorGuruRow, IRubrikOrangtuaRow } from "@/types/narasi";

const SHEET_INDIKATOR = "Indikator Guru";
const SHEET_RUBRIK = "Rubrik Orangtua";

// Normalize header: lowercase, remove spaces/special chars
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Attempt to detect "Karakter" column (flexible naming)
function findKarakterCol(headers: string[]): string | null {
  const candidates = ["karakter", "aspek", "aspekkarakter", "namakarakter", "character"];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

// Attempt to detect indikator column
function findIndikatorCol(headers: string[]): string | null {
  const candidates = ["indikatorpencapaian", "indikator", "pencapaian", "indikatorhasil"];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

// Detect "Pertanyaan di Apps" column
function findPertanyaanCol(headers: string[]): string | null {
  const candidates = ["pertanyaandiapps", "pertanyaan", "pertanyaanapps"];
  for (const h of headers) {
    if (candidates.includes(normalizeKey(h))) return h;
  }
  return null;
}

// Parse sheet to array of raw row objects, skipping empty/unnamed columns
function sheetToRows(sheet: XLSX.WorkSheet): Record<string, string>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).trim();
      // Skip SheetJS auto-generated empty headers (__EMPTY, __EMPTY_1, etc.) and truly empty keys
      if (!key || key.startsWith("__EMPTY")) continue;
      out[key] = String(v ?? "").trim();
    }
    return out;
  });
}

export async function parseWorkbook(file: File): Promise<IParsedWorkbook> {
  const warnings: string[] = [];
  const errors: string[] = [];

  const buffer = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "array" });
  } catch {
    errors.push("Gagal membaca file. Pastikan file adalah format .xlsx yang valid.");
    return {
      indikatorGuru: [],
      rubrikOrangtua: [],
      rawIndikatorGuru: [],
      rawRubrikOrangtua: [],
      karakterList: [],
      indikatorCount: 0,
      rubrikCount: 0,
      hasPredikat: false,
      hasColor: false,
      warnings,
      errors,
    };
  }

  // ── Check sheets ───────────────────────────────────────────

  const sheetNames = wb.SheetNames;

  const indikatorSheetName = sheetNames.find(
    (n) => n.trim().toLowerCase() === SHEET_INDIKATOR.toLowerCase()
  );
  const rubrikSheetName = sheetNames.find(
    (n) => n.trim().toLowerCase() === SHEET_RUBRIK.toLowerCase()
  );

  if (!indikatorSheetName) {
    errors.push(`Sheet "${SHEET_INDIKATOR}" tidak ditemukan. Pastikan workbook memiliki sheet dengan nama tersebut.`);
  }
  if (!rubrikSheetName) {
    errors.push(`Sheet "${SHEET_RUBRIK}" tidak ditemukan. Pastikan workbook memiliki sheet dengan nama tersebut.`);
  }

  if (errors.length > 0) {
    return {
      indikatorGuru: [],
      rubrikOrangtua: [],
      rawIndikatorGuru: [],
      rawRubrikOrangtua: [],
      karakterList: [],
      indikatorCount: 0,
      rubrikCount: 0,
      hasPredikat: false,
      hasColor: false,
      warnings,
      errors,
    };
  }

  // ── Parse Indikator Guru ───────────────────────────────────

  const rawIndikatorGuru = sheetToRows(wb.Sheets[indikatorSheetName!]);
  const igHeaders = rawIndikatorGuru.length > 0 ? Object.keys(rawIndikatorGuru[0]) : [];

  const igKarakterCol = findKarakterCol(igHeaders);
  const igIndikatorCol = findIndikatorCol(igHeaders);

  if (!igKarakterCol) warnings.push("Kolom 'Karakter' tidak terdeteksi di sheet Indikator Guru.");
  if (!igIndikatorCol) warnings.push("Kolom 'Indikator Pencapaian' tidak terdeteksi di sheet Indikator Guru.");

  const indikatorGuru: IIndikatorGuruRow[] = rawIndikatorGuru
    .filter((row) => {
      const karakter = igKarakterCol ? row[igKarakterCol] : "";
      return karakter && karakter.trim() !== "";
    })
    .map((row) => ({
      karakter: igKarakterCol ? row[igKarakterCol] : "",
      indikatorPencapaian: igIndikatorCol ? row[igIndikatorCol] : "",
      ...row,
    }));

  // ── Parse Rubrik Orangtua ───────────────────────────────────

  const rawRubrikOrangtua = sheetToRows(wb.Sheets[rubrikSheetName!]);
  const roHeaders = rawRubrikOrangtua.length > 0 ? Object.keys(rawRubrikOrangtua[0]) : [];

  const roKarakterCol = findKarakterCol(roHeaders);
  const roIndikatorCol = findIndikatorCol(roHeaders);
  const roPertanyaanCol = findPertanyaanCol(roHeaders);

  if (!roKarakterCol) warnings.push("Kolom 'Karakter' tidak terdeteksi di sheet Rubrik Orangtua.");

  const rubrikOrangtua: IRubrikOrangtuaRow[] = rawRubrikOrangtua
    .filter((row) => {
      const karakter = roKarakterCol ? row[roKarakterCol] : "";
      return karakter && karakter.trim() !== "";
    })
    .map((row) => ({
      karakter: roKarakterCol ? row[roKarakterCol] : "",
      indikatorPencapaian: roIndikatorCol ? row[roIndikatorCol] : "",
      pertanyaanDiApps: roPertanyaanCol ? row[roPertanyaanCol] : "",
      konsisten4: "",
      seringMuncul3: "",
      kadangMuncul2: "",
      belumMuncul1: "",
      belumAda0: "",
      ...row,
    }));

  // ── Detect characteristics ───────────────────────────────

  const karakterSet = new Set<string>();
  for (const row of indikatorGuru) {
    if (row.karakter) karakterSet.add(row.karakter);
  }
  const karakterList = Array.from(karakterSet);

  // Detect predikat columns
  const allHeaders = [...igHeaders, ...roHeaders];
  const hasPredikat = allHeaders.some((h) =>
    normalizeKey(h).includes("predikat") || normalizeKey(h).includes("nilaiakhir") || normalizeKey(h).includes("nilalawal")
  );

  const hasColor = allHeaders.some((h) =>
    normalizeKey(h).includes("bgcolor") || normalizeKey(h).includes("textcolor")
  );

  if (karakterList.length === 0) {
    warnings.push("Tidak ada karakter yang terdeteksi. Pastikan kolom Karakter terisi.");
  }

  return {
    indikatorGuru,
    rubrikOrangtua,
    rawIndikatorGuru,
    rawRubrikOrangtua,
    karakterList,
    indikatorCount: indikatorGuru.length,
    rubrikCount: rubrikOrangtua.length,
    hasPredikat,
    hasColor,
    warnings,
    errors,
  };
}
