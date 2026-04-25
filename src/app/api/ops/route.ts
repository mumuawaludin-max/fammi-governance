import { NextResponse } from "next/server";
import { OPS_MOCK } from "@/lib/ops-mock";
import type { IOpsData } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET      = process.env.APPS_SCRIPT_SECRET!;
const CACHE_DURATION  = 5 * 60 * 1000;

let cache: { data: IOpsData; timestamp: number } | null = null;

function mockToOpsData(): IOpsData {
  const active  = OPS_MOCK.filter((d) => !d.isComplete);
  const selesai = OPS_MOCK.filter((d) =>  d.isComplete);
  return {
    totalActive:  active.length,
    merahCount:   active.filter((d) => d.trafficLight === "MERAH").length,
    kuningCount:  active.filter((d) => d.trafficLight === "KUNING").length,
    hijauCount:   active.filter((d) => d.trafficLight === "HIJAU").length,
    selesaiCount: selesai.length,
    deliveries:   OPS_MOCK,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const debug = searchParams.get("debug") === "true";

  // ── Serve cache ─────────────────────────────────────────────────────────────
  if (!force && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      data:        cache.data,
      lastUpdated: new Date(cache.timestamp).toISOString(),
      source:      "fammi_operations",
      cached:      true,
    });
  }

  // ── Env check ────────────────────────────────────────────────────────────────
  if (!APPS_SCRIPT_URL || !API_SECRET) {
    console.warn("[ops] APPS_SCRIPT_URL atau APPS_SCRIPT_SECRET belum diset di .env.local");
    return NextResponse.json({
      data:        mockToOpsData(),
      lastUpdated: new Date().toISOString(),
      source:      "seed",
      seed:        true,
      reason:      "env_missing",
    });
  }

  // ── Fetch Apps Script ────────────────────────────────────────────────────────
  const url = `${APPS_SCRIPT_URL}?domain=ops&key=${API_SECRET}`;
  let rawText = "";

  try {
    const res = await fetch(url, { cache: "no-store" });
    rawText = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawText.slice(0, 200)}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error(`Apps Script tidak mengembalikan JSON valid. Preview: ${rawText.slice(0, 300)}`);
    }

    // Surface Apps Script-level error
    const anyJson = json as Record<string, unknown>;
    if (anyJson?.error) {
      throw new Error(`Apps Script error: ${String(anyJson.error)}`);
    }

    // Unwrap potential double-nesting
    const raw = (anyJson?.data ?? anyJson) as Record<string, unknown>;
    const opsData = (
      Array.isArray(raw?.deliveries) ? raw : (raw?.data ?? raw)
    ) as IOpsData;

    const hasDeliveries = Array.isArray(opsData?.deliveries) && opsData.deliveries.length > 0;

    if (!hasDeliveries) {
      console.warn("[ops] Apps Script terhubung tapi deliveries kosong. Cek getOperationsData() di Apps Script.");
    }

    const payload: IOpsData = hasDeliveries ? opsData : mockToOpsData();
    cache = { data: payload, timestamp: Date.now() };

    const response = {
      data:        payload,
      lastUpdated: anyJson?.lastUpdated ?? raw?.lastUpdated ?? new Date().toISOString(),
      source:      hasDeliveries ? "fammi_operations" : "seed",
      cached:      false,
      ...(debug && { _raw: rawText.slice(0, 2000) }),
    };

    if (!hasDeliveries) {
      (response as Record<string, unknown>).reason = "empty_deliveries";
    }

    return NextResponse.json(response);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ops] Error:", msg);

    return NextResponse.json({
      data:        cache?.data ?? mockToOpsData(),
      lastUpdated: cache ? new Date(cache.timestamp).toISOString() : new Date().toISOString(),
      source:      cache ? "fammi_operations_stale" : "seed",
      error:       msg,
      reason:      "fetch_error",
      ...(debug && { _rawPreview: rawText.slice(0, 500) }),
    });
  }
}
