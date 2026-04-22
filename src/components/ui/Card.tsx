"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "tinted" | "gradient" | "dark";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  padded?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface text-text-primary",
  tinted: "bg-fammi-50 text-text-primary",
  gradient:
    "bg-gradient-to-br from-fammi-100 via-fammi-50 to-surface text-text-primary",
  dark: "bg-[#1E1B3A] text-white",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    variant = "default",
    hoverable = true,
    padded = true,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  const isInteractive = hoverable || typeof onClick === "function";

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "rounded-card shadow-fammi transition-all duration-300 ease-out",
        padded && "p-6",
        VARIANT_CLASSES[variant],
        isInteractive &&
          "hover:shadow-fammi-hover hover:scale-[1.01] active:scale-[0.99]",
        typeof onClick === "function" && "cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
