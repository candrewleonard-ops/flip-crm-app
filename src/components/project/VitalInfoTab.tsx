import React, { useEffect, useState } from "react";
import { Save, KeyRound } from "lucide-react";
import type { Project, ProjectVital } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { money, formatDate, fullAddress } from "../../lib/utils";

const UTILS: { key: keyof ProjectVital; acct: keyof ProjectVital; label: string }[] = [
  { key: "electricProvider", acct: "electricAccount", label: "Electric" },
  { key: "waterProvider", acct: "waterAccount", label: "Water" },
  { key: "gasProvider", acct: "gasAccount", label: "Gas" },
  { key: "sewerProvider", acct: "sewerAccount", label: "Sewer" },
  { key: "trashProvider", acct: "trashAccount", label: "Trash" },
];

export function VitalInfoTab({ project }: { project: Project }) {
  const { updateProject } = useStore();
  const toast = useToast();
  const [scope, setScope] = useState(project.scopeOfWork);
  const [vital, setVital] = useState<ProjectVital>(project.vital ?? {});

  useEffect(() => {
    setScope(project.scopeOfWork);
    setVital(project.vital ?? {});
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setV = (k: keyof ProjectVital, v: string) => setVital((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    updateProject(project.id, { scopeOfWork: scope, vital });
    toast.success("Vital information saved");
  };

  const facts: [string, React.ReactNode][] = [
    ["Address", fullAddress(project.address)],
    ["Purchase Price", money(project.purchasePrice)],
    ["Estimated ARV", money(project.estimatedARV)],
    ["Total Budget", money(project.totalBudget)],
    ["Total Spent", money(project.totalSpent)],
    ["Start Date", formatDate(project.startDate)],
    ["Est. Completion", formatDate(project.estimatedEndDate)],
  ];

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-5">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Scope of Work</h3>
          <textarea className="input resize-none" rows={5} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Describe the full scope…" />
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" /> Access & Notes
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Key / Lockbox location</span>
              <input className="input mt-1" value={vital.keyLocation ?? ""} onChange={(e) => setV("keyLocation", e.target.value)} placeholder="e.g. Lockbox on front door, code 1234" />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-medium text-slate-600">Notes</span>
              <input className="input mt-1" value={vital.notes ?? ""} onChange={(e) => setV("notes", e.target.value)} placeholder="Anything important on site" />
            </label>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Utilities — Providers & Accounts</h3>
          <div className="space-y-2.5">
            {UTILS.map((u) => (
              <div key={u.label} className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                <span className="text-sm font-medium text-slate-600">{u.label}</span>
                <input className="input py-1.5 text-sm" value={(vital[u.key] as string) ?? ""} onChange={(e) => setV(u.key, e.target.value)} placeholder="Provider" />
                <input className="input py-1.5 text-sm" value={(vital[u.acct] as string) ?? ""} onChange={(e) => setV(u.acct, e.target.value)} placeholder="Account #" />
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={save}>
          <Save className="w-4 h-4" /> Save vital information
        </button>
      </div>

      <div className="card p-4 h-fit">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Property Facts</h3>
        <dl className="space-y-2.5">
          {facts.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-slate-900 font-medium text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
