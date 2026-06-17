import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Star, Phone, Mail, MapPin, Briefcase,
  Building2, MessageSquare, ReceiptText, HardHat, Send,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { CommType } from "../lib/types";
import { Avatar } from "../components/ui/Avatar";
import { MetaBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useConfirm, ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ContractorModal } from "../components/contractor/ContractorModal";
import { INVOICE_STATUS_META } from "../lib/labels";
import { money, timeAgo, fullAddress, cn } from "../lib/utils";

export function ContractorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const { getContractor, getContractorProjects, getContractorComms, getContractorInvoices, getProject, deleteContractor, addCommunication } = store;
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<CommType>("sms");

  const c = id ? getContractor(id) : undefined;
  if (!c) {
    return <div className="p-6"><EmptyState icon={HardHat} title="Contractor not found" action={<Link to="/contractors" className="btn btn-primary">Back</Link>} /></div>;
  }

  const projects = getContractorProjects(c.id);
  const comms = getContractorComms(c.id).slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const invoices = getContractorInvoices(c.id);

  const logComm = () => {
    if (!msg.trim()) return;
    addCommunication({ contractorId: c.id, type, direction: "outbound", content: msg.trim(), read: true, callStatus: type === "call" ? "completed" : undefined });
    setMsg("");
    toast.success("Logged");
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <Link to="/contractors" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"><ArrowLeft className="w-4 h-4" /> All Contractors</Link>

      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Avatar name={c.name} src={c.avatarUrl} size={64} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
              <p className="text-sm text-slate-500">{c.company}</p>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-600 flex-wrap">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {c.rating}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {c.totalJobsCompleted} jobs</span>
                {(c.city || c.state) && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {[c.city, c.state].filter(Boolean).join(", ")}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline text-sm" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /> Edit</button>
            <button className="btn btn-outline text-sm text-red-600" onClick={() => confirm({ title: "Delete contractor?", message: `${c.name} will be removed from all projects and tasks.`, danger: true, confirmLabel: "Delete", onConfirm: () => { deleteContractor(c.id); toast.success("Contractor deleted"); navigate("/contractors"); } })}><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {c.specialty.map((s) => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
          {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {c.phone}</span>}
          {c.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {c.email}</span>}
        </div>
        {c.notes && <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3">{c.notes}</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Projects */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Projects</h2>
          {projects.length === 0 ? <p className="text-sm text-slate-400">Not assigned to any projects.</p> : (
            <div className="space-y-2">
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="block rounded-lg ring-1 ring-slate-200 px-3 py-2 hover:bg-slate-50">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">{fullAddress(p.address)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><ReceiptText className="w-4 h-4 text-blue-600" /> Invoices</h2>
          {invoices.length === 0 ? <p className="text-sm text-slate-400">No invoices.</p> : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2 rounded-lg ring-1 ring-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{getProject(inv.projectId)?.name ?? "Project"}</p>
                    <MetaBadge meta={INVOICE_STATUS_META[inv.status]} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{money(inv.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Communications */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" /> Communications</h2>
          <div className="flex gap-1.5 mb-2">
            <select className="input py-1 text-xs w-auto" value={type} onChange={(e) => setType(e.target.value as CommType)}>
              {(["sms", "call", "email", "note"] as CommType[]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="input py-1 text-sm flex-1" placeholder="Log a message…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && logComm()} />
            <button className="btn btn-primary px-2 py-1" onClick={logComm} disabled={!msg.trim()}><Send className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {comms.length === 0 ? <p className="text-sm text-slate-400">No messages yet.</p> : comms.map((m) => (
              <div key={m.id} className={cn("rounded-lg px-3 py-2 text-sm", m.direction === "outbound" ? "bg-blue-50" : "bg-slate-50")}>
                <p className="text-slate-700">{m.content}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{m.type} · {m.direction} · {timeAgo(m.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ContractorModal open={editing} onClose={() => setEditing(false)} contractor={c} />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}
