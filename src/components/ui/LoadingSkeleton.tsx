import { cn } from "@/lib/cn";

export type SkeletonVariant = "card" | "stat" | "list-item" | "chart";

export interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-xl bg-fammi-100/70",
        className,
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-card bg-surface shadow-fammi p-6 space-y-4">
      <Bar className="h-3 w-24" />
      <Bar className="h-10 w-2/3" />
      <Bar className="h-3 w-full" />
      <Bar className="h-3 w-5/6" />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Bar className="h-3 w-20" />
      <Bar className="h-8 w-32" />
      <Bar className="h-2.5 w-16" />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
      <Bar className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bar className="h-3 w-1/2" />
        <Bar className="h-2.5 w-1/3" />
      </div>
      <Bar className="h-6 w-16 rounded-full" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-card bg-surface shadow-fammi p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Bar className="h-3 w-32" />
        <Bar className="h-6 w-20 rounded-full" />
      </div>
      <Bar className="h-48 w-full rounded-2xl" />
    </div>
  );
}

export function LoadingSkeleton({
  variant = "card",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  const renderOne = () => {
    switch (variant) {
      case "stat":
        return <StatSkeleton />;
      case "list-item":
        return <ListItemSkeleton />;
      case "chart":
        return <ChartSkeleton />;
      case "card":
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <div
      className={cn(
        "animate-fade-in",
        variant === "list-item" ? "space-y-2" : "space-y-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {items.map((_, i) => (
        <div key={i}>{renderOne()}</div>
      ))}
      <span className="sr-only">Memuat data…</span>
    </div>
  );
}
