import React, { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Receipt, Paperclip, FolderOpen, X,
  ChevronDown, ChevronRight, UserPlus, StickyNote,
} from "lucide-react";
import type { Project, ExpenseItem, Contractor, StoredFile } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { useConfirm, ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { Avatar } from "../ui/Avatar";
import { money, moneyCents, formatDate, cn } from "../../lib/utils";

const CATEGORIES = ["Demolition", "Plumbing", "Electrical", "HVAC", "Roofing", "Flooring", "Painting", "Kitchen", "Bathroom", "Exterior", "Framing", "General", "Materials", "Permits", "Labor"];

export function ExpensesTab({ project }: { project: Project }) {
  const { db, getProjectExpenses, addExpense, updateExpense, deleteExpense } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const expenses = getProjectExpenses(project.id);
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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
        <EmptyState icon={Receipt} title="No expenses logged" message="Track material and labor costs here. Click an expense to assign who got paid and add notes for context." />
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseBar
              key={e.id}
              expense={e}
              contractors={db.contractors}
              open={openId === e.id}
              onToggle={() => setOpenId((id) => (id === e.id ? null : e.id))}
              onEdit={() => setEditing(e)}
              onDelete={() =>
                confirm({ title: "Delete expense?", message: e.description, danger: true, confirmLabel: "Delete", onConfirm: () => { deleteExpense(e.id); toast.success("Expense deleted"); } })
              }
              onPatch={(patch) => updateExpense(e.id, patch)}
            />
          ))}
        </div>
      )}

      <ExpenseModal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        projectId={project.id}
        contractors={db.contractors}
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

// ------------------------------------------------------------
// Expandable expense bar
// ------------------------------------------------------------
function ExpenseBar({
  expense, contractors, open, onToggle, onEdit, onDelete, onPatch,
}: {
  expense: ExpenseItem;
  contractors: Contractor[];
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<ExpenseItem>) => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [notes, setNotes] = useState(expense.notes ?? "");
  useEffect(() => setNotes(expense.notes ?? ""), [expense.notes]);

  const payee = contractors.find((c) => c.id === expense.payeeContractorId);

  const commitNotes = () => {
    if ((expense.notes ?? "") !== notes) onPatch({ notes: notes.trim() || undefined });
  };

  const attachReceipt = async () => {
    const arr = await store.files.pickAndImport(expense.projectId, "all");
    if (arr[0]) { onPatch({ receipt: arr[0] }); toast.success("Receipt attached"); }
  };

  return (
    <div className={cn("card overflow-hidden transition-shadow", open && "shadow-md")}>
      {/* Bar header */}
      <div className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-slate-50" onClick={onToggle}>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-800 truncate">{expense.description}</p>
          <p className="text-xs text-slate-400">
            {formatDate(expense.purchasedDate)}
            {expense.notes ? " · noted" : ""}
            {expense.receipt ? " · receipt" : ""}
          </p>
        </div>
        <span className="badge bg-slate-100 text-slate-600 hidden sm:inline-flex">{expense.category}</span>
        <span className="text-sm text-slate-500 hidden md:block w-28 truncate text-right">{expense.vendor || "—"}</span>
        {payee && <Avatar name={payee.name} size={24} title={`Paid to ${payee.name}`} />}
        <span className="text-sm font-semibold text-slate-900 w-24 text-right">{money(expense.total)}</span>
        <button onClick={(ev) => { ev.stopPropagation(); onEdit(); }} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-4 h-4" /></button>
        <button onClick={(ev) => { ev.stopPropagation(); onDelete(); }} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>

      {/* Drop-down detail */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Paid to
              </span>
              <div className="flex items-center gap-2">
                {payee && <Avatar name={payee.name} size={32} />}
                <select
                  className="input py-1.5 text-sm flex-1"
                  value={expense.payeeContractorId ?? ""}
                  onChange={(e) => onPatch({ payeeContractorId: e.target.value || undefined })}
                >
                  <option value="">Unassigned — assign payee</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 text-xs text-slate-500 grid grid-cols-2 gap-y-1">
                <span>Quantity × Unit</span><span className="text-right text-slate-700">{expense.quantity} × {moneyCents(expense.unitPrice)}</span>
                <span>Vendor</span><span className="text-right text-slate-700">{expense.vendor || "—"}</span>
                <span>Category</span><span className="text-right text-slate-700">{expense.category}</span>
              </div>
              <div className="mt-3">
                {expense.receipt ? (
                  <span className="flex items-center gap-2 text-sm text-slate-700 bg-white ring-1 ring-slate-200 rounded-lg px-2 py-1.5">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{expense.receipt.name}</span>
                    {store.isDesktop && <button onClick={() => store.files.reveal(expense.receipt!.relPath)} className="text-slate-400 hover:text-slate-700"><FolderOpen className="w-4 h-4" /></button>}
                    <button onClick={() => onPatch({ receipt: undefined })} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </span>
                ) : (
                  <button className="btn btn-outline text-xs" onClick={attachReceipt} disabled={!store.isDesktop} title={store.isDesktop ? "" : "Available in the desktop app"}>
                    <Paperclip className="w-4 h-4" /> Attach receipt
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Notes — context for this expense
              </span>
              <textarea
                className="input resize-none text-sm"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={commitNotes}
                placeholder="What happened, where we went over, anything to remember next flip…"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Add / edit modal
// ------------------------------------------------------------
interface ExpenseDraft {
  description: string; category: string; vendor: string;
  unitPrice: number; quantity: number; purchasedDate: string;
  receipt?: StoredFile; payeeContractorId?: string; notes?: string;
}

function emptyDraft(): ExpenseDraft {
  return { description: "", category: "General", vendor: "", unitPrice: 0, quantity: 1, purchasedDate: new Date().toISOString().slice(0, 10) };
}

function ExpenseModal({
  open, onClose, projectId, contractors, expense, onSave,
}: {
  open: boolean; onClose: () => void; projectId: string; contractors: Contractor[]; expense: ExpenseItem | null;
  onSave: (data: ExpenseDraft & { total: number }) => void;
}) {
  const store = useStore();
  const toast = useToast();
  const [d, setD] = useState<ExpenseDraft>(emptyDraft());

  useEffect(() => {
    if (!open) return;
    if (expense) setD({ description: expense.description, category: expense.category, vendor: expense.vendor, unitPrice: expense.unitPrice, quantity: expense.quantity, purchasedDate: expense.purchasedDate, receipt: expense.receipt, payeeContractorId: expense.payeeContractorId, notes: expense.notes });
    else setD(emptyDraft());
  }, [open, expense]);

  const total = (Number(d.unitPrice) || 0) * (Number(d.quantity) || 0);

  const attachReceipt = async () => {
    const arr = await store.files.pickAndImport(projectId, "all");
    if (arr[0]) { setD((p) => ({ ...p, receipt: arr[0] })); toast.success("Receipt attached"); }
  };

  return (
    <Modal
      open={open} onClose={onClose} size="lg"
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
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Paid to (payee)</span>
          <select className="input mt-1" value={d.payeeContractorId ?? ""} onChange={(e) => setD({ ...d, payeeContractorId: e.target.value || undefined })}>
            <option value="">Unassigned</option>
            {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Notes</span>
          <textarea className="input mt-1 resize-none" rows={2} value={d.notes ?? ""} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Context — what happened, where we went over…" />
        </label>
        <div className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Receipt</span>
          <div className="mt-1">
            {d.receipt ? (
              <span className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 rounded-lg px-2 py-1.5">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{d.receipt.name}</span>
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
