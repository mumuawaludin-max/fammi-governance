"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  duration?: number;
}

export function ProgressRing({
  percentage,
  size = 160,
  strokeWidth = 14,
  color = "#6323DA",
  trackColor = "#EDE5FF",
  label,
  sublabel,
  className,
  duration = 1400,
}: ProgressRingProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(safePercentage * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runAnimation();
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [safePercentage, duration]);

  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-text-primary">
          {Math.round(progress)}%
        </span>
        {label ? (
          <span className="text-xs font-medium text-text-secondary mt-1">
            {label}
          </span>
        ) : null}
        {sublabel ? (
          <span className="text-[10px] text-text-secondary/70">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
