import React from "react";
import { Link } from "react-router-dom";
import { Star, Phone, Mail, X, HardHat } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import { Avatar } from "../ui/Avatar";
import { CheckboxList } from "../ui/CheckboxList";
import { EmptyState } from "../ui/EmptyState";

export function ContractorsTab({ project }: { project: Project }) {
  const { db, getProjectContractors, setProjectContractors } = useStore();
  const assigned = getProjectContractors(project.id);

  const toggle = (id: string) => {
    const next = project.contractorIds.includes(id)
      ? project.contractorIds.filter((x) => x !== id)
      : [...project.contractorIds, id];
    setProjectContractors(project.id, next);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Assigned crew ({assigned.length})</h3>
        {assigned.length === 0 ? (
          <EmptyState icon={HardHat} title="No contractors assigned" message="Pick from your directory on the right to build this project's crew." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {assigned.map((c) => (
              <div key={c.id} className="card p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/contractors/${c.id}`} className="font-semibold text-slate-900 hover:text-blue-600 truncate block">{c.name}</Link>
                    <p className="text-xs text-slate-500 truncate">{c.company}</p>
                  </div>
                  <button onClick={() => toggle(c.id)} className="text-slate-300 hover:text-red-500" title="Unassign">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.specialty.slice(0, 4).map((s) => (
                    <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {c.rating}</span>
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3.5 h-3.5" /> {c.email}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Assign from directory</h3>
        <CheckboxList
          options={db.contractors.map((c) => ({
            id: c.id,
            label: c.name,
            sublabel: `${c.company || "—"} · ${c.specialty.slice(0, 3).join(", ")}`,
            leading: <Avatar name={c.name} size={28} />,
          }))}
          selected={project.contractorIds}
          onToggle={toggle}
          maxHeight="max-h-[520px]"
          emptyText="No contractors yet."
        />
      </div>
    </div>
  );
}
