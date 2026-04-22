import { NextResponse } from "next/server";
import type { IApiResponse, ISocialImpact } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 15 * 60 * 1000;

let cache: { data: IApiResponse<ISocialImpact>; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cache.data, cached: true });
    }
    const url = `${APPS_SCRIPT_URL}?domain=impact&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: IApiResponse<ISocialImpact> = await res.json();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal mengambil data dampak sosial", detail: message },
      { status: 500 }
    );
  }
}
