import { NextResponse } from "next/server";
import { OPS_MOCK } from "@/lib/ops-mock";
import type { ISchoolDelivery } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 5 * 60 * 1000;

let cache: { data: ISchoolDelivery[]; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cache.data,
        lastUpdated: new Date(cache.timestamp).toISOString(),
        source: "fammi_operations",
        cached: true,
      });
    }

    if (!APPS_SCRIPT_URL || !API_SECRET) {
      return NextResponse.json({
        data: OPS_MOCK,
        lastUpdated: new Date().toISOString(),
        source: "seed",
        seed: true,
      });
    }

    const url = `${APPS_SCRIPT_URL}?domain=ops&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const deliveries: ISchoolDelivery[] = json.data ?? json;
    cache = { data: deliveries, timestamp: Date.now() };

    return NextResponse.json({
      data: deliveries,
      lastUpdated: new Date().toISOString(),
      source: "fammi_operations",
      cached: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ops] Apps Script error:", msg);
    return NextResponse.json({
      data: cache?.data ?? OPS_MOCK,
      lastUpdated: cache ? new Date(cache.timestamp).toISOString() : new Date().toISOString(),
      source: cache ? "fammi_operations_stale" : "seed",
      error: msg,
    });
  }
}
