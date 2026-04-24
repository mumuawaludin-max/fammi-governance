/**
 * Generic Google Sheets reader.
 *
 * Requirements:
 *   SPREADSHEET_ID     = ID dari URL spreadsheet (bagian setelah /d/ dan sebelum /edit)
 *   GOOGLE_SHEETS_API_KEY = API key dari Google Cloud Console
 *
 * Sheet harus disetel "Anyone with link → Viewer" supaya API key cukup.
 * Kalau private, ganti ke service account approach.
 */

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export async function fetchSheetRows(sheetName: string): Promise<string[][]> {
  const id = process.env.SPREADSHEET_ID;
  const key = process.env.GOOGLE_SHEETS_API_KEY;

  if (!id || !key) throw new Error("SPREADSHEET_ID atau GOOGLE_SHEETS_API_KEY belum diset");

  const url = `${BASE}/${id}/values/${encodeURIComponent(sheetName)}?key=${key}`;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API ${res.status}: ${body}`);
  }

  const json = await res.json();
  return (json.values ?? []) as string[][];
}

/** Ubah rows menjadi array of objects berdasarkan header baris pertama. */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const [headers, ...data] = rows;
  return data
    .filter((row) => row.some((cell) => cell?.trim()))
    .map((row) =>
      Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim() ?? ""])),
    );
}
