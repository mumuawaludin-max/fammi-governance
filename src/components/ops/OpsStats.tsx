import { AlertTriangle, Clock, CheckCircle2, PartyPopper, School } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatsFilter = "all" | "merah" | "kuning" | "hijau" | "selesai";

interface OpsStatsSummary {
  totalActive: number;
  merahCount: number;
  kuningCount: number;
  hijauCount: number;
  selesaiCount: number;
}

interface OpsStatsProps {
  summary: OpsStatsSummary;
  activeFilter?: StatsFilter;
  onFilter?: (f: StatsFilter) => void;
}

// ── Chip component ────────────────────────────────────────────────────────────

interface StatChipProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  filterKey: StatsFilter;
  activeFilter?: StatsFilter;
  onFilter?: (f: StatsFilter) => void;
}

function StatChip({ label, value, icon: Icon, color, bg, border, filterKey, activeFilter, onFilter }: StatChipProps) {
  const isActive = activeFilter === filterKey;
  const clickable = !!onFilter && filterKey !== "all";

  return (
    <button
      onClick={clickable ? () => onFilter!(isActive ? "all" : filterKey) : undefined}
      disabled={!clickable}
      className={cn(
        "flex items-center gap-3 rounded-[24px] p-4 border text-left w-full",
        "transition-all duration-200",
        isActive
          ? cn("ring-2 ring-offset-1 scale-[1.02] shadow-sm", color.replace("text-", "ring-"))
          : clickable
            ? "hover:scale-[1.01] hover:shadow-sm cursor-pointer"
            : "cursor-default",
        bg, border,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/60">
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className={cn("text-2xl font-bold font-mono tabular-nums leading-none", color)}>
          {value}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
      {isActive && (
        <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80", color)}>
          aktif
        </span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function OpsStats({ summary, activeFilter = "all", onFilter }: OpsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatChip
        label="Sekolah aktif"
        value={summary.totalActive}
        icon={School}
        color="text-fammi"
        bg="bg-fammi-50"
        border="border-fammi-200"
        filterKey="all"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatChip
        label="Butuh perhatian"
        value={summary.merahCount}
        icon={AlertTriangle}
        color="text-danger"
        bg="bg-danger/5"
        border="border-danger/20"
        filterKey="merah"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatChip
        label="Perlu dipantau"
        value={summary.kuningCount}
        icon={Clock}
        color="text-warning"
        bg="bg-warning/5"
        border="border-warning/20"
        filterKey="kuning"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatChip
        label="Tepat jadwal"
        value={summary.hijauCount}
        icon={CheckCircle2}
        color="text-success"
        bg="bg-success/5"
        border="border-success/20"
        filterKey="hijau"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
      <StatChip
        label="Selesai"
        value={summary.selesaiCount}
        icon={PartyPopper}
        color="text-fammi-dark"
        bg="bg-fammi-50"
        border="border-fammi-200"
        filterKey="selesai"
        activeFilter={activeFilter}
        onFilter={onFilter}
      />
    </div>
  );
}
