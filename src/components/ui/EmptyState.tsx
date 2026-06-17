import React from "react";

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  message?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-fade-in">
      {Icon && (
        <div className="rounded-2xl bg-slate-100 p-4 mb-4 ring-1 ring-slate-200">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
