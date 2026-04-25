import { NextResponse } from "next/server";
import type { IUserAccount } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION = 10 * 60 * 1000; // 10 menit

let cache: { data: unknown; timestamp: number } | null = null;

// Seed data — dipakai saat sheet belum ada atau env belum terset
const SEED_USERS: IUserAccount[] = [
  {
    userId: "USR001",
    email: "muhamadnur.awaludin@fammi.ly",
    name: "Mumu",
    role: "Management",
    isActive: true,
    createdAt: "2024-01-01",
    notes: "Strategic Leadership Team",
  },
];

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ data: cache.data, cached: true });
    }

    if (!APPS_SCRIPT_URL || !API_SECRET) {
      return NextResponse.json({ data: SEED_USERS, seed: true });
    }

    const url = `${APPS_SCRIPT_URL}?domain=users&key=${API_SECRET}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    cache = { data: data.data ?? data, timestamp: Date.now() };
    return NextResponse.json({ data: cache.data, cached: false });
  } catch {
    return NextResponse.json({ data: SEED_USERS, seed: true });
  }
}
