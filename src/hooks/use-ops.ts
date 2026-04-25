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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false },
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
