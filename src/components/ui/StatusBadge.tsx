import type { ReactNode } from "react";
import type { StatusKey } from "@/types";
import { cn } from "@/lib/cn";

const STATUS_DOT: Record<StatusKey, string> = {
  merah: "bg-danger",
  kuning: "bg-warning",
  hijau: "bg-success",
  info: "bg-fammi-400",
  purple: "bg-fammi",
};

const STATUS_PILL: Record<StatusKey, string> = {
  merah: "bg-danger/10 text-danger ring-1 ring-danger/20",
  kuning: "bg-warning/10 text-warning-dark ring-1 ring-warning/30",
  hijau: "bg-success/10 text-success-dark ring-1 ring-success/30",
  info: "bg-fammi-100 text-fammi-700 ring-1 ring-fammi-200",
  purple: "bg-fammi/10 text-fammi-dark ring-1 ring-fammi/20",
};

export interface StatusDotProps {
  status: StatusKey;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DOT_SIZE = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
} as const;

export function StatusDot({
  status,
  pulse = false,
  size = "md",
  className,
}: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block rounded-full",
        DOT_SIZE[size],
        STATUS_DOT[status],
        pulse && "animate-pulse",
        className,
      )}
    />
  );
}

export interface StatusBadgeProps {
  status: StatusKey;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_PILL[status],
        className,
      )}
    >
      {icon ?? <StatusDot status={status} size="sm" />}
      <span className="tracking-wide uppercase">{label}</span>
    </span>
  );
}
