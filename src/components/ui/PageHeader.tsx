import React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-2.5 shadow-sm">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
