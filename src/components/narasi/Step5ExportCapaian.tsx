"use client";

import { useState } from "react";
import { exportCapaianToExcel } from "@/lib/narasi/narasi-exporter-capaian";
import { JENJANG_LABELS } from "@/types/narasi";
import type { ICapaianFormState } from "@/types/narasi";

interface Step5ExportCapaianProps {
  state: ICapaianFormState;
  onBack: () => void;
  onReset: () => void;
}

export function Step5ExportCapaian({ state, onBack, onReset }: Step5ExportCapaianProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const data = state.previewData!;
  const jenjangLabel = state.jenjang ? JENJANG_LABELS[state.jenjang as keyof typeof JENJANG_LABELS] : "";
  const levels = state.jenjang === "DAYCARE" ? ["Daycare"] : state.levelList;

  function handleExport() {
    if (!data || !state.jenjang) return;
    setIsExporting(true);
    try {
      exportCapaianToExcel(
        data,
        state.namaSekolah,
        jenjangLabel,
        levels,
        state.narrativeTone,
      );
      setExported(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Export gagal: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }

  const hasTKB100 = !!(data.narasiTKB100Data && data.narasiTKB100Data.length > 0);
  const totalSheets = data.levelSections.length + 3 + (hasTKB100 ? 1 : 0) + 1; // levels + sections + optional TKB100 + metadata

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Export ke Excel</h2>
        <p className="text-xs text-text-secondary mt-1">
          Narasi sudah disetujui. Download hasil generate sebagai file Excel dengan semua section.
        </p>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-3 bg-fammi-50 rounded-[32px] p-6 border border-fammi-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-success" stroke="currentColor" strokeWidth={1.5}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Narasi disetujui</p>
            <p className="text-xs text-text-secondary">Siap diexport ke Excel</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Sekolah", value: state.namaSekolah },
            { label: "Jenjang", value: jenjangLabel },
            { label: "Level / Kelas", value: levels.join(", ") },
            { label: "Nada Narasi", value: state.narrativeTone === "islami" ? "Islami" : "General" },
            { label: "Total Elemen", value: `${state.parsedWorkbook?.elemenList.length ?? 0} elemen` },
            { label: "Total Sheet Export", value: `${totalSheets} sheet` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-text-secondary">{item.label}</p>
              <p className="text-xs font-semibold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sheet list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-primary">Sheet yang akan di-export:</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-fammi-100 text-fammi text-[10px] font-bold">M</span>
            Metadata (nama sekolah, jenjang, nada narasi, tanggal)
          </div>
          {data.levelSections.map((s, i) => (
            <div key={s.levelName} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-fammi-100 text-fammi text-[10px] font-bold">{i + 1}</span>
              {s.levelName}
            </div>
          ))}
          {[
            "NARASI PEMBUKA PENUTUP",
            "NARASI 100% TERCAPAI",
            ...(hasTKB100 ? ["NARASI CAPAIAN TK B 100%"] : []),
            "NARASI SEMUA 0%",
          ].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-fammi-100 text-fammi text-[10px] font-bold">{data.levelSections.length + i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {exported && (
        <div className="flex items-center gap-3 bg-success/5 rounded-2xl p-4 border border-success/20">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success shrink-0" stroke="currentColor" strokeWidth={2}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-success font-medium">
            File berhasil didownload. Cek folder Downloads kamu.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

          {exported && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-semibold text-fammi hover:bg-fammi-50 transition-all"
            >
              Generate Baru
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
