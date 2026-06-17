import React from "react";
import { cn } from "../../lib/utils";

/**
 * Budget/progress bar. Turns red and over-fills visually when `over` is true
 * (spent exceeds budget).
 */
export function ProgressBar({
  value,
  className,
  trackClassName,
  over = false,
  color,
  height = "h-2",
}: {
  value: number; // 0-100 (may exceed)
  className?: string;
  trackClassName?: string;
  over?: boolean;
  color?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = over ? "bg-red-500" : color ?? "bg-blue-600";
  return (
    <div className={cn("w-full rounded-full bg-slate-200 overflow-hidden", height, trackClassName, className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill, over && "heat-pulse")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
