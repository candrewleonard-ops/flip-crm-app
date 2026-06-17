import React, { useEffect, useState } from "react";
import { Star, Plus, X } from "lucide-react";
import type { Contractor } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { cn } from "../../lib/utils";

const TRADES = ["Kitchen", "Bathroom", "Plumbing", "Electrical", "HVAC", "Roofing", "Flooring", "Painting", "Framing", "Foundation", "Demolition", "Exterior", "Drywall", "General", "Landscaping"];

interface Draft {
  name: string; company: string; email: string; phone: string;
  city: string; state: string; zip: string;
  specialty: string[]; rating: number; totalJobsCompleted: number; notes: string;
}

function draftFrom(c?: Contractor): Draft {
  return {
    name: c?.name ?? "", company: c?.company ?? "", email: c?.email ?? "", phone: c?.phone ?? "",
    city: c?.city ?? "", state: c?.state ?? "", zip: c?.zip ?? "",
    specialty: c?.specialty ?? [], rating: c?.rating ?? 4.5, totalJobsCompleted: c?.totalJobsCompleted ?? 0, notes: c?.notes ?? "",
  };
}

export function ContractorModal({
  open, onClose, contractor, onSaved,
}: {
  open: boolean; onClose: () => void; contractor?: Contractor; onSaved?: (id: string) => void;
}) {
  const { addContractor, updateContractor } = useStore();
  const toast = useToast();
  const [d, setD] = useState<Draft>(draftFrom(contractor));

  useEffect(() => { if (open) setD(draftFrom(contractor)); }, [open, contractor]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggleTrade = (t: string) => set("specialty", d.specialty.includes(t) ? d.specialty.filter((x) => x !== t) : [...d.specialty, t]);

  const save = () => {
    if (!d.name.trim()) return;
    const payload = { ...d, name: d.name.trim(), rating: Number(d.rating) || 0, totalJobsCompleted: Number(d.totalJobsCompleted) || 0 };
    if (contractor) { updateContractor(contractor.id, payload); toast.success("Contractor updated"); onSaved?.(contractor.id); }
    else { const c = addContractor(payload); toast.success("Contractor added"); onSaved?.(c.id); }
    onClose();
  };

  const customTrades = d.specialty.filter((s) => !TRADES.includes(s));

  return (
    <Modal
      open={open} onClose={onClose} size="lg"
      title={contractor ? "Edit Contractor" : "Add Contractor"}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!d.name.trim()} onClick={save}>{contractor ? "Save" : "Add"}</button></>}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block"><span className="text-xs font-medium text-slate-600">Name</span><input className="input mt-1" value={d.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="block"><span className="text-xs font-medium text-slate-600">Company</span><input className="input mt-1" value={d.company} onChange={(e) => set("company", e.target.value)} /></label>
        <label className="block"><span className="text-xs font-medium text-slate-600">Email</span><input className="input mt-1" value={d.email} onChange={(e) => set("email", e.target.value)} /></label>
        <label className="block"><span className="text-xs font-medium text-slate-600">Phone</span><input className="input mt-1" value={d.phone} onChange={(e) => set("phone", e.target.value)} /></label>
        <label className="block"><span className="text-xs font-medium text-slate-600">City</span><input className="input mt-1" value={d.city} onChange={(e) => set("city", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-medium text-slate-600">State</span><input className="input mt-1" value={d.state} maxLength={2} onChange={(e) => set("state", e.target.value)} /></label>
          <label className="block"><span className="text-xs font-medium text-slate-600">ZIP</span><input className="input mt-1" value={d.zip} onChange={(e) => set("zip", e.target.value)} /></label>
        </div>
        <label className="block"><span className="text-xs font-medium text-slate-600">Jobs completed</span><input type="number" className="input mt-1" value={d.totalJobsCompleted} onChange={(e) => set("totalJobsCompleted", Number(e.target.value))} /></label>
        <div className="block">
          <span className="text-xs font-medium text-slate-600">Rating</span>
          <div className="flex items-center gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => set("rating", n)} type="button">
                <Star className={cn("w-6 h-6", n <= Math.round(d.rating) ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
              </button>
            ))}
            <input type="number" step="0.1" min="0" max="5" className="input py-1 w-16 ml-2 text-sm" value={d.rating} onChange={(e) => set("rating", Number(e.target.value))} />
          </div>
        </div>
        <div className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Specialties / trades</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {TRADES.map((t) => (
              <button key={t} type="button" onClick={() => toggleTrade(t)} className={cn("badge cursor-pointer", d.specialty.includes(t) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{t}</button>
            ))}
            {customTrades.map((t) => (
              <span key={t} className="badge bg-blue-600 text-white">{t}<button onClick={() => toggleTrade(t)}><X className="w-3 h-3" /></button></span>
            ))}
            <button type="button" onClick={() => { const v = window.prompt("Add custom trade"); if (v?.trim()) toggleTrade(v.trim()); }} className="badge bg-white ring-1 ring-slate-200 text-slate-500"><Plus className="w-3 h-3" /> Custom</button>
          </div>
        </div>
        <label className="block sm:col-span-2"><span className="text-xs font-medium text-slate-600">Notes</span><textarea className="input mt-1 resize-none" rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      </div>
    </Modal>
  );
}
