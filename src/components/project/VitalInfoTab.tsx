import React, { useEffect, useState } from "react";
import { Save, KeyRound } from "lucide-react";
import type { Project, ProjectVital } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";

const UTILS: { key: keyof ProjectVital; acct: keyof ProjectVital; label: string }[] = [
  { key: "electricProvider", acct: "electricAccount", label: "Electric" },
  { key: "waterProvider", acct: "waterAccount", label: "Water" },
  { key: "gasProvider", acct: "gasAccount", label: "Gas" },
  { key: "sewerProvider", acct: "sewerAccount", label: "Sewer" },
  { key: "trashProvider", acct: "trashAccount", label: "Trash" },
];

export function VitalInfoTab({ project }: { project: Project }) {
  const { updateProject, setSquareFootage } = useStore();
  const toast = useToast();
  const [vital, setVital] = useState<ProjectVital>(project.vital ?? {});
  const [sqft, setSqft] = useState(String(project.squareFootage));

  useEffect(() => {
    setVital(project.vital ?? {});
    setSqft(String(project.squareFootage));
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitSqft = () => {
    const n = Number(sqft) || 0;
    if (n !== project.squareFootage) {
      setSquareFootage(project.id, n);
      toast.success("Square footage updated · flooring budgets recalculated");
    }
  };

  const setV = (k: keyof ProjectVital, v: string) => setVital((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    updateProject(project.id, { vital });
    toast.success("Vital information saved");
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" /> Access & Notes
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Key / Lockbox location</span>
            <input className="input mt-1" value={vital.keyLocation ?? ""} onChange={(e) => setV("keyLocation", e.target.value)} placeholder="e.g. Lockbox on front door, code 1234" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Notes</span>
            <input className="input mt-1" value={vital.notes ?? ""} onChange={(e) => setV("notes", e.target.value)} placeholder="Anything important on site" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Square Footage</span>
            <input
              type="number"
              className="input mt-1"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              onBlur={commitSqft}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="e.g. 1500"
            />
            <span className="text-[11px] text-slate-400">Drives flooring budgets at $4.50/sq ft</span>
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
  );
}
