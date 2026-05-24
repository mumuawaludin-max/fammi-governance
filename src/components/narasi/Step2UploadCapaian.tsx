"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { ICapaianFormState } from "@/types/narasi";

interface Step2UploadCapaianProps {
  state: ICapaianFormState;
  onChange: (patch: Partial<ICapaianFormState>) => void;
  onNext: () => void;
  onBack: () => void;
  isParsing: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Step2UploadCapaian({ state, onChange, onNext, onBack, isParsing }: Step2UploadCapaianProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      alert("Format file tidak didukung. Harap upload file .xlsx");
      return;
    }
    onChange({ file, parsedWorkbook: null, previewData: null, isApproved: false });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
    e.target.value = "";
  }

  const hasFile = !!state.file;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Upload Workbook Excel</h2>
        <p className="text-xs text-text-secondary mt-1">
          Workbook harus memiliki kolom <strong>Elemen</strong>, <strong>Tujuan Pembelajaran</strong>, dan <strong>Indikator</strong>.
          Format yang diterima: <strong>.xlsx</strong>
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !hasFile && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed p-10 transition-all cursor-pointer",
          isDragging
            ? "border-fammi bg-fammi-50 scale-[1.01]"
            : hasFile
              ? "border-success/40 bg-success/5 cursor-default"
              : "border-fammi-200 hover:border-fammi hover:bg-fammi-50",
        )}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={handleInputChange} />

        {hasFile ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-success" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-primary">{state.file!.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">{formatBytes(state.file!.size)}</p>
              {isParsing && <p className="text-xs text-fammi mt-1 animate-pulse">Membaca workbook...</p>}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ file: null, parsedWorkbook: null, previewData: null, isApproved: false });
              }}
              className="text-xs text-danger hover:underline"
            >
              Hapus file
            </button>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fammi-100">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-fammi" stroke="currentColor" strokeWidth={1.5}>
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-primary">
                {isDragging ? "Lepas file di sini" : "Seret file ke sini atau klik untuk browse"}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Hanya file .xlsx yang diterima</p>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-fammi-50 rounded-2xl p-4 border border-fammi-100">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5 text-fammi" stroke="currentColor" strokeWidth={2}>
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-text-primary">Struktur workbook yang diharapkan:</p>
          <ul className="text-xs text-text-secondary space-y-0.5 list-disc list-inside">
            <li>Kolom <strong>Elemen</strong> (wajib)</li>
            <li>Kolom <strong>Tujuan Pembelajaran</strong> atau <strong>Capaian Pembelajaran</strong></li>
            <li>Kolom <strong>Indikator</strong> atau <strong>Indikator Pencapaian</strong> (wajib)</li>
            <li>Sheet pertama akan dibaca secara otomatis</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
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
          onClick={onNext}
          disabled={!hasFile || isParsing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isParsing ? "Membaca..." : "Validasi Workbook"}
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
