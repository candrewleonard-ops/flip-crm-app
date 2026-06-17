import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, FileDown, X } from "lucide-react";
import type { Invoice, InvoiceLineItem, InvoiceStatus } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { SERVICE_CATALOG, INVOICE_TERMS, milestoneSplit } from "../../lib/catalogs";
import { INVOICE_STATUS_META } from "../../lib/labels";
import { renderInvoiceHtml } from "../../lib/invoiceHtml";
import { money, moneyCents, cn } from "../../lib/utils";

let liId = 0;
const newId = () => `li_${Date.now().toString(36)}_${liId++}`;

export function InvoiceBuilder({
  open, onClose, invoice, defaultProjectId, onSaved,
}: {
  open: boolean; onClose: () => void; invoice?: Invoice; defaultProjectId?: string; onSaved?: (id: string) => void;
}) {
  const store = useStore();
  const { db, addInvoice, updateInvoice } = store;
  const toast = useToast();

  const [projectId, setProjectId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [paid, setPaid] = useState({ deposit: false, midpoint: false, completion: false });
  const [terms, setTerms] = useState(INVOICE_TERMS);
  const [catId, setCatId] = useState(SERVICE_CATALOG[0].id);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setProjectId(invoice.projectId);
      setContractorId(invoice.contractorId);
      setStatus(invoice.status);
      setItems(invoice.lineItems);
      setPaid({ deposit: invoice.depositPaid, midpoint: invoice.midpointPaid, completion: invoice.completionPaid });
      setTerms(invoice.terms || INVOICE_TERMS);
      setSavedId(invoice.id);
    } else {
      setProjectId(defaultProjectId ?? db.projects[0]?.id ?? "");
      setContractorId(db.contractors[0]?.id ?? "");
      setStatus("draft");
      setItems([]);
      setPaid({ deposit: false, midpoint: false, completion: false });
      setTerms(INVOICE_TERMS);
      setSavedId(null);
    }
  }, [open, invoice, defaultProjectId, db.projects, db.contractors]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const ms = milestoneSplit(subtotal);
  const category = SERVICE_CATALOG.find((c) => c.id === catId)!;

  const addFromCatalog = (serviceId: string) => {
    const svc = category.services.find((s) => s.id === serviceId);
    if (!svc) return;
    setItems((prev) => [...prev, { id: newId(), description: svc.name, category: category.name, subcategory: svc.id, unitPrice: svc.defaultPrice, quantity: 1, total: svc.defaultPrice }]);
  };
  const addCustom = () => setItems((prev) => [...prev, { id: newId(), description: "", category: "Custom", subcategory: "", unitPrice: 0, quantity: 1, total: 0 }]);
  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) =>
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const next = { ...i, ...patch };
      next.total = (Number(next.unitPrice) || 0) * (Number(next.quantity) || 0);
      return next;
    }));
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const buildPayload = () => ({
    projectId, contractorId, status, lineItems: items, subtotal,
    depositAmount: ms.depositAmount, midpointAmount: ms.midpointAmount, completionAmount: ms.completionAmount,
    depositPaid: paid.deposit, midpointPaid: paid.midpoint, completionPaid: paid.completion, terms,
  });

  const persist = (): string => {
    const payload = buildPayload();
    if (savedId) { updateInvoice(savedId, payload); return savedId; }
    const created = addInvoice({ ...payload });
    setSavedId(created.id);
    return created.id;
  };

  const save = () => {
    if (!projectId || !contractorId) return toast.error("Pick a project and contractor");
    const idv = persist();
    toast.success(invoice ? "Invoice saved" : "Invoice created");
    onSaved?.(idv);
    onClose();
  };

  const exportPdf = async () => {
    if (!projectId || !contractorId) return toast.error("Pick a project and contractor");
    const idv = persist();
    const project = db.projects.find((p) => p.id === projectId);
    const contractor = db.contractors.find((c) => c.id === contractorId);
    const invObj: Invoice = { id: idv, createdAt: invoice?.createdAt ?? new Date().toISOString(), pdf: undefined, ...buildPayload() };
    const html = renderInvoiceHtml(invObj, project, contractor, db.settings.companyName);
    const fileName = `Invoice-${contractor?.name?.replace(/\s+/g, "-") ?? "contractor"}-${new Date().toISOString().slice(0, 10)}.pdf`;
    if (!store.isDesktop) return toast.info("PDF export is available in the desktop app");
    const pdf = await store.files.exportInvoicePdf({ projectId, fileName, html });
    if (pdf) { updateInvoice(idv, { pdf }); toast.success("PDF saved & attached"); }
    else toast.error("PDF export failed");
  };

  return (
    <Modal
      open={open} onClose={onClose} size="2xl"
      title={invoice ? "Edit Invoice" : "New Invoice"}
      headerRight={<button className="btn btn-outline text-sm" onClick={exportPdf}><FileDown className="w-4 h-4" /> Export PDF</button>}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>{invoice ? "Save invoice" : "Create invoice"}</button></>}
    >
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: line items */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-xs font-medium text-slate-600">Project</span>
              <select className="input mt-1" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {db.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-medium text-slate-600">Contractor</span>
              <select className="input mt-1" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
                {db.contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-medium text-slate-600">Status</span>
              <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
                {(Object.keys(INVOICE_STATUS_META) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{INVOICE_STATUS_META[s].label}</option>)}
              </select>
            </label>
          </div>

          {/* line items table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr><th className="text-left px-3 py-2">Description</th><th className="px-2 py-2 w-16">Qty</th><th className="px-2 py-2 w-28">Unit</th><th className="px-2 py-2 w-28 text-right">Total</th><th className="w-8"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-xs">Add line items from the catalog →</td></tr>}
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-1.5"><input className="input py-1 text-sm" value={i.description} onChange={(e) => updateItem(i.id, { description: e.target.value })} placeholder="Description" /><span className="text-[10px] text-slate-400">{i.category}</span></td>
                    <td className="px-2 py-1.5"><input type="number" className="input py-1 text-sm" value={i.quantity} onChange={(e) => updateItem(i.id, { quantity: Number(e.target.value) })} /></td>
                    <td className="px-2 py-1.5"><input type="number" step="0.01" className="input py-1 text-sm" value={i.unitPrice} onChange={(e) => updateItem(i.id, { unitPrice: Number(e.target.value) })} /></td>
                    <td className="px-2 py-1.5 text-right font-medium">{moneyCents(i.total)}</td>
                    <td className="px-1"><button onClick={() => removeItem(i.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCustom} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-2 flex items-center justify-center gap-1 border-t border-slate-100"><Plus className="w-3.5 h-3.5" /> Add custom line</button>
          </div>

          <label className="block"><span className="text-xs font-medium text-slate-600">Terms</span>
            <textarea className="input mt-1 resize-none text-xs" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </label>
        </div>

        {/* Right: catalog + totals */}
        <div className="space-y-4">
          <div className="card p-3">
            <span className="text-xs font-medium text-slate-600">Service catalog</span>
            <select className="input mt-1 mb-2" value={catId} onChange={(e) => setCatId(e.target.value)}>
              {SERVICE_CATALOG.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {category.services.map((s) => (
                <button key={s.id} onClick={() => addFromCatalog(s.id)} className="w-full flex items-center justify-between gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-blue-50 group">
                  <span className="min-w-0"><span className="block text-sm text-slate-700 truncate">{s.name}</span><span className="text-[11px] text-slate-400">{moneyCents(s.defaultPrice)} · {s.unit}</span></span>
                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-3">
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Subtotal</span><span className="font-bold text-slate-900">{money(subtotal)}</span></div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Milestones (25 / 25 / 50)</p>
            {([
              ["Deposit", ms.depositAmount, "deposit"],
              ["Midpoint", ms.midpointAmount, "midpoint"],
              ["Completion", ms.completionAmount, "completion"],
            ] as const).map(([label, amount, key]) => (
              <label key={key} className={cn("flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 cursor-pointer", paid[key] ? "bg-emerald-50" : "hover:bg-slate-50")}>
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={paid[key]} onChange={(e) => setPaid((p) => ({ ...p, [key]: e.target.checked }))} />
                  <span className="text-sm text-slate-700">{label}</span>
                </span>
                <span className="text-sm font-semibold">{money(amount)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
