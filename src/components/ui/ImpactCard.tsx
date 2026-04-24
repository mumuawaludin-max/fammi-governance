"use client";

import { useRouter } from "next/navigation";
import { Globe, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProgressRing } from "./ProgressRing";
import { useCountUp } from "@/hooks/use-count-up";
import { useImpactData } from "@/hooks/use-impact";
import { ROUTES, SCHOOL_TARGET } from "@/lib/constants";
import type { ISocialImpact } from "@/types";

const MOCK: ISocialImpact = {
  schoolsActive: 55,
  schoolsTarget: SCHOOL_TARGET,
  studentsServed: 14_250,
  familiesReached: 11_800,
  csatAvg: 4.3,
  impactScore: 82,
  progressToTarget: (55 / 4000) * 100,
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={cn(
            i < Math.floor(score) ? "fill-warning text-warning" : "text-fammi-200",
          )}
        />
      ))}
    </div>
  );
}

export function ImpactCard() {
  const router = useRouter();
  const { data, isLoading } = useImpactData();
  const impact = data ?? MOCK;

  const pct = (impact.schoolsActive / impact.schoolsTarget) * 100;
  const studentsCount = useCountUp(impact.studentsServed, 1600, 400);
  const familiesCount = useCountUp(impact.familiesReached, 1600, 500);

  return (
    <button
      onClick={() => router.push(ROUTES.IMPACT)}
      className={cn(
        "w-full text-left rounded-card p-8 min-h-[280px]",
        "bg-white border-2 border-fammi-200",
        "flex flex-col justify-between",
        "transition-all duration-300 hover:scale-[1.01] hover:shadow-neon",
        "cursor-pointer",
        isLoading && "opacity-80",
      )}
      aria-label="Lihat detail impact"
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-4">
        <Globe size={28} className="text-fammi" />
        <span className="text-xs font-semibold tracking-widest text-text-secondary uppercase">
          Misi & Dampak
        </span>
      </div>

      {/* Center: ring + numbers */}
      <div className="flex-1 flex items-center gap-6 mb-4">
        <ProgressRing
          percentage={pct}
          size={140}
          strokeWidth={12}
          label={`${impact.schoolsActive} dari ${impact.schoolsTarget}`}
          sublabel="sekolah"
        />
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-mono text-3xl font-bold text-text-primary tabular-nums leading-none">
              {studentsCount.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Siswa terlayani</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-text-primary tabular-nums leading-none">
              {familiesCount.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Keluarga terjangkau</p>
          </div>
        </div>
      </div>

      {/* Bottom: CSAT */}
      <div className="pt-4 border-t border-fammi-100 flex items-center gap-3">
        <StarRating score={impact.csatAvg} />
        <span className="font-mono text-sm font-semibold text-text-primary">
          {impact.csatAvg.toFixed(1)}
        </span>
        <span className="text-xs text-text-secondary">rata-rata CSAT</span>
      </div>
    </button>
  );
}
