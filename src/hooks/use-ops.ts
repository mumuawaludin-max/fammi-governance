"use client";

import useSWR from "swr";
import type { IApiResponse, IOpsData, ISchoolDelivery, DeliveryStage } from "@/types";

/**
 * Tipe tambahan untuk field lama dari Apps Script versi sebelumnya.
 * Field deliverRapor1/2/3 sudah diganti deliverWalas/Individu/Kepsek/Ortu,
 * tapi API lama masih mengembalikan nama lama — perlu di-remap di sini.
 */
type LegacyDeliveryFields = {
  deliverRapor1?: string;
  deliverRapor2?: string;
  deliverRapor3?: string;
};

const LS_KEY = "fammi_ops_cache";

function readLsCache(): IApiResponse<IOpsData> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as IApiResponse<IOpsData>) : undefined;
  } catch {
    return undefined;
  }
}

function writeLsCache(data: IApiResponse<IOpsData>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* quota ignore */ }
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d: IApiResponse<IOpsData>) => { writeLsCache(d); return d; });

/**
 * Normalisasi nilai opsional dari Apps Script ke boolean | undefined.
 *
 * Apps Script mengirim:
 *   true  → checkbox dicentang
 *   false → checkbox ada tapi belum dicentang
 *   null / "" / "N/A" / "-" → sel kosong atau kolom tidak berlaku untuk baris ini
 *
 * Hanya true/false yang perlu tampil. Selain itu → undefined (jangan tampilkan).
 */
function normOptBool(v: unknown): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  if (s === "" || s === "n/a" || s === "na" || s === "-" || s === "tidak ada") return undefined;
  return ["true", "ya", "y", "yes", "1", "✓", "x"].includes(s) ? true : false;
}

type RawDelivery = ISchoolDelivery & LegacyDeliveryFields & Record<string, unknown>;

/** Normalisasi semua optional boolean field supaya undefined = kolom tidak ada. */
function normalizePersiapanFlags(raw: RawDelivery): Partial<ISchoolDelivery> {
  return {
    dataGuru:             normOptBool(raw.dataGuru),
    sosialisasi:          normOptBool(raw.sosialisasi),
    setupGuru:            normOptBool(raw.setupGuru),
    setupOrtu:            normOptBool(raw.setupOrtu),
    setupSiswa:           normOptBool(raw.setupSiswa),
    selesaiInput:         normOptBool(raw.selesaiInput),
    approval:             normOptBool(raw.approval),
    coda:                 normOptBool(raw.coda),
    excel:                normOptBool(raw.excel),
    foto:                 normOptBool(raw.foto),
    excelApproval:        normOptBool(raw.excelApproval),
    codaPembuatanRapor:   normOptBool(raw.codaPembuatanRapor),
    pluginPembuatanRapor: normOptBool(raw.pluginPembuatanRapor),
    rWalas:               normOptBool(raw.rWalas),
    rIndividu:            normOptBool(raw.rIndividu),
    rKepsek:              normOptBool(raw.rKepsek),
    rOrtu:                normOptBool(raw.rOrtu),
    statusPaparanKepsek:  normOptBool(raw.statusPaparanKepsek),
    statusPaparanWalas:   normOptBool(raw.statusPaparanWalas),
    statusPaparanOrtu:    normOptBool(raw.statusPaparanOrtu),
  };
}

export interface OpsSummary {
  totalActive: number;
  merahCount: number;
  kuningCount: number;
  hijauCount: number;
  selesaiCount: number;
}

export interface OpsHookResult {
  deliveries: ISchoolDelivery[];
  summary: OpsSummary | undefined;
  hasSiswaData: boolean;
  /** "seed" | "fammi_operations" | "fammi_operations_stale" */
  source: string | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refresh: () => void;
  lastUpdated: string | undefined;
}

