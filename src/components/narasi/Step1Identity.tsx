"use client";

import { JENJANG_LABELS, LEVEL_OPTIONS } from "@/types/narasi";
import type { Jenjang, INarasiFormState, NarrativeTone } from "@/types/narasi";
import { cn } from "@/lib/cn";

interface Step1IdentityProps {
  state: INarasiFormState;
  onChange: (patch: Partial<INarasiFormState>) => void;
  onNext: () => void;
}

const JENJANG_LIST = Object.entries(JENJANG_LABELS) as [Jenjang, string][];

export function Step1Identity({ state, onChange, onNext }: Step1IdentityProps) {
  function handleJenjangChange(j: Jenjang) {
    onChange({ jenjang: j, levelList: [] });
  }

  function handleLevelToggle(level: string) {
    const next = state.levelList.includes(level)
      ? state.levelList.filter((l) => l !== level)
      : [...state.levelList, level];
    onChange({ levelList: next });
  }

  const levelOptions = state.jenjang ? LEVEL_OPTIONS[state.jenjang] : [];
  const needsLevel = levelOptions.length > 0;

  const canNext =
    state.namaSekolah.trim().length > 0 &&
    state.jenjang !== "" &&
    (!needsLevel || state.levelList.length > 0) &&
    !!state.narrativeTone;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Identitas Sekolah dan Jenjang</h2>
        <p className="text-xs text-text-secondary mt-1">
          Informasi ini digunakan untuk menyesuaikan tone narasi sesuai usia perkembangan anak.
        </p>
      </div>

      {/* Nama Sekolah */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-primary">Nama Sekolah</label>
        <input
          type="text"
          value={state.namaSekolah}
          onChange={(e) => onChange({ namaSekolah: e.target.value })}
          placeholder="Contoh: TK Islam Al Madani"
          className="w-full rounded-2xl border border-fammi-100 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-fammi/30 focus:border-fammi transition-all"
        />
      </div>

      {/* Jenjang */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-primary">Jenjang Pendidikan</label>
        <div className="flex flex-wrap gap-2">
          {JENJANG_LIST.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleJenjangChange(key)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                state.jenjang === key
                  ? "bg-fammi text-white border-fammi shadow-fammi"
                  : "border-fammi-100 text-text-secondary hover:border-fammi-300 hover:text-fammi-dark bg-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Level / Kelas — disembunyikan jika tidak ada pilihan (Daycare) */}
      {state.jenjang && needsLevel && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-primary">
            Level / Kelas
            <span className="ml-1.5 font-normal text-text-secondary">(pilih satu atau lebih)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {levelOptions.map((level) => {
              const isChecked = state.levelList.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleLevelToggle(level)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                    isChecked
                      ? "bg-fammi-100 text-fammi border-fammi-300 font-semibold"
                      : "border-fammi-100 text-text-secondary hover:border-fammi-200 hover:text-fammi-dark bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-sm border flex items-center justify-center transition-all",
                      isChecked ? "bg-fammi border-fammi" : "border-fammi-200",
                    )}
                  >
                    {isChecked && (
                      <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5" stroke="white" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {level}
                </button>
              );
            })}
          </div>
          {state.levelList.length > 0 && (
            <p className="text-[10px] text-text-secondary">
              Dipilih: {state.levelList.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Nada Narasi */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-primary">
          Nada Narasi
        </label>
        <div className="flex gap-3">
          {(["islami", "general"] as NarrativeTone[]).map((tone) => {
            const isSelected = state.narrativeTone === tone;
            const label = tone === "islami" ? "Islami" : "General";
            const desc =
              tone === "islami"
                ? "Menggunakan gaya bahasa hangat dengan nuansa Islami secara proporsional."
                : "Menggunakan gaya bahasa hangat, netral, dan inklusif tanpa frasa religius.";
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ narrativeTone: tone })}
                className={cn(
                  "flex-1 flex flex-col gap-1.5 p-3.5 rounded-2xl border-2 text-left transition-all",
                  isSelected
                    ? "border-fammi bg-fammi-50"
                    : "border-fammi-100 hover:border-fammi-200 bg-white",
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected ? "border-fammi bg-fammi" : "border-fammi-200",
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isSelected ? "text-fammi" : "text-text-primary",
                    )}
                  >
                    {label}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed pl-6">{desc}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-text-secondary">
          Kedua mode tetap menggunakan sapaan Ayah Bunda dan ananda.
        </p>
      </div>

      {/* Action */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-fammi text-white text-sm font-semibold shadow-fammi hover:bg-fammi-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Lanjut ke Upload
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
