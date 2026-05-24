"use client";

import { useState } from "react";
import { exportToExcel } from "@/lib/narasi/narasi-exporter";
import type { INarasiFormState } from "@/types/narasi";
import { JENJANG_LABELS } from "@/types/narasi";

interface Step5ExportProps {
  state: INarasiFormState;
  onBack: () => void;
  onReset: () => void;
}

export function Step5Export({ state, onBack, onReset }: Step5ExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  async function handleExport() {
    if (!state.previewData) return;
    setIsExporting(true);
    try {
      const jenjangLabel = state.jenjang
        ? { DAYCARE: "Daycare", TK: "TK", SD: "SD", SMP: "SMP", SMA: "SMA" }[state.jenjang]
        : undefined;
      exportToExcel(state.previewData, state.namaSekolah, jenjangLabel, state.levelList);
      setExported(true);
    } finally {
      setIsExporting(false);
    }
  }

  const preview = state.previewData;

  if (!preview) {
    return (
      <div className="text-sm text-text-secondary">
        Data preview tidak ditemukan. Kembali dan generate ulang.
      </div>
    );
  }

  const sheets = [
    { name: "Indikator Guru",    count: preview.indikatorGuru.length },
    { name: "Rubrik Orangtua",   count: preview.rubrikOrangtua.length },
    { name: "Narasi Umum",       count: preview.narasiUmum.length },
    { name: "Narasi Karakter",   count: preview.narasiKarakter.length },
    { name: "Narasi Keselarasan", count: preview.narasiKeselarasan.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Export Excel</h2>
        <p className="text-xs text-text-secondary mt-1">
          Hasil narasi akan diexport ke file Excel dengan 5 sheet sesuai struktur workbook Narasi Karakter.
        </p>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Ringkasan</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Sekolah",  value: state.namaSekolah || "—" },
            { label: "Jenjang",  value: state.jenjang ? JENJANG_LABELS[state.jenjang] : "—" },
            { label: "Level",    value: state.levelList.join(", ") || "—" },
            { label: "Karakter", value: `${state.parsedWorkbook?.karakterList.length ?? 0} karakter` },
            { label: "Indikator", value: `${state.parsedWorkbook?.indikatorCount ?? 0} baris` },
            { label: "Total Narasi", value: `${preview.narasiKarakter.length + preview.narasiKeselarasan.length + preview.narasiUmum.length} baris` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 bg-fammi-50 rounded-2xl p-3 border border-fammi-100">
              <span className="text-[10px] text-text-secondary">{label}</span>
              <span className="text-sm font-semibold text-text-primary truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sheet structure */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Struktur Sheet</p>
        {sheets.map((sheet, i) => (
          <div key={sheet.name} className="flex items-center gap-3 rounded-2xl border border-fammi-100 bg-white p-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-fammi-100 text-fammi text-xs font-bold">
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-primary">{sheet.name}</p>
              <p className="text-[10px] text-text-secondary">{sheet.count} baris</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-success" stroke="currentColor" strokeWidth={2.5}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Export button */}
      <div className="flex flex-col items-center gap-3 py-4">
        {exported ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-success" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-primary">File berhasil didownload</p>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">
                {`Narasi_Rapor_Karakter_${(state.namaSekolah || "Fammi").replace(/\s+/g, "_")}_${state.jenjang ? { DAYCARE: "Daycare", TK: "TK", SD: "SD", SMP: "SMP", SMA: "SMA" }[state.jenjang] : ""}${state.levelList.length > 0 ? `_${state.levelList.join("-").replace(/\s+/g, "")}` : ""}_${new Date().toISOString().slice(0, 10)}.xlsx`}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengexport...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Excel
              </>
            )}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-fammi-50">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali ke Preview
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-medium text-fammi hover:bg-fammi-50 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 20v-1m-5.657-1.636l.707-.707M4 12h1m2.636-6.364l.707.707" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Generate Baru
        </button>
      </div>
    </div>
  );
}
