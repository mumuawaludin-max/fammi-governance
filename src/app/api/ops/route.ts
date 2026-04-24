import { NextResponse } from "next/server";
import type { IApiResponse, ISchoolDelivery } from "@/types";
import { OPS_MOCK } from "@/lib/ops-mock";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 5 * 60 * 1000;

let cache: { data: IApiResponse<ISchoolDelivery[]>; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    if (!APPS_SCRIPT_URL || !API_SECRET) {
      return NextResponse.json({
        data: OPS_MOCK,
        lastUpdated: new Date().toISOString(),
        source: "fammi_operations_seed",
        seed: true,
      });
    }

    const url = `${APPS_SCRIPT_URL}?domain=ops&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: IApiResponse<ISchoolDelivery[]> = await res.json();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      data: OPS_MOCK,
      lastUpdated: new Date().toISOString(),
      source: "fammi_operations_seed",
      seed: true,
    });
  }
}
