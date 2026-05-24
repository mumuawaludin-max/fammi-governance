"use client";

import { cn } from "@/lib/cn";
import type { INarasiFormState } from "@/types/narasi";

interface Step3ValidateProps {
  state: INarasiFormState;
  onNext: () => void;
  onBack: () => void;
}

type CheckStatus = "valid" | "warning" | "error";

interface ICheck {
  label: string;
  status: CheckStatus;
  detail?: string;
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "valid")
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-success shrink-0" stroke="currentColor" strokeWidth={2.5}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (status === "warning")
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-warning shrink-0" stroke="currentColor" strokeWidth={2}>
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-danger shrink-0" stroke="currentColor" strokeWidth={2}>
      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Step3Validate({ state, onNext, onBack }: Step3ValidateProps) {
  const wb = state.parsedWorkbook;

  if (!wb) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">Workbook belum diparsing. Kembali ke langkah sebelumnya.</p>
        <button onClick={onBack} className="w-fit text-xs text-fammi underline">Kembali</button>
      </div>
    );
  }

  const checks: ICheck[] = [
    {
      label: 'Sheet "Indikator Guru" ditemukan',
      status: wb.errors.some((e) => e.includes("Indikator Guru")) ? "error" : "valid",
    },
    {
      label: 'Sheet "Rubrik Orangtua" ditemukan',
      status: wb.errors.some((e) => e.includes("Rubrik Orangtua")) ? "error" : "valid",
    },
    {
      label: `Karakter terdeteksi`,
      status: wb.karakterList.length === 0 ? "warning" : "valid",
      detail: wb.karakterList.length > 0
        ? `${wb.karakterList.length} karakter: ${wb.karakterList.join(", ")}`
        : "Tidak ada karakter yang terdeteksi",
    },
    {
      label: `Indikator Guru`,
      status: wb.indikatorCount === 0 ? "warning" : "valid",
      detail: `${wb.indikatorCount} baris ditemukan`,
    },
    {
      label: `Rubrik Orangtua`,
      status: wb.rubrikCount === 0 ? "warning" : "valid",
      detail: `${wb.rubrikCount} baris ditemukan`,
    },
    {
      label: "Kolom predikat/rentang skor",
      status: wb.hasPredikat ? "valid" : "warning",
      detail: wb.hasPredikat ? "Terdeteksi" : "Tidak terdeteksi, akan menggunakan default Fammi",
    },
    {
      label: "Kolom BGCOLOR / TEXTCOLOR",
      status: wb.hasColor ? "valid" : "warning",
      detail: wb.hasColor ? "Terdeteksi" : "Tidak terdeteksi, akan menggunakan warna default",
    },
  ];

  // Additional warnings from parser
  const extraWarnings: ICheck[] = wb.warnings.map((w) => ({
    label: w,
    status: "warning" as CheckStatus,
  }));

  const hasErrors = wb.errors.length > 0;
  const allChecks = [...checks, ...extraWarnings];

  const overallStatus: CheckStatus = hasErrors
    ? "error"
    : allChecks.some((c) => c.status === "warning")
      ? "warning"
      : "valid";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Validasi Struktur Workbook</h2>
        <p className="text-xs text-text-secondary mt-1">
          Cek hasil parsing workbook sebelum memulai generate narasi.
        </p>
      </div>

      {/* Overall status */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl p-4 border",
          overallStatus === "valid"
            ? "bg-success/5 border-success/20"
            : overallStatus === "warning"
              ? "bg-warning/5 border-warning/20"
              : "bg-danger/5 border-danger/20",
        )}
      >
        <StatusIcon status={overallStatus} />
        <div>
          <p className={cn(
            "text-sm font-semibold",
            overallStatus === "valid" ? "text-success" : overallStatus === "warning" ? "text-warning" : "text-danger",
          )}>
            {overallStatus === "valid"
              ? "Workbook valid, siap generate"
              : overallStatus === "warning"
                ? "Ada beberapa peringatan, tapi masih bisa dilanjutkan"
                : "Ada error, perbaiki workbook terlebih dahulu"}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            File: <span className="font-medium">{state.file?.name}</span>
          </p>
        </div>
      </div>

      {/* Check list */}
      <div className="flex flex-col gap-2">
        {allChecks.map((check, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-2xl p-3.5 border",
              check.status === "valid"
                ? "border-fammi-50 bg-white"
                : check.status === "warning"
                  ? "border-warning/15 bg-warning/5"
                  : "border-danger/15 bg-danger/5",
            )}
          >
            <StatusIcon status={check.status} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">{check.label}</p>
              {check.detail && (
                <p className="text-xs text-text-secondary mt-0.5">{check.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fatal errors */}
      {hasErrors && (
        <div className="flex flex-col gap-2">
          {wb.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-3.5 bg-danger/5 border border-danger/20">
              <StatusIcon status="error" />
              <p className="text-xs text-danger">{err}</p>
            </div>
          ))}
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
          disabled={hasErrors}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Preview
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
