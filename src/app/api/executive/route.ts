import { NextResponse } from "next/server";
import type { IApiResponse, IFinanceHealth, ISocialImpact, ITeamCheckin } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 15 * 60 * 1000; // 15 menit — diload saat landing page

interface IExecutiveSummary {
  finance: IFinanceHealth;
  impact: ISocialImpact;
  ops: { merahCount: number; kuningCount: number };
  team: ITeamCheckin;
  growth: { wpv: number; staleLeads: number };
}

let cache: { data: IApiResponse<IExecutiveSummary>; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cache.data, cached: true });
    }
    const url = `${APPS_SCRIPT_URL}?domain=executive&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: IApiResponse<IExecutiveSummary> = await res.json();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal mengambil executive summary", detail: message },
      { status: 500 }
    );
  }
}
