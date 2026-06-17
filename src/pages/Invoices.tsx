import React, { useMemo, useState } from "react";
import { ReceiptText, Plus, Search, FolderOpen, FileText } from "lucide-react";
import { useStore } from "../lib/store";
import type { Invoice, InvoiceStatus } from "../lib/types";
import { PageHeader } from "../components/ui/PageHeader";
import { MetaBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Avatar } from "../components/ui/Avatar";
import { InvoiceBuilder } from "../components/invoice/InvoiceBuilder";
import { INVOICE_STATUS_META } from "../lib/labels";
import { money, formatDate, cn } from "../lib/utils";

export function Invoices() {
  const { db, getProject, getContractor } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [building, setBuilding] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (q) {
        const hay = `${getProject(inv.projectId)?.name ?? ""} ${getContractor(inv.contractorId)?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [db.invoices, statusFilter, search, getProject, getContractor]);

  const totals = useMemo(() => {
    const paid = db.invoices.reduce((s, i) => s + (i.depositPaid ? i.depositAmount : 0) + (i.midpointPaid ? i.midpointAmount : 0) + (i.completionPaid ? i.completionAmount : 0), 0);
    const billed = db.invoices.reduce((s, i) => s + i.subtotal, 0);
    return { paid, billed, outstanding: billed - paid };
  }, [db.invoices]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        icon={ReceiptText}
        title="Invoices"
        subtitle={`${money(totals.billed)} billed · ${money(totals.paid)} paid · ${money(totals.outstanding)} outstanding`}
        actions={<button className="btn btn-primary text-sm" onClick={() => { setEditing(null); setBuilding(true); }}><Plus className="w-4 h-4" /> New Invoice</button>}
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-9" placeholder="Search by project or contractor…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}>
          <option value="all">All statuses</option>
          {(Object.keys(INVOICE_STATUS_META) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{INVOICE_STATUS_META[s].label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No invoices" message="Build a milestone invoice from the service catalog (25% deposit / 25% midpoint / 50% completion)." action={<button className="btn btn-primary" onClick={() => setBuilding(true)}><Plus className="w-4 h-4" /> New Invoice</button>} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((inv) => {
            const contractor = getContractor(inv.contractorId);
            const project = getProject(inv.projectId);
            const milestones = [
              { label: "Deposit", amount: inv.depositAmount, paid: inv.depositPaid },
              { label: "Midpoint", amount: inv.midpointAmount, paid: inv.midpointPaid },
              { label: "Completion", amount: inv.completionAmount, paid: inv.completionPaid },
            ];
            return (
              <button key={inv.id} onClick={() => { setEditing(inv); setBuilding(true); }} className="card p-4 text-left hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={contractor?.name ?? "?"} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><h3 className="font-semibold text-slate-900 truncate">{contractor?.name ?? "Contractor"}</h3><MetaBadge meta={INVOICE_STATUS_META[inv.status]} /></div>
                      <p className="text-xs text-slate-500 truncate">{project?.name ?? "Project"} · {formatDate(inv.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900">{money(inv.subtotal)}</p>
                    {inv.pdf && <span className="text-xs text-blue-600 flex items-center gap-1 justify-end"><FileText className="w-3 h-3" /> PDF</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {milestones.map((m) => (
                    <div key={m.label} className={cn("rounded-lg px-2 py-1.5 text-center ring-1", m.paid ? "bg-emerald-50 ring-emerald-200" : "bg-slate-50 ring-slate-200")}>
                      <p className="text-[10px] text-slate-500">{m.label}</p>
                      <p className="text-xs font-semibold text-slate-900">{money(m.amount)}</p>
                      <p className={cn("text-[9px] font-medium", m.paid ? "text-emerald-600" : "text-slate-400")}>{m.paid ? "PAID" : "Due"}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InvoiceBuilder open={building} onClose={() => { setBuilding(false); setEditing(null); }} invoice={editing ?? undefined} />
    </div>
  );
}
