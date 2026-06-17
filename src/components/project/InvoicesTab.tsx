import React from "react";
import { useNavigate } from "react-router-dom";
import { ReceiptText, FolderOpen, ArrowRight } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import { INVOICE_STATUS_META } from "../../lib/labels";
import { MetaBadge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { money, formatDate, cn } from "../../lib/utils";

export function InvoicesTab({ project }: { project: Project }) {
  const { getProjectInvoices, getContractor } = useStore();
  const navigate = useNavigate();
  const invoices = getProjectInvoices(project.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"} for this project</p>
        <button className="btn btn-primary text-sm" onClick={() => navigate("/invoices")}>
          Open invoice builder <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No invoices yet" message="Build milestone invoices (25/25/50) from the service catalog on the Invoices page." />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const contractor = getContractor(inv.contractorId);
            const milestones = [
              { label: "Deposit", amount: inv.depositAmount, paid: inv.depositPaid },
              { label: "Midpoint", amount: inv.midpointAmount, paid: inv.midpointPaid },
              { label: "Completion", amount: inv.completionAmount, paid: inv.completionPaid },
            ];
            return (
              <div key={inv.id} className="card p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{contractor?.name ?? "Contractor"}</h4>
                      <MetaBadge meta={INVOICE_STATUS_META[inv.status]} />
                    </div>
                    <p className="text-xs text-slate-500">{inv.lineItems.length} line items · created {formatDate(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{money(inv.subtotal)}</p>
                    {inv.pdf && (
                      <button onClick={() => window.api?.files.reveal(inv.pdf!.relPath)} className="text-xs text-blue-600 hover:underline flex items-center gap-1 justify-end">
                        <FolderOpen className="w-3 h-3" /> Open PDF
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {milestones.map((m) => (
                    <div key={m.label} className={cn("rounded-lg px-2.5 py-2 text-center ring-1", m.paid ? "bg-emerald-50 ring-emerald-200" : "bg-slate-50 ring-slate-200")}>
                      <p className="text-[11px] text-slate-500">{m.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{money(m.amount)}</p>
                      <p className={cn("text-[10px] font-medium", m.paid ? "text-emerald-600" : "text-slate-400")}>{m.paid ? "Paid" : "Unpaid"}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
