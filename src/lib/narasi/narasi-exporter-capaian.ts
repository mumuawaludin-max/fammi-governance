import * as XLSX from "xlsx";
import type {
  ICapaianPreviewData,
  ICapaianOutputRow,
  ICapaianPembukaRow,
  ICapaian100Row,
  ICapaianTKB100Row,
  ICapaian0Row,
  NarrativeTone,
} from "@/types/narasi";

function applyHeaderStyle(ws: XLSX.WorkSheet, numCols: number): void {
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!cols"] = Array.from({ length: numCols }, () => ({ wch: 35 }));
}

function rowsToSheet<T extends Record<string, unknown>>(rows: T[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  applyHeaderStyle(ws, Object.keys(rows[0] ?? {}).length);
  return ws;
}

function capaianRowsToExport(rows: ICapaianOutputRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    Elemen: r.elemen,
    "Tujuan Pembelajaran": r.tujuanPembelajaran,
    Indikator: r.indikator,
    "Deskripsi Berkembang Sangat Baik / Sesuai Harapan": r.deskripsiBSBBSH,
    "Deskripsi Masih Belum Berkembang": r.deskripsiMBBB,
    "Solusi Pendekatan Psikologi di Rumah": r.solusiRumah,
  }));
}

function pembukaRowsToExport(rows: ICapaianPembukaRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    "Nama Elemen": r.namaElemen,
    "Rentang Skor": r.rentangSkor,
    "Kalimat Pembuka": r.kalimatPembuka,
    "Kalimat Penutup": r.kalimatPenutup,
  }));
}

function narasi100RowsToExport(rows: ICapaian100Row[]): Record<string, string>[] {
  return rows.map((r) => ({
    Name: r.namaElemen,
    "Ganti dilatih pelan-pelan jadi:": r.narasiCapaian,
    "Ide sederhana di rumah:": r.ideSederhana,
  }));
}

function narasiTKB100RowsToExport(rows: ICapaianTKB100Row[]): Record<string, string>[] {
  return rows.map((r) => ({
    Name: r.namaElemen,
    "Perlu dilatih pelan2": r.perluDilatih,
    "Fokus pendampingan": r.fokusEndampingan,
  }));
}

function narasi0RowsToExport(rows: ICapaian0Row[]): Record<string, string>[] {
  return rows.map((r) => ({
    Elemen: r.elemen,
    Total: r.total,
    Masih: r.masih,
    "Hal-hal baik yang sudah terlihat": r.halHalBaik,
  }));
}

// Excel sheet name max 31 chars
function safeSheetName(name: string): string {
  return name.slice(0, 31).replace(/[:\\/?*[\]]/g, "-");
}

export function exportCapaianToExcel(
  data: ICapaianPreviewData,
  namaSekolah: string,
  jenjang: string,
  levelList: string[],
  narrativeTone: NarrativeTone,
): void {
  const wb = XLSX.utils.book_new();

  // Metadata sheet
  const meta: Record<string, string>[] = [
    { Field: "Nama Sekolah", Nilai: namaSekolah },
    { Field: "Jenjang", Nilai: jenjang },
    { Field: "Level / Kelas", Nilai: levelList.join(", ") },
    { Field: "Nada Narasi", Nilai: narrativeTone === "islami" ? "Islami" : "General" },
    { Field: "Tanggal Generate", Nilai: new Date().toLocaleDateString("id-ID") },
  ];
  const wsMeta = rowsToSheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");

  // Level sections
  for (const section of data.levelSections) {
    const rows = capaianRowsToExport(section.rows.length > 0 ? section.rows : [{ elemen: "", tujuanPembelajaran: "", indikator: "", deskripsiBSBBSH: "", deskripsiMBBB: "", solusiRumah: "" }]);
    const ws = rowsToSheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(section.levelName));
  }

  // Narasi Pembuka Penutup
  const pembukaRows = pembukaRowsToExport(
    data.narasiPembukaData.length > 0
      ? data.narasiPembukaData
      : [{ namaElemen: "", rentangSkor: "", kalimatPembuka: "", kalimatPenutup: "" }],
  );
  XLSX.utils.book_append_sheet(wb, rowsToSheet(pembukaRows), "NARASI PEMBUKA PENUTUP");

  // Narasi 100% Tercapai
  const rows100 = narasi100RowsToExport(
    data.narasi100Data.length > 0 ? data.narasi100Data : [{ namaElemen: "", narasiCapaian: "", ideSederhana: "" }],
  );
  XLSX.utils.book_append_sheet(wb, rowsToSheet(rows100), "NARASI 100% TERCAPAI");

  // Narasi Capaian TK B 100% (kondisional)
  if (data.narasiTKB100Data && data.narasiTKB100Data.length > 0) {
    const rowsTKB100 = narasiTKB100RowsToExport(data.narasiTKB100Data);
    XLSX.utils.book_append_sheet(wb, rowsToSheet(rowsTKB100), "NARASI CAPAIAN TK B 100%");
  }

  // Narasi Semua 0%
  const rows0 = narasi0RowsToExport(
    data.narasi0Data.length > 0 ? data.narasi0Data : [{ elemen: "", total: "", masih: "", halHalBaik: "" }],
  );
  XLSX.utils.book_append_sheet(wb, rowsToSheet(rows0), "NARASI SEMUA 0%");

  const sekolahSlug = (namaSekolah || "Fammi").replace(/\s+/g, "_");
  const jenjangSlug = jenjang ? `_${jenjang}` : "";
  const levelSlug = levelList.length > 0 ? `_${levelList.join("-").replace(/\s+/g, "")}` : "";
  const tanggal = new Date().toISOString().slice(0, 10);
  const filename = `Narasi_Capaian_Pembelajaran_${sekolahSlug}${jenjangSlug}${levelSlug}_${tanggal}.xlsx`;

  XLSX.writeFile(wb, filename);
}
