"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PreviewTable } from "./PreviewTable";
import type { INarasiFormState } from "@/types/narasi";
import { JENJANG_LABELS } from "@/types/narasi";

interface Step4PreviewProps {
  state: INarasiFormState;
  onApprove: () => void;
  onRegenerate: () => void;
  onBack: () => void;
}

type TabId = "indikator-guru" | "rubrik-orangtua" | "narasi-umum" | "narasi-karakter" | "narasi-keselarasan";

const TABS: { id: TabId; label: string }[] = [
  { id: "indikator-guru",      label: "1. Indikator Guru" },
  { id: "rubrik-orangtua",     label: "2. Rubrik Orangtua" },
  { id: "narasi-umum",         label: "3. Narasi Umum" },
  { id: "narasi-karakter",     label: "4. Narasi Karakter" },
  { id: "narasi-keselarasan",  label: "5. Narasi Keselarasan" },
];

export function Step4Preview({ state, onApprove, onRegenerate, onBack }: Step4PreviewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("indikator-guru");

  const preview = state.previewData;
  const wb = state.parsedWorkbook;

  if (!preview || !wb) {
    return (
      <div className="text-sm text-text-secondary">
        Preview belum tersedia. Kembali ke langkah sebelumnya.
      </div>
    );
  }

  const totalNarasi =
    preview.narasiKarakter.length + preview.narasiKeselarasan.length + preview.narasiUmum.length;

  // Build typed rows for each tab
  const narasiKarakterRows = preview.narasiKarakter.map((r) => ({
    Karakter: r.karakter,
    "Rentang Skor Indikator": r.rentangSkorIndikator,
    Narasi: r.narasi,
    "Nilai Awal": r.nilaiAwal,
    "Nilai Akhir": r.nilaiAkhir,
  }));

  const narasiKeselarasanRows = preview.narasiKeselarasan.map((r) => ({
    Karakter: r.karakter,
    "Rentang Skor Indikator": r.rentangSkorIndikator,
    "Narasi Hasil dari Sekolah": r.narasiHasilDariSekolah,
    "Narasi Hasil dari Orangtua": r.narasiHasilDariOrangtua,
    "Nilai Awal": r.nilaiAwal,
    "Nilai Akhir": r.nilaiAkhir,
    BGCOLOR: r.bgcolor,
    TEXTCOLOR: r.textcolor,
  }));

  const narasiUmumRows = preview.narasiUmum.map((r) => ({
    "Hasil Predikat": r.hasilPredikat,
    "Nilai Awal": r.nilaiAwal,
    "Nilai Akhir": r.nilaiAkhir,
    "Catatan Umum Perkembangan": r.catatanUmumPerkembangan,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Header info */}
      <div>
        <h2 className="text-base font-bold text-text-primary">Preview 5 Bagian Narasi</h2>
        <p className="text-xs text-text-secondary mt-1">
          Review hasil generate. Jika sudah sesuai, klik <strong>Approve</strong> untuk lanjut ke export.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Sekolah", value: state.namaSekolah || "—" },
          { label: "Jenjang", value: state.jenjang ? JENJANG_LABELS[state.jenjang] : "—" },
          { label: "Level", value: state.levelList.join(", ") || "—" },
          { label: "File", value: state.file?.name ?? "—" },
          { label: "Karakter", value: `${wb.karakterList.length} karakter` },
          { label: "Indikator", value: `${wb.indikatorCount} baris` },
          { label: "Rubrik", value: `${wb.rubrikCount} baris` },
          { label: "Total Narasi", value: `${totalNarasi} baris` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5 bg-fammi-50 rounded-full px-3 py-1.5 border border-fammi-100">
            <span className="text-[10px] text-text-secondary">{label}:</span>
            <span className="text-[10px] font-semibold text-text-primary truncate max-w-[180px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 p-1 bg-fammi-50 rounded-2xl min-w-max">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === id
                  ? "bg-white text-fammi shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === "indikator-guru" && (
          <PreviewTable
            columns={preview.indikatorGuruColumns}
            rows={preview.indikatorGuru as Record<string, string>[]}
          />
        )}
        {activeTab === "rubrik-orangtua" && (
          <PreviewTable
            columns={preview.rubrikOrangtuaColumns}
            rows={preview.rubrikOrangtua as Record<string, string>[]}
          />
        )}
        {activeTab === "narasi-umum" && (
          <PreviewTable
            columns={["Hasil Predikat", "Nilai Awal", "Nilai Akhir", "Catatan Umum Perkembangan"]}
            rows={narasiUmumRows}
            searchable
          />
        )}
        {activeTab === "narasi-karakter" && (
          <PreviewTable
            columns={["Karakter", "Rentang Skor Indikator", "Narasi", "Nilai Awal", "Nilai Akhir"]}
            rows={narasiKarakterRows}
            searchable
          />
        )}
        {activeTab === "narasi-keselarasan" && (
          <PreviewTable
            columns={["Karakter", "Rentang Skor Indikator", "Narasi Hasil dari Sekolah", "Narasi Hasil dari Orangtua", "Nilai Awal", "Nilai Akhir", "BGCOLOR", "TEXTCOLOR"]}
            rows={narasiKeselarasanRows}
            colorColBg="BGCOLOR"
            colorColText="TEXTCOLOR"
            searchable
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-fammi-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-medium text-fammi hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Regenerate
          </button>
        </div>
        <button
          type="button"
          onClick={onApprove}
          disabled={state.isApproved}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
            state.isApproved
              ? "bg-success text-white cursor-default"
              : "bg-fammi text-white shadow-fammi hover:bg-fammi-dark",
          )}
        >
          {state.isApproved ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Disetujui
            </>
          ) : (
            <>
              Approve Hasil
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
