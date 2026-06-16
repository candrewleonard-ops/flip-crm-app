"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Send, ChevronDown, FileText, DollarSign,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SERVICE_CATALOG } from "@/lib/service-catalog";
import { INVOICE_TERMS } from "@/lib/invoice-terms";
import { formatCurrency, cn } from "@/lib/utils";

interface LineItem {
  id: string;
  categoryId: string;
  serviceId: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export default function CreateInvoicePage() {
  return <Suspense><CreateInvoiceContent /></Suspense>;
}

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const store = useStore();
  const preselectedContractor = searchParams.get("contractor") || "";
  const preselectedProject = searchParams.get("project") || "";

  const [contractorId, setContractorId] = useState(preselectedContractor);
  const [projectId, setProjectId] = useState(preselectedProject);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showTerms, setShowTerms] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sent, setSent] = useState(false);

  const subtotal = lineItems.reduce((s, li) => s + li.unitPrice * li.quantity, 0);
  const deposit = subtotal * 0.25;
  const midpoint = subtotal * 0.25;
  const final_ = subtotal * 0.5;

  const addServiceItem = (categoryId: string, serviceId: string) => {
    const cat = SERVICE_CATALOG.find((c) => c.id === categoryId);
    const svc = cat?.services.find((s) => s.id === serviceId);
    if (!svc) return;
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-${Date.now()}`,
        categoryId,
        serviceId,
        description: svc.name,
        unitPrice: svc.defaultPrice,
        quantity: 1,
      },
    ]);
    setShowCatalog(false);
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-96 fade-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Send size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invoice Sent for Approval</h2>
        <p className="text-sm text-slate-500 mb-6">The invoice has been sent to admin authority for review.</p>
        <div className="flex gap-3">
          <Link href="/invoices" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">View Invoices</Link>
          <button onClick={() => { setSent(false); setLineItems([]); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition">Create Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <div>
        <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> Back to Invoices
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Write Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">Create and send an invoice to admin for approval</p>
      </div>

      {/* Contractor & Project Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Contractor</label>
          <select
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Select contractor...</option>
            {store.contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Select project...</option>
            {store.projects.filter((p) => p.status === "active").map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.address.city}, {p.address.state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Items */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
          <button
            onClick={() => setShowCatalog(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            <Plus size={14} /> Add Service Item
          </button>
        </div>

        {lineItems.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No items added yet. Click &quot;Add Service Item&quot; to select from the catalog.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-500">Description</th>
                <th className="text-right py-2 font-medium text-slate-500 w-28">Unit Price</th>
                <th className="text-right py-2 font-medium text-slate-500 w-20">Qty</th>
                <th className="text-right py-2 font-medium text-slate-500 w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <input
                      value={li.description}
                      onChange={(e) => updateItem(li.id, "description", e.target.value)}
                      className="w-full border-0 bg-transparent text-sm text-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      value={li.unitPrice}
                      onChange={(e) => updateItem(li.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right border border-slate-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      value={li.quantity}
                      onChange={(e) => updateItem(li.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-16 text-right border border-slate-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(li.unitPrice * li.quantity)}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeItem(li.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Breakdown */}
      {lineItems.length > 0 && (
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Schedule</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">25% Deposit (upon signing)</span>
                <span className="font-medium text-slate-800">{formatCurrency(deposit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">25% Midpoint (at 50% completion)</span>
                <span className="font-medium text-slate-800">{formatCurrency(midpoint)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">50% Completion (final payment)</span>
                <span className="font-medium text-slate-800">{formatCurrency(final_)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="stat-card">
        <button onClick={() => setShowTerms(!showTerms)} className="flex items-center justify-between w-full">
          <h3 className="text-sm font-semibold text-slate-700">Terms & Conditions</h3>
          <ChevronDown size={16} className={cn("text-slate-400 transition-transform", showTerms && "rotate-180")} />
        </button>
        {showTerms && (
          <pre className="mt-3 text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg max-h-96 overflow-auto font-sans leading-relaxed">
            {INVOICE_TERMS}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Link href="/invoices" className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</Link>
        <button
          onClick={() => setSent(true)}
          disabled={lineItems.length === 0 || !contractorId || !projectId}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition",
            lineItems.length > 0 && contractorId && projectId
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          <Send size={14} /> Send to Admin for Approval
        </button>
      </div>

      {/* Service Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCatalog(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Service Catalog</h2>
              <p className="text-sm text-slate-500">Select a category then choose a service</p>
            </div>
            <div className="flex h-[60vh]">
              {/* Categories */}
              <div className="w-48 border-r border-slate-200 overflow-auto">
                {SERVICE_CATALOG.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm transition",
                      selectedCategory === cat.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {/* Services */}
              <div className="flex-1 overflow-auto p-4">
                {selectedCategory ? (
                  <div className="space-y-2">
                    {SERVICE_CATALOG.find((c) => c.id === selectedCategory)?.services.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => addServiceItem(selectedCategory, svc.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition text-left group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700">{svc.name}</p>
                          <p className="text-xs text-slate-400">{svc.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{formatCurrency(svc.defaultPrice)}</span>
                          <Plus size={14} className="text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center mt-12">Select a category to view services</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
