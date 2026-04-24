"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BentoCardProps {
  href: string;
  icon: LucideIcon;
  iconColor: string;
  bg: string;
  border: string;
  heroValue: string;
  heroLabel: string;
  sub1: string;
  sub2?: string;
  badge?: { label: string; color: string };
  index?: number;
}

export function BentoCard({
  href,
  icon: Icon,
  iconColor,
  bg,
  border,
  heroValue,
  heroLabel,
  sub1,
  sub2,
  badge,
}: BentoCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className={cn(
        "w-full text-left rounded-[32px] p-6",
        "flex flex-col gap-4",
        bg, border, "border",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-fammi-hover",
        "cursor-pointer min-h-[160px]",
      )}
    >
      {/* Icon + badge */}
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-2xl", bg)}>
          <Icon size={22} className={iconColor} />
        </div>
        {badge && (
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            badge.color,
          )}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Hero number */}
      <div className="flex-1">
        <p className="font-mono text-3xl font-bold text-text-primary leading-none tabular-nums">
          {heroValue}
        </p>
        <p className="text-xs text-text-secondary mt-1">{heroLabel}</p>
      </div>

      {/* Sub stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-[11px] text-text-secondary">{sub1}</span>
        {sub2 && <span className="text-[11px] text-text-secondary">{sub2}</span>}
      </div>
    </button>
  );
}
