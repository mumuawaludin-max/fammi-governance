import { NextResponse } from "next/server";
import { fetchSheetRows, rowsToObjects } from "@/lib/google-sheets";
import { parseOpsRow } from "@/lib/ops-parser";
import { OPS_MOCK } from "@/lib/ops-mock";
import type { ISchoolDelivery } from "@/types";

const SHEET_NAME = "fammi_operations";
const CACHE_DURATION = 5 * 60 * 1000;

let cache: { data: ISchoolDelivery[]; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cache.data,
        lastUpdated: new Date(cache.timestamp).toISOString(),
        source: SHEET_NAME,
        cached: true,
      });
    }

    const rows = await fetchSheetRows(SHEET_NAME);
    const objects = rowsToObjects(rows);
    const deliveries = objects
      .map(parseOpsRow)
      .filter((d): d is ISchoolDelivery => d !== null);

    cache = { data: deliveries, timestamp: Date.now() };

    return NextResponse.json({
      data: deliveries,
      lastUpdated: new Date().toISOString(),
      source: SHEET_NAME,
      cached: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Env belum diset → kembalikan seed data tanpa error
    if (msg.includes("belum diset")) {
      return NextResponse.json({
        data: OPS_MOCK,
        lastUpdated: new Date().toISOString(),
        source: "seed",
        seed: true,
      });
    }

    // Sheets API error → log + fallback ke cache lama atau seed
    console.error("[ops] Sheets API error:", msg);
    return NextResponse.json({
      data: cache?.data ?? OPS_MOCK,
      lastUpdated: cache ? new Date(cache.timestamp).toISOString() : new Date().toISOString(),
      source: cache ? `${SHEET_NAME}_stale` : "seed",
      error: msg,
    });
  }
}
