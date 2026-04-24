/**
 * Parser: raw sheet row → ISchoolDelivery
 *
 * Kolom yang diharapkan di sheet fammi_operations (nama bisa pakai salah satu):
 *
 * | Nama kolom sheet        | Field TypeScript     | Contoh nilai           |
 * |-------------------------|----------------------|------------------------|
 * | schoolId / ID Sekolah   | schoolId             | S001                   |
 * | schoolName / Nama Sekolah | schoolName         | SDN Mampang 01         |
 * | produk / Produk         | produk               | RAPOR_KARAKTER         |
 * | deliveryStage / Stage   | deliveryStage        | PENGERJAAN             |
 * | hariTersisa / Hari Tersisa | hariTersisa       | 5                      |
 * | progressPct / Progress  | progressPct          | 65                     |
 * | trafficLight / Traffic Light | trafficLight   | MERAH                  |
 * | bottleneckFlag / Bottleneck | bottleneckFlag  | TRUE / Ya / 1          |
 * | bottleneckDesc / Catatan | bottleneckDesc      | Laporan belum masuk    |
 * | csatScore / CSAT        | csatScore            | 4.5                    |
 */

import type { ISchoolDelivery, DeliveryStage, TrafficLight, ProductKind } from "@/types";

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

function toBool(val: string): boolean {
  return ["true", "ya", "y", "yes", "1"].includes(val.toLowerCase());
}

export function parseOpsRow(row: Record<string, string>): ISchoolDelivery | null {
  const schoolName = pick(row, "schoolName", "Nama Sekolah", "nama_sekolah", "School Name");
  if (!schoolName) return null;

  const csatRaw = parseFloat(pick(row, "csatScore", "CSAT", "csat_score"));
  const progress = parseFloat(pick(row, "progressPct", "Progress", "Progress (%)", "progress_pct"));
  const hari = parseInt(pick(row, "hariTersisa", "Hari Tersisa", "hari_tersisa", "Deadline"), 10);

  return {
    schoolId: pick(row, "schoolId", "ID Sekolah", "school_id", "No") || schoolName,
    schoolName,
    produk: (pick(row, "produk", "Produk") || "RAPOR_KARAKTER") as ProductKind,
    deliveryStage: (pick(row, "deliveryStage", "Stage", "Tahap", "delivery_stage") || "BELUM_MULAI") as DeliveryStage,
    hariTersisa: isNaN(hari) ? 0 : hari,
    progressPct: isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress)),
    trafficLight: (pick(row, "trafficLight", "Traffic Light", "traffic_light", "Status") || "HIJAU") as TrafficLight,
    bottleneckFlag: toBool(pick(row, "bottleneckFlag", "Bottleneck", "bottleneck_flag")),
    bottleneckDesc: pick(row, "bottleneckDesc", "Catatan Bottleneck", "Deskripsi", "bottleneck_desc") || undefined,
    csatScore: isNaN(csatRaw) ? undefined : csatRaw,
  };
}
