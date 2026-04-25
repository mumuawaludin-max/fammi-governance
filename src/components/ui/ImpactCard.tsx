"use client";

import { useRouter } from "next/navigation";
import { Globe, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProgressRing } from "./ProgressRing";
import { useCountUp } from "@/hooks/use-count-up";
import { useOpsData } from "@/hooks/use-ops";
import { ROUTES } from "@/lib/constants";

const SCHOOL_TARGET = 4000;

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
  const { deliveries, isLoading } = useOpsData();

  // Total siswa terlayani = sum JML_SISWA dari seluruh produk
  const totalSiswa = deliveries.reduce((sum, d) => sum + (d.jumlahSiswa ?? 0), 0);

  // Total sekolah = jumlah baris seluruh produk (RK + CP + SP)
  const totalSekolah = deliveries.length;

  // Progress menuju target 4.000 sekolah
  const pct = totalSekolah > 0 ? (totalSekolah / SCHOOL_TARGET) * 100 : 0;

  const siswaCount   = useCountUp(totalSiswa,   1600, 400);
  const sekolahCount = useCountUp(totalSekolah, 1000, 300);

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
          Misi &amp; Dampak
        </span>
      </div>

      {/* Center: ring + numbers */}
      <div className="flex-1 flex items-center gap-6 mb-4">
        <ProgressRing
          percentage={pct}
          size={140}
          strokeWidth={12}
          label={isLoading ? "—" : `${totalSekolah} dari ${SCHOOL_TARGET}`}
          sublabel="sekolah"
        />
        <div className="flex flex-col gap-4">
          {/* Siswa terlayani */}
          <div>
            <p className="font-mono text-3xl font-bold text-text-primary tabular-nums leading-none">
              {isLoading ? "—" : siswaCount.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Siswa terlayani</p>
          </div>
          {/* Total sekolah di seluruh produk */}
          <div>
            <p className="font-mono text-3xl font-bold text-text-primary tabular-nums leading-none">
              {isLoading ? "—" : sekolahCount.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Total sekolah (semua produk)</p>
          </div>
        </div>
      </div>

      {/* Bottom: placeholder CSAT */}
      <div className="pt-4 border-t border-fammi-100 flex items-center gap-3">
        <StarRating score={0} />
        <span className="font-mono text-sm font-semibold text-text-primary">—</span>
        <span className="text-xs text-text-secondary">rata-rata CSAT</span>
      </div>
    </button>
  );
}
