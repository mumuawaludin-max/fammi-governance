import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DeliveryStage, ISchoolDelivery } from "@/types";

const STAGES: { key: DeliveryStage; label: string }[] = [
  { key: "PERSIAPAN",  label: "Persiapan" },
  { key: "PENGISIAN",  label: "Pengisian" },
  { key: "PEMBUATAN",  label: "Pembuatan" },
  { key: "PENGIRIMAN", label: "Pengiriman" },
  { key: "DISTRIBUSI", label: "Distribusi" },
  { key: "SELESAI",    label: "Selesai" },
];

interface OpsPipelineProps {
  deliveries: ISchoolDelivery[];
  onStageClick?: (stage: DeliveryStage | null) => void;
  activeStage?: DeliveryStage | null;
}

export function OpsPipeline({ deliveries, onStageClick, activeStage }: OpsPipelineProps) {
  const countByStage = (stage: DeliveryStage) =>
    deliveries.filter((d) => d.deliveryStage === stage).length;

  return (
    <div className="rounded-[32px] bg-white border border-fammi-100 p-6">
      <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
        Pipeline Pengiriman
      </h2>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const count = countByStage(s.key);
          const isActive = activeStage === s.key;
          const isDone = s.key === "SELESAI";

          return (
            <div key={s.key} className="flex items-start shrink-0">
              {/* Stage node */}
              <button
                onClick={() => onStageClick?.(isActive ? null : s.key)}
                className={cn(
                  "flex flex-col items-center gap-2 px-3 py-2 rounded-2xl transition-all",
                  "min-w-[80px]",
                  isActive
                    ? isDone
                      ? "bg-success/10 text-success"
                      : "bg-fammi-100 text-fammi"
                    : "hover:bg-fammi-50 text-text-secondary",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-mono font-bold text-sm transition-all",
                    count === 0 && "opacity-40",
                    isActive
                      ? isDone
                        ? "bg-success text-white"
                        : "bg-fammi text-white shadow-fammi"
                      : isDone && count > 0
                        ? "bg-success/20 text-success"
                        : "bg-fammi-100 text-fammi",
                  )}
                >
                  {count}
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">
                  {s.label}
                </span>
              </button>

              {/* Arrow */}
              {i < STAGES.length - 1 && (
                <div className="flex items-center self-stretch pt-3">
                  <ChevronRight size={14} className="text-fammi-200 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
