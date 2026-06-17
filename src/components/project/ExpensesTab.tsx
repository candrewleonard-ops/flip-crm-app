import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Receipt, Paperclip, FolderOpen, X } from "lucide-react";
import type { Project, ExpenseItem, StoredFile } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { useConfirm, ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { money, moneyCents, formatDate } from "../../lib/utils";

const CATEGORIES = ["Demolition", "Plumbing", "Electrical", "HVAC", "Roofing", "Flooring", "Painting", "Kitchen", "Bathroom", "Exterior", "Framing", "General", "Materials", "Permits", "Labor"];

export function ExpensesTab({ project }: { project: Project }) {
  const { getProjectExpenses, addExpense, updateExpense, deleteExpense } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const expenses = getProjectExpenses(project.id);
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [creating, setCreating] = useState(false);

  const total = expenses.reduce((s, e) => s + e.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">{expenses.length} expense{expenses.length === 1 ? "" : "s"}</p>
          <p className="text-xl font-bold text-slate-900">{money(total)} total</p>
        </div>
        <button className="btn btn-primary text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses logged" message="Track material and labor costs here, attach receipts, and keep budgets honest." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Vendor</th>
                <th className="text-right px-4 py-2.5 font-medium">Qty × Unit</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{e.description}</p>
                    <p className="text-xs text-slate-400">{formatDate(e.purchasedDate)}{e.receipt ? " · receipt attached" : ""}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{e.category}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.vendor || "—"}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{e.quantity} × {moneyCents(e.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{money(e.total)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(e)} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-4 h-4" /></button>
                    <button
                      onClick={() => confirm({ title: "Delete expense?", message: e.description, danger: true, confirmLabel: "Delete", onConfirm: () => { deleteExpense(e.id); toast.success("Expense deleted"); } })}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseModal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        projectId={project.id}
        expense={editing}
        onSave={(data) => {
          if (editing) { updateExpense(editing.id, data); toast.success("Expense updated"); }
          else { addExpense({ projectId: project.id, ...data }); toast.success("Expense added"); }
          setCreating(false); setEditing(null);
        }}
      />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}

interface ExpenseDraft {
  description: string; category: string; vendor: string;
  unitPrice: number; quantity: number; purchasedDate: string; receipt?: StoredFile;
}

function ExpenseModal({
  open, onClose, projectId, expense, onSave,
}: {
  open: boolean; onClose: () => void; projectId: string; expense: ExpenseItem | null;
  onSave: (data: ExpenseDraft & { total: number }) => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [d, setD] = useState<ExpenseDraft>({ description: "", category: "General", vendor: "", unitPrice: 0, quantity: 1, purchasedDate: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (!open) return;
    if (expense) setD({ description: expense.description, category: expense.category, vendor: expense.vendor, unitPrice: expense.unitPrice, quantity: expense.quantity, purchasedDate: expense.purchasedDate, receipt: expense.receipt });
    else setD({ description: "", category: "General", vendor: "", unitPrice: 0, quantity: 1, purchasedDate: new Date().toISOString().slice(0, 10) });
  }, [open, expense]);

  const total = (Number(d.unitPrice) || 0) * (Number(d.quantity) || 0);

  const attachReceipt = async () => {
    const arr = await store.files.pickAndImport(projectId, "all");
    if (arr[0]) { setD((p) => ({ ...p, receipt: arr[0] })); toast.success("Receipt attached"); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={expense ? "Edit Expense" : "Add Expense"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!d.description.trim()} onClick={() => onSave({ ...d, total })}>
            {expense ? "Save" : "Add"} · {money(total)}
          </button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Description</span>
          <input className="input mt-1" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="e.g. Kitchen cabinets" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Category</span>
          <select className="input mt-1" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
            {[...new Set([d.category, ...CATEGORIES])].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Vendor</span>
          <input className="input mt-1" value={d.vendor} onChange={(e) => setD({ ...d, vendor: e.target.value })} placeholder="e.g. Home Depot" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Unit price</span>
          <input type="number" step="0.01" className="input mt-1" value={d.unitPrice} onChange={(e) => setD({ ...d, unitPrice: Number(e.target.value) })} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Quantity</span>
          <input type="number" step="0.01" className="input mt-1" value={d.quantity} onChange={(e) => setD({ ...d, quantity: Number(e.target.value) })} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Purchased date</span>
          <input type="date" className="input mt-1" value={d.purchasedDate} onChange={(e) => setD({ ...d, purchasedDate: e.target.value })} />
        </label>
        <div className="block">
          <span className="text-xs font-medium text-slate-600">Receipt</span>
          <div className="mt-1 flex items-center gap-2">
            {d.receipt ? (
              <span className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 rounded-lg px-2 py-1.5 flex-1 min-w-0">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{d.receipt.name}</span>
                {store.isDesktop && <button onClick={() => store.files.reveal(d.receipt!.relPath)} className="text-slate-400 hover:text-slate-700"><FolderOpen className="w-4 h-4" /></button>}
                <button onClick={() => setD((p) => ({ ...p, receipt: undefined }))} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </span>
            ) : (
              <button className="btn btn-outline text-sm w-full" onClick={attachReceipt} disabled={!store.isDesktop} title={store.isDesktop ? "" : "Available in the desktop app"}>
                <Paperclip className="w-4 h-4" /> Attach receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
