import { NextResponse } from "next/server";
import type { IApiResponse, IFeature } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 10 * 60 * 1000;

interface IProductData {
  features: IFeature[];
  csatAvg: number;
  csatEntries: unknown[];
}

let cache: { data: IApiResponse<IProductData>; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cache.data, cached: true });
    }
    const url = `${APPS_SCRIPT_URL}?domain=product&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: IApiResponse<IProductData> = await res.json();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal mengambil data produk", detail: message },
      { status: 500 }
    );
  }
}
