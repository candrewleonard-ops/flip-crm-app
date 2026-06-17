import React from "react";
import { X } from "lucide-react";
import type { Contractor } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { CheckboxList } from "../ui/CheckboxList";

/**
 * Multi-contractor selector: removable avatar chips above a searchable
 * checkbox list (trade + name). Used for task assignment and project crews.
 */
export function ContractorMultiSelect({
  contractors,
  selected,
  onToggle,
  emptyText = "No contractors yet — add them on the Contractors page.",
}: {
  contractors: Contractor[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyText?: string;
}) {
  const chosen = contractors.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-2">
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chosen.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 ring-1 ring-blue-200 rounded-full pl-1 pr-2 py-0.5 text-xs font-medium"
            >
              <Avatar name={c.name} size={20} />
              {c.name}
              <button onClick={() => onToggle(c.id)} className="text-blue-400 hover:text-blue-700" aria-label={`Remove ${c.name}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <CheckboxList
        options={contractors.map((c) => ({
          id: c.id,
          label: c.name,
          sublabel: `${c.company || "—"} · ${c.specialty.slice(0, 3).join(", ")}`,
          leading: <Avatar name={c.name} size={28} />,
        }))}
        selected={selected}
        onToggle={onToggle}
        emptyText={emptyText}
        placeholder="Search contractors by name or trade…"
      />
    </div>
  );
}
