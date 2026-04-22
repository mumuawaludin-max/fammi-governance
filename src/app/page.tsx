import { Card } from "@/components/ui/Card";
import { StatBadge } from "@/components/ui/StatBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SCHOOL_CURRENT, SCHOOL_TARGET } from "@/lib/constants";

export default function HomePage() {
  const progress = (SCHOOL_CURRENT / SCHOOL_TARGET) * 100;

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-fammi">
          Fammi Governance OS
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
          Mission control untuk{" "}
          <span className="text-gradient-fammi">perubahan sosial</span>{" "}
          yang kita rawat bersama.
        </h1>
        <p className="max-w-2xl text-text-secondary leading-relaxed">
          Tahap 1 selesai — fondasi desain, tokens, dan UI primitif siap
          dipakai. Komponen di bawah adalah preview kontrak visual yang
          kita ikuti di seluruh produk.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card variant="gradient" hoverable>
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status="purple" label="Impact" />
            <span className="text-xs text-text-secondary">Live</span>
          </div>
          <StatBadge
            label="Sekolah Aktif"
            value={SCHOOL_CURRENT}
            unit="sekolah"
            trend="up"
            trendValue="+3 bulan ini"
            accent="primary"
          />
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status="hijau" label="On Track" />
            <span className="text-xs text-text-secondary">CSAT</span>
          </div>
          <StatBadge
            label="Rata-rata CSAT"
            value={4.3}
            unit="/ 5"
            trend="up"
            trendValue="+0.2"
            accent="success"
          />
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status="kuning" label="Perhatian" />
            <span className="text-xs text-text-secondary">Runway</span>
          </div>
          <StatBadge
            label="Runway"
            value={7}
            unit="bulan"
            trend="down"
            trendValue="-1 bulan"
            accent="warning"
          />
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 flex flex-col items-center justify-center">
          <ProgressRing
            percentage={progress}
            size={200}
            strokeWidth={16}
            label={`${SCHOOL_CURRENT} / ${SCHOOL_TARGET}`}
            sublabel="sekolah"
          />
          <p className="mt-4 text-sm text-text-secondary text-center max-w-xs">
            Progress menuju target 4.000 sekolah. Setiap langkah dihitung.
          </p>
        </Card>

        <Card className="md:col-span-2" variant="tinted" hoverable={false}>
          <h2 className="text-xl font-bold mb-4">Status palet</h2>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="hijau" label="On Track" />
            <StatusBadge status="kuning" label="At Risk" />
            <StatusBadge status="merah" label="Overdue" />
            <StatusBadge status="info" label="In Review" />
            <StatusBadge status="purple" label="Focus" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <LoadingSkeleton variant="stat" />
            <LoadingSkeleton variant="stat" />
          </div>
        </Card>
      </section>

      <section>
        <EmptyState
          emoji="🌱"
          title="Dashboard domain akan hadir di Tahap 2"
          description="Modul Finance, Operations, Product, Growth, Team, dan Impact akan mengisi ruang ini. Fondasi sudah siap — saatnya membangun."
        />
      </section>
    </div>
  );
}
