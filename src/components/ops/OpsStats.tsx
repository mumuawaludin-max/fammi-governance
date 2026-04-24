import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, School } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ISchoolDelivery } from "@/types";

interface StatItem {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function StatChip({ label, value, icon: Icon, color, bg, border }: StatItem) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[24px] p-4 border", bg, border)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className={cn("text-2xl font-bold font-mono tabular-nums leading-none", color)}>
          {value}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

interface OpsStatsProps {
  deliveries: ISchoolDelivery[];
}

export function OpsStats({ deliveries }: OpsStatsProps) {
  const active = deliveries.filter((d) => d.deliveryStage !== "SELESAI");
  const merah = active.filter((d) => d.trafficLight === "MERAH").length;
  const kuning = active.filter((d) => d.trafficLight === "KUNING").length;
  const hijau = active.filter((d) => d.trafficLight === "HIJAU").length;
  const bottleneck = active.filter((d) => d.bottleneckFlag).length;
  const selesai = deliveries.filter((d) => d.deliveryStage === "SELESAI").length;

  const stats: StatItem[] = [
    {
      label: "Sekolah aktif",
      value: active.length,
      icon: School,
      color: "text-fammi",
      bg: "bg-fammi-50",
      border: "border-fammi-200",
    },
    {
      label: "Butuh perhatian",
      value: merah,
      icon: AlertTriangle,
      color: "text-danger",
      bg: "bg-danger/5",
      border: "border-danger/20",
    },
    {
      label: "At risk",
      value: kuning,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/5",
      border: "border-warning/20",
    },
    {
      label: "On track",
      value: hijau,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/5",
      border: "border-success/20",
    },
    {
      label: "Bottleneck aktif",
      value: bottleneck,
      icon: ShieldAlert,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <StatChip key={s.label} {...s} />
        ))}
      </div>
      <p className="text-xs text-text-secondary pl-1">
        {selesai} pengiriman sudah selesai tahun ini
      </p>
    </div>
  );
}
