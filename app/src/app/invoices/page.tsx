"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText, Plus, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, statusColor, cn } from "@/lib/utils";

export default function InvoicesPage() {
  const store = useStore();

  const stats = useMemo(() => {
    const total = store.invoices.reduce((s, i) => s + i.subtotal, 0);
    const paid = store.invoices.filter((i) => i.status === "paid");
    const paidTotal = paid.reduce((s, i) => s + i.subtotal, 0);
    const pending = store.invoices.filter((i) => i.status === "sent" || i.status === "approved");
    const pendingTotal = pending.reduce((s, i) => s + i.subtotal, 0);
    return { total, paidTotal, pendingTotal, paidCount: paid.length, pendingCount: pending.length };
  }, [store.invoices]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">{store.invoices.length} invoice{store.invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/invoices/create" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
          <Plus size={16} /> Write Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <DollarSign size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.total)}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Paid ({stats.paidCount})</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.paidTotal)}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pending ({stats.pendingCount})</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(stats.pendingTotal)}</p>
          </div>
        </div>
      </div>

      {store.invoices.length === 0 ? (
        <div className="stat-card flex flex-col items-center py-16">
          <FileText size={48} className="text-slate-200 mb-4" />
          <p className="text-lg font-semibold text-slate-700 mb-1">No Invoices Yet</p>
          <p className="text-sm text-slate-400 mb-5">Create your first invoice to start tracking payments</p>
          <Link href="/invoices/create" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            <Plus size={16} /> Write Invoice
          </Link>
        </div>
      ) : (
        <div className="stat-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Contractor</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Project</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Total</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">Deposit</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">Midpoint</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">Final</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {store.invoices.map((inv) => {
                const contractor = store.getContractor(inv.contractorId);
                const project = store.getProject(inv.projectId);
                return (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">#{inv.id}</td>
                    <td className="py-3 px-4">
                      <Link href={`/contractors/${inv.contractorId}`} className="text-blue-600 hover:text-blue-700">{contractor?.name}</Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/projects/${inv.projectId}`} className="text-blue-600 hover:text-blue-700">{project?.name}</Link>
                    </td>
                    <td className="py-3 px-4"><span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-medium", inv.depositPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                        {inv.depositPaid ? "✓" : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-medium", inv.midpointPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                        {inv.midpointPaid ? "✓" : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-medium", inv.completionPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                        {inv.completionPaid ? "✓" : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(inv.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
