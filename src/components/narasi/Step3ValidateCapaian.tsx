"use client";

import { cn } from "@/lib/cn";
import type { ICapaianFormState } from "@/types/narasi";

interface Step3ValidateCapaianProps {
  state: ICapaianFormState;
  onNext: () => void;
  onBack: () => void;
}

type StatusType = "ok" | "warning" | "error";

interface CheckItem {
  label: string;
  status: StatusType;
  detail?: string;
}

function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
        status === "ok" && "bg-success/10 text-success",
        status === "warning" && "bg-warning/10 text-warning",
        status === "error" && "bg-danger/10 text-danger",
      )}
    >
      {status === "ok" && (
        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === "warning" && "!"}
      {status === "error" && "✕"}
      {status === "ok" ? "Valid" : status === "warning" ? "Peringatan" : "Error"}
    </span>
  );
}

export function Step3ValidateCapaian({ state, onNext, onBack }: Step3ValidateCapaianProps) {
  const wb = state.parsedWorkbook;

  if (!wb) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-danger">Workbook belum diparse. Kembali ke step sebelumnya.</p>
        <button type="button" onClick={onBack} className="text-xs text-fammi underline">Kembali</button>
      </div>
    );
  }

  const checks: CheckItem[] = [
    {
      label: "Nama sekolah diisi",
      status: state.namaSekolah.trim().length > 0 ? "ok" : "error",
    },
    {
      label: "Jenjang pendidikan dipilih",
      status: state.jenjang !== "" ? "ok" : "error",
    },
    {
      label: "Level / kelas dipilih",
      status:
        state.levelList.length > 0
          ? "ok"
          : "error",
    },
    {
      label: "Nada narasi dipilih",
      status: !!state.narrativeTone ? "ok" : "error",
    },
    {
      label: "File .xlsx berhasil dibaca",
      status: wb.errors.length === 0 ? "ok" : "error",
    },
    {
      label: "Kolom Elemen terdeteksi",
      status: wb.elemenList.length > 0 ? "ok" : "error",
    },
    {
      label: "Kolom Indikator terdeteksi",
      status: wb.rowCount > 0 ? "ok" : "error",
    },
    {
      label: `Elemen terdeteksi: ${wb.elemenList.length}`,
      status: wb.elemenList.length > 0 ? "ok" : "warning",
      detail: wb.elemenList.length > 0 ? wb.elemenList.slice(0, 5).join(", ") + (wb.elemenList.length > 5 ? `... +${wb.elemenList.length - 5}` : "") : undefined,
    },
    {
      label: `Total indikator terdeteksi: ${wb.rowCount}`,
      status: wb.rowCount > 0 ? "ok" : "warning",
    },
  ];

  const hasError = checks.some((c) => c.status === "error") || wb.errors.length > 0;
  const hasWarning = !hasError && (checks.some((c) => c.status === "warning") || wb.warnings.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Validasi Struktur Workbook</h2>
        <p className="text-xs text-text-secondary mt-1">
          Periksa apakah workbook dan data identitas sudah lengkap sebelum melanjutkan ke proses generate.
        </p>
      </div>

      {/* Overall status */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl p-4 border",
          hasError
            ? "bg-danger/5 border-danger/20"
            : hasWarning
              ? "bg-warning/5 border-warning/20"
              : "bg-success/5 border-success/20",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            hasError ? "bg-danger/10" : hasWarning ? "bg-warning/10" : "bg-success/10",
          )}
        >
          {hasError ? (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-danger" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : hasWarning ? (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-warning" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className={cn("text-sm font-semibold", hasError ? "text-danger" : hasWarning ? "text-warning" : "text-success")}>
            {hasError ? "Ada error yang perlu diperbaiki" : hasWarning ? "Ada peringatan, tapi bisa dilanjutkan" : "Semua validasi berhasil"}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {hasError
              ? "Perbaiki error sebelum melanjutkan generate narasi."
              : hasWarning
                ? "Kamu tetap bisa generate, namun hasilnya mungkin tidak optimal."
                : "Workbook siap diproses. Lanjut ke generate narasi."}
          </p>
        </div>
      </div>

      {/* Check list */}
      <div className="flex flex-col gap-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-fammi-50 last:border-0">
            <div>
              <p className="text-xs font-medium text-text-primary">{check.label}</p>
              {check.detail && <p className="text-[10px] text-text-secondary mt-0.5">{check.detail}</p>}
            </div>
            <StatusBadge status={check.status} />
          </div>
        ))}
      </div>

      {/* Errors from parser */}
      {wb.errors.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-danger/5 rounded-2xl p-4 border border-danger/20">
          <p className="text-xs font-semibold text-danger">Error:</p>
          {wb.errors.map((e, i) => (
            <p key={i} className="text-xs text-danger">{e}</p>
          ))}
        </div>
      )}

      {/* Warnings from parser */}
      {wb.warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-warning/5 rounded-2xl p-4 border border-warning/20">
          <p className="text-xs font-semibold text-warning">Peringatan:</p>
          {wb.warnings.map((w, i) => (
            <p key={i} className="text-xs text-warning">{w}</p>
          ))}
        </div>
      )}

      {/* Info about what will be generated */}
      {!hasError && (
        <div className="flex items-start gap-3 bg-fammi-50 rounded-2xl p-4 border border-fammi-100">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5 text-fammi" stroke="currentColor" strokeWidth={2}>
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-text-primary">Yang akan dihasilkan:</p>
            <ul className="text-xs text-text-secondary space-y-0.5 list-disc list-inside">
              {state.levelList.map((lv) => (
                <li key={lv}>Section CAPAIAN {lv.toUpperCase()}</li>
              ))}
              <li>Section NARASI PEMBUKA PENUTUP</li>
              <li>Section NARASI 100% TERCAPAI</li>
              {state.levelList.includes("TK B") && <li>Section NARASI CAPAIAN TK B 100%</li>}
              <li>Section NARASI SEMUA 0%</li>
            </ul>
            <p className="text-[10px] text-text-secondary mt-1">
              Nada narasi: <strong>{state.narrativeTone === "islami" ? "Islami" : "General"}</strong>
            </p>
          </div>
        </div>
      )}

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
          disabled={hasError}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Narasi
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
