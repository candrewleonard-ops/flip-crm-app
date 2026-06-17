import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CheckOption {
  id: string;
  label: string;
  sublabel?: string;
  leading?: React.ReactNode;
}

export function CheckboxList({
  options,
  selected,
  onToggle,
  searchable = true,
  placeholder = "Search…",
  maxHeight = "max-h-64",
  emptyText = "Nothing to show",
}: {
  options: CheckOption[];
  selected: string[];
  onToggle: (id: string) => void;
  searchable?: boolean;
  placeholder?: string;
  maxHeight?: string;
  emptyText?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || (o.sublabel ?? "").toLowerCase().includes(t)
    );
  }, [q, options]);

  return (
    <div className="card overflow-hidden">
      {searchable && (
        <div className="relative border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2.5 text-sm outline-none bg-transparent"
          />
        </div>
      )}
      <div className={cn("overflow-y-auto", maxHeight)}>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 px-3 py-6 text-center">{emptyText}</p>
        )}
        {filtered.map((o) => {
          const checked = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors",
                checked && "bg-blue-50/60"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                )}
              >
                {checked && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              {o.leading}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800 truncate">{o.label}</span>
                {o.sublabel && <span className="block text-xs text-slate-500 truncate">{o.sublabel}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
