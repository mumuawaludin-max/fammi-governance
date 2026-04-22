import { NextResponse } from "next/server";
import type { IApiResponse, ISalesLead, IPartnership } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 10 * 60 * 1000;

interface IGrowthData {
  leads: ISalesLead[];
  partnerships: IPartnership[];
  wpv: number;
  staleLeads: number;
}

let cache: { data: IApiResponse<IGrowthData>; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cache.data, cached: true });
    }
    const url = `${APPS_SCRIPT_URL}?domain=growth&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: IApiResponse<IGrowthData> = await res.json();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal mengambil data growth", detail: message },
      { status: 500 }
    );
  }
}