export function useOpsData(): OpsHookResult {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<IOpsData>>(
    "/api/ops",
    fetcher,
    {
      fallbackData:       readLsCache(),
      refreshInterval:    60 * 1000,
      revalidateOnFocus:  true,
      revalidateOnReconnect: true,
      keepPreviousData:   true,
    },
  );

  const opsData = data?.data;

  // Normalisasi deliveries di sisi klien untuk menangani data dari Apps Script
  // versi lama yang mungkin punya pemetaan kolom salah atau nama field lama.
  const deliveries: ISchoolDelivery[] = (opsData?.deliveries ?? []).map((d) => {
    // Cast untuk mengakses field lama (deliverRapor1/2/3) yang mungkin ada di respons API lama
    const raw = d as ISchoolDelivery & LegacyDeliveryFields;

    return {
      ...raw,

      // "KELENGKAPAN" adalah nama stage lama sebelum diganti "PEMBUATAN"
      deliveryStage: (raw.deliveryStage as string) === "KELENGKAPAN"
        ? ("PEMBUATAN" as DeliveryStage)
        : raw.deliveryStage,

      // tipeInput kadang berisi angka (salah kolom dari Apps Script lama) — buang
      tipeInput: raw.tipeInput && isNaN(Number(raw.tipeInput)) ? raw.tipeInput : undefined,

      // ── Backward compat: remap deliverRapor1/2/3 → nama baru per penerima ──
      // Apps Script lama mengembalikan deliverRapor1/2/3; yang baru pakai
      // deliverWalas/Individu/Kepsek/Ortu. Jika field baru sudah ada, pakai itu.
      deliverWalas:    raw.deliverWalas    ?? (raw.produk !== "CP" ? raw.deliverRapor1 : undefined),
      deliverIndividu: raw.deliverIndividu ?? raw.deliverRapor2,
      deliverKepsek:   raw.deliverKepsek   ?? raw.deliverRapor3,
      deliverOrtu:     raw.deliverOrtu     ?? (raw.produk === "CP" ? raw.deliverRapor1 : undefined),

      // trafficLight dipakai langsung dari Apps Script — sudah dihitung dengan benar
      // di computeTrafficLight(). Jangan di-override di sisi klien supaya angka di
      // summary card (Merah/Kuning/Hijau) konsisten dengan data di spreadsheet.
      trafficLight: raw.trafficLight,

      // Apps Script mengirim false (boolean default checkbox) untuk sel yang kosong
      // maupun sel yang memang belum dicentang — kita tidak bisa bedakan dari nilai
      // saja. Heuristik: jika sekolah sudah melewati PERSIAPAN, item persiapan yang
      // masih false pasti N/A (bukan pending) — kalau pending, stage tidak akan advance.
      ...normalizePersiapanFlags(raw),
    };
  });

  const active  = deliveries.filter((d) => !d.isComplete);
  const selesai = deliveries.filter((d) =>  d.isComplete);

  // Summary dihitung langsung dari deliveries yang sudah dinormalisasi.
  // trafficLight sudah diambil as-is dari Apps Script sehingga angka ini
  // konsisten 1:1 dengan data di spreadsheet.
  const computedSummary: OpsSummary | undefined = opsData ? {
    totalActive:  active.length,
    merahCount:   active.filter((d) => d.trafficLight === "MERAH").length,
    kuningCount:  active.filter((d) => d.trafficLight === "KUNING").length,
    hijauCount:   active.filter((d) => d.trafficLight === "HIJAU").length,
    selesaiCount: selesai.length,
  } : undefined;

  // Fallback: cek dari deliveries jika hasSiswaData tidak tersedia dari server
  const hasSiswaData = opsData?.hasSiswaData ??
    deliveries.some((d) => (d.jumlahSiswa ?? 0) > 0);

  return {
    deliveries,
    hasSiswaData,
    summary: computedSummary,
    source:      data?.source,
    error,
    isLoading,
    refresh:     () => {
      // force=true bypass cache server-side, lalu SWR revalidate
      fetch("/api/ops?force=true").then(() => mutate());
    },
    lastUpdated: data?.lastUpdated,
  };
}
