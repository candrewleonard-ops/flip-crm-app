import React from "react";
import { cn } from "../../lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-slate-500",
  sub,
  pulse = false,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  accent?: string;
  sub?: React.ReactNode;
  pulse?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("stat-card flex items-start gap-3", onClick && "cursor-pointer", pulse && "heat-pulse")}
      onClick={onClick}
    >
      {Icon && (
        <div className={cn("rounded-xl p-2.5 bg-slate-50 ring-1 ring-slate-100", accent)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
