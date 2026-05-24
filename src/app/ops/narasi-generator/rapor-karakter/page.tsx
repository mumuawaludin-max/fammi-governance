"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { parseWorkbook } from "@/lib/narasi/xlsx-parser";
import { NarasiStepper } from "@/components/narasi/NarasiStepper";
import { Step1Identity } from "@/components/narasi/Step1Identity";
import { Step2Upload } from "@/components/narasi/Step2Upload";
import { Step3Validate } from "@/components/narasi/Step3Validate";
import { Step4Preview } from "@/components/narasi/Step4Preview";
import { Step5Export } from "@/components/narasi/Step5Export";
import type { INarasiFormState, IPreviewData } from "@/types/narasi";

const INITIAL_STATE: INarasiFormState = {
  namaSekolah: "",
  jenjang: "",
  levelList: [],
  narrativeTone: "islami",
  file: null,
  parsedWorkbook: null,
  previewData: null,
  isApproved: false,
  step: 1,
};

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function RaporKarakterPage() {
  const [formState, setFormState] = useState<INarasiFormState>(INITIAL_STATE);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateState = useCallback((patch: Partial<INarasiFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Step navigation
  async function goToStep2() {
    updateState({ step: 2 });
  }

  async function goToStep3() {
    if (!formState.file) return;
    setIsParsing(true);
    try {
      const parsed = await parseWorkbook(formState.file);
      updateState({ parsedWorkbook: parsed, step: 3 });
    } catch {
      updateState({
        parsedWorkbook: {
          indikatorGuru: [],
          rubrikOrangtua: [],
          rawIndikatorGuru: [],
          rawRubrikOrangtua: [],
          karakterList: [],
          indikatorCount: 0,
          rubrikCount: 0,
          hasPredikat: false,
          hasColor: false,
          warnings: [],
          errors: ["Gagal membaca file. Pastikan format .xlsx dan workbook tidak korup."],
        },
        step: 3,
      });
    } finally {
      setIsParsing(false);
    }
  }

  async function goToStep4() {
    if (!formState.parsedWorkbook || !formState.jenjang) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/narasi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaSekolah: formState.namaSekolah,
          jenjang: formState.jenjang,
          levelList: formState.levelList,
          narrativeTone: formState.narrativeTone,
          workbook: formState.parsedWorkbook,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const json = await res.json() as { data: IPreviewData };
      updateState({ previewData: json.data, step: 4 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal generate narasi: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApprove() {
    updateState({ isApproved: true, step: 5 });
  }

  function handleRegenerate() {
    updateState({ previewData: null, isApproved: false, step: 3 });
    // Re-generate immediately
    setTimeout(() => goToStep4(), 10);
  }

  function handleReset() {
    setFormState(INITIAL_STATE);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <motion.nav
        custom={0} variants={section} initial="hidden" animate="visible"
        className="flex items-center gap-1.5 text-xs text-text-secondary flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href={ROUTES.HOME} className="hover:text-fammi transition-colors">Fammi Performance</Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href={ROUTES.OPS} className="hover:text-fammi transition-colors">Operasional</Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href={ROUTES.OPS_NARASI_GENERATOR} className="hover:text-fammi transition-colors">Narasi Generator</Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="text-text-primary font-medium">Rapor Karakter</span>
      </motion.nav>

      {/* Page header */}
      <motion.div custom={1} variants={section} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Generate Narasi Rapor Karakter</h1>
        <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
          Buat bank narasi rapor karakter secara otomatis dari workbook Excel sekolah.
          Narasi disesuaikan dengan jenjang, karakter, dan tone komunikasi Fammi.
        </p>
      </motion.div>

      {/* Main card */}
      <motion.div custom={2} variants={section} initial="hidden" animate="visible">
        <div className="bg-white rounded-card border border-fammi-100 p-6 md:p-8 flex flex-col gap-8">
          {/* Stepper */}
          <NarasiStepper currentStep={formState.step} />

          {/* Divider */}
          <div className="border-t border-fammi-50" />

          {/* Step content */}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-5 py-16">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-fammi-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-fammi animate-spin" />
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-fammi" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M20 12h1M17.657 17.657l-.707.707M12 20v1M6.343 17.657l-.707-.707M4 12H3M6.343 6.343l-.707-.707" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center max-w-sm">
                <p className="text-sm font-bold text-text-primary">Claude sedang membuat narasi...</p>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Menyusun narasi unik untuk <span className="font-semibold text-fammi">{formState.parsedWorkbook?.karakterList.length ?? 0} karakter</span> ×{" "}
                  <span className="font-semibold text-fammi">{formState.levelList.length} level</span> sesuai jenjang{" "}
                  {formState.jenjang ? { DAYCARE: "Daycare", TK: "TK", SD: "SD", SMP: "SMP", SMA: "SMA" }[formState.jenjang] : ""}{" "}
                  dan tone Fammi. Proses ini membutuhkan 15–30 detik.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary bg-fammi-50 rounded-2xl px-4 py-2 border border-fammi-100">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-fammi shrink-0" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Narasi mengikuti kaidah KBBI dan EYD V
              </div>
            </div>
          ) : formState.step === 1 ? (
            <Step1Identity
              state={formState}
              onChange={updateState}
              onNext={goToStep2}
            />
          ) : formState.step === 2 ? (
            <Step2Upload
              state={formState}
              onChange={updateState}
              onNext={goToStep3}
              onBack={() => updateState({ step: 1 })}
              isParsing={isParsing}
            />
          ) : formState.step === 3 ? (
            <Step3Validate
              state={formState}
              onNext={goToStep4}
              onBack={() => updateState({ step: 2 })}
            />
          ) : formState.step === 4 ? (
            <Step4Preview
              state={formState}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onBack={() => updateState({ step: 3 })}
            />
          ) : (
            <Step5Export
              state={formState}
              onBack={() => updateState({ step: 4 })}
              onReset={handleReset}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
