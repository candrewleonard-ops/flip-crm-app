"use client";

export const runtime = 'edge';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Home, FileText, Trash2, MapPin, Upload, X, Camera, Zap, Droplets, Flame, Waves, Recycle, Plus, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { RentalProperty, NoteInvestment, UtilityInfo } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const investment = store.getInvestment(id);

  if (!investment) {
    return (
      <div className="space-y-6 fade-in">
        <Link href="/portfolio" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Portfolio
        </Link>
        <div className="stat-card flex flex-col items-center py-16">
          <FileText size={48} className="text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-400">Investment not found</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    store.deleteInvestment(investment.id);
    router.push("/portfolio");
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/portfolio" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2">
            <ArrowLeft size={14} /> Back to Portfolio
          </Link>
          <div className="flex items-center gap-2 mb-1">
            {investment.type === "rental" ? (
              <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><Home size={10} /> Rental Property</span>
            ) : (
              <span className="badge bg-violet-100 text-violet-700 flex items-center gap-1"><FileText size={10} /> Note Investment</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{investment.name}</h1>
          {investment.type === "rental" && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin size={13} /> {investment.address.street}, {investment.address.city}, {investment.address.state} {investment.address.zip}
            </p>
          )}
          {investment.type === "note" && (
            <p className="text-sm text-slate-500 mt-1">Borrower: {investment.borrowerName || "—"}</p>
          )}
        </div>
        <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {investment.type === "rental" ? (
        <RentalView investment={investment} />
      ) : (
        <NoteView investment={investment} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {investment.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this investment.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RentalTab = "overview" | "lease" | "vital" | "workorders" | "property";

function RentalView({ investment }: { investment: RentalProperty }) {
  const [activeTab, setActiveTab] = useState<RentalTab>("overview");

  const tabs: { key: RentalTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "lease", label: "Lease Agreement" },
    { key: "vital", label: "Vital Information" },
    { key: "workorders", label: "Work Orders" },
    { key: "property", label: "Property Information" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
                activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && <OverviewTab investment={investment} />}
      {activeTab === "lease" && <LeaseAgreementTab investment={investment} />}
      {activeTab === "vital" && <VitalInformationTab investment={investment} />}
      {activeTab === "workorders" && <WorkOrdersTab investment={investment} />}
      {activeTab === "property" && <PropertyInformationTab investment={investment} />}
    </div>
  );
}

function OverviewTab({ investment }: { investment: RentalProperty }) {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mainPhotoIdx, setMainPhotoIdx] = useState(0);

  const update = (patch: Partial<RentalProperty>) => {
    store.updateInvestment(investment.id, patch);
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }));
    const newPhotos = await Promise.all(readers);
    update({ photos: [...investment.photos, ...newPhotos] });
  };

  const removePhoto = (idx: number) => {
    const next = investment.photos.filter((_, i) => i !== idx);
    update({ photos: next });
    if (mainPhotoIdx >= next.length) setMainPhotoIdx(Math.max(0, next.length - 1));
  };

  const piti = investment.principal + investment.interest + investment.taxes + investment.insurance;
  const utilities: { key: keyof Pick<RentalProperty, "gas" | "electric" | "sewer" | "water" | "trash">; label: string }[] = [
    { key: "gas", label: "Gas" },
    { key: "electric", label: "Electric" },
    { key: "sewer", label: "Sewer" },
    { key: "water", label: "Water" },
    { key: "trash", label: "Trash" },
  ];
  const landlordUtilCost = utilities
    .filter((u) => !investment[u.key].tenantPays)
    .reduce((sum, u) => sum + investment[u.key].monthlyCost, 0);
  const totalExpenses = piti + landlordUtilCost + investment.propertyManagerFee;
  const netCashflow = investment.monthlyRent - totalExpenses;
  const cashflowPositive = netCashflow >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photos */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Property Photos</h3>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
              <Upload size={12} /> Upload Photos
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handlePhotoUpload(e.target.files); e.target.value = ""; }} />
          </div>
          {investment.photos.length === 0 ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-[4/3] bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-300 transition">
              <Camera size={40} className="mb-2" />
              <span className="text-sm font-medium">Click to upload property photos</span>
              <span className="text-xs mt-1">Exterior, interior, rooms, etc.</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                <img src={investment.photos[mainPhotoIdx]} alt="Property" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(mainPhotoIdx)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                  <X size={14} />
                </button>
              </div>
              {investment.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {investment.photos.map((src, i) => (
                    <button key={i} onClick={() => setMainPhotoIdx(i)}
                      className={cn("flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition",
                        mainPhotoIdx === i ? "border-blue-600" : "border-transparent opacity-70 hover:opacity-100")}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PITI + Rent */}
        <div className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Monthly Payment (PITI)</h3>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(piti)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Principal" value={investment.principal} onChange={(v) => update({ principal: v })} />
              <NumberField label="Interest" value={investment.interest} onChange={(v) => update({ interest: v })} />
              <NumberField label="Taxes" value={investment.taxes} onChange={(v) => update({ taxes: v })} />
              <NumberField label="Insurance" value={investment.insurance} onChange={(v) => update({ insurance: v })} />
            </div>
          </div>

          <div className="stat-card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Monthly Rent Collected</h3>
            <NumberField label="Rent" value={investment.monthlyRent} onChange={(v) => update({ monthlyRent: v })} accent="emerald" />
          </div>

          <div className="stat-card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Property Manager</h3>
            <NumberField label="Monthly PM Fee" value={investment.propertyManagerFee} onChange={(v) => update({ propertyManagerFee: v })} />
          </div>
        </div>
      </div>

      {/* Utilities */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Utilities</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-[120px_1fr_1fr_auto] gap-3 text-xs font-medium text-slate-400 uppercase pb-2 border-b border-slate-100">
            <div>Utility</div>
            <div>Tenant Pays</div>
            <div>Landlord Pays</div>
            <div className="text-right">Cost / mo</div>
          </div>
          {utilities.map((u) => {
            const info: UtilityInfo = investment[u.key];
            return (
              <div key={u.key} className="grid grid-cols-[120px_1fr_1fr_auto] gap-3 items-center py-2 border-b border-slate-50 last:border-0">
                <div className="text-sm font-medium text-slate-700">{u.label}</div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={info.tenantPays} onChange={(e) => update({ [u.key]: { ...info, tenantPays: e.target.checked } } as Partial<RentalProperty>)}
                    className="w-4 h-4 rounded text-emerald-600" />
                  Tenant pays
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={!info.tenantPays} onChange={(e) => update({ [u.key]: { ...info, tenantPays: !e.target.checked } } as Partial<RentalProperty>)}
                    className="w-4 h-4 rounded text-blue-600" />
                  Landlord pays
                </label>
                <div className="w-32">
                  <input type="number" disabled={info.tenantPays} value={info.monthlyCost || ""} placeholder="$ 0"
                    onChange={(e) => update({ [u.key]: { ...info, monthlyCost: parseFloat(e.target.value) || 0 } } as Partial<RentalProperty>)}
                    className={cn("w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-right",
                      info.tenantPays && "bg-slate-50 text-slate-300")} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cashflow Line */}
      <div className={cn("stat-card", cashflowPositive ? "ring-2 ring-emerald-200 bg-emerald-50/30" : "ring-2 ring-red-200 bg-red-50/30")}>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Cash Flow</h3>
        <div className="flex items-center justify-between flex-wrap gap-3 text-lg font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700">{formatCurrency(investment.monthlyRent)}</span>
            <span className="text-xs text-slate-400 font-normal">gross rent</span>
          </div>
          <span className="text-slate-400">−</span>
          <div className="flex items-center gap-2">
            <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
            <span className="text-xs text-slate-400 font-normal">expenses</span>
          </div>
          <span className="text-slate-400">=</span>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold", cashflowPositive ? "text-emerald-600" : "text-red-600")}>{formatCurrency(netCashflow)}</span>
            <span className="text-xs text-slate-400 font-normal">net cash flow</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <ExpenseLine label="PITI" value={piti} color="text-slate-600" />
          <ExpenseLine label="Landlord Utilities" value={landlordUtilCost} color="text-amber-600" />
          <ExpenseLine label="Property Mgr" value={investment.propertyManagerFee} color="text-violet-600" />
          <ExpenseLine label="Total Expenses" value={totalExpenses} color="text-red-600" bold />
        </div>
      </div>
    </div>
  );
}

function PropertyInformationTab({ investment }: { investment: RentalProperty }) {
  const store = useStore();
  const update = (patch: Partial<RentalProperty>) => store.updateInvestment(investment.id, patch);

  const basicFields: { key: keyof RentalProperty; label: string; placeholder: string; type?: string }[] = [
    { key: "yearBuilt", label: "Year Built", placeholder: "1985" },
    { key: "squareFootage", label: "Square Footage", placeholder: "1,800" },
    { key: "bedrooms", label: "Bedrooms", placeholder: "3" },
    { key: "bathrooms", label: "Bathrooms", placeholder: "2" },
    { key: "lotSize", label: "Lot Size", placeholder: "0.25 acres" },
    { key: "propertyType", label: "Property Type", placeholder: "Single Family, Duplex, etc." },
    { key: "foundationType", label: "Foundation Type", placeholder: "Slab, Crawlspace, Basement" },
    { key: "garageType", label: "Garage", placeholder: "2-car attached" },
  ];

  const materialItems: { key: keyof RentalProperty; label: string; hint: string }[] = [
    { key: "acInstalled", label: "AC / HVAC Installed", hint: "Year or date" },
    { key: "roofInstalled", label: "Roof Installed", hint: "Year or date" },
    { key: "guttersInstalled", label: "Gutters Installed", hint: "Year or date" },
    { key: "floorsInstalled", label: "Floors Installed", hint: "Year or date" },
    { key: "kitchenRemodeled", label: "Kitchen Last Remodeled", hint: "Year or date" },
    { key: "bathroomRemodeled", label: "Bathroom Last Remodeled", hint: "Year or date" },
    { key: "waterHeaterInstalled", label: "Water Heater Installed", hint: "Year or date" },
    { key: "furnaceInstalled", label: "Furnace Installed", hint: "Year or date" },
    { key: "electricalUpdated", label: "Electrical Updated", hint: "Year or date" },
    { key: "plumbingUpdated", label: "Plumbing Updated", hint: "Year or date" },
  ];

  return (
    <div className="space-y-6">
      {/* Basic property info */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Property Information</h3>
        <p className="text-xs text-slate-500 mb-5">Core details about this property.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {basicFields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
              <input type="text" value={(investment[f.key] as string) || ""}
                onChange={(e) => update({ [f.key]: e.target.value } as Partial<RentalProperty>)}
                placeholder={f.placeholder}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Material item facts */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Material Item Facts</h3>
        <p className="text-xs text-slate-500 mb-5">Major systems and improvements — when were they last installed or updated?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materialItems.map((m) => (
            <div key={m.key} className="border border-slate-200 rounded-lg p-3 hover:border-blue-200 transition">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{m.label}</label>
              <input type="text" value={(investment[m.key] as string) || ""}
                onChange={(e) => update({ [m.key]: e.target.value } as Partial<RentalProperty>)}
                placeholder={m.hint}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Additional Property Notes</h3>
        <textarea value={investment.propertyNotes}
          onChange={(e) => update({ propertyNotes: e.target.value })}
          placeholder="Any other important property information — known issues, warranties, appliance ages, neighborhood notes, etc."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 resize-none" />
      </div>
    </div>
  );
}

function WorkOrdersTab({ investment }: { investment: RentalProperty }) {
  const store = useStore();
  const [showNew, setShowNew] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newCost, setNewCost] = useState("");

  const handleCreate = () => {
    if (!newDesc.trim()) return;
    store.addWorkOrder(investment.id, {
      id: `wo-${Date.now()}`,
      description: newDesc.trim(),
      cost: parseFloat(newCost) || 0,
      date: new Date().toISOString().slice(0, 10),
      status: "open",
    });
    setNewDesc("");
    setNewCost("");
    setShowNew(false);
  };

  const toggleStatus = (woId: string, current: "open" | "completed") => {
    store.updateWorkOrder(investment.id, woId, { status: current === "open" ? "completed" : "open" });
  };

  const openOrders = investment.workOrders.filter((w) => w.status === "open");
  const completedOrders = investment.workOrders.filter((w) => w.status === "completed");
  const totalCost = investment.workOrders.reduce((s, w) => s + w.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Work Orders</h3>
          <p className="text-xs text-slate-500 mt-1">{investment.workOrders.length} total &middot; {formatCurrency(totalCost)} spent</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Create Work Order
        </button>
      </div>

      {showNew && (
        <div className="stat-card ring-2 ring-blue-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">New Work Order</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Description</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe the work needed..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" />
            </div>
            <div className="w-48">
              <label className="text-xs text-slate-500 block mb-1">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)}
                  placeholder="0" className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Create</button>
              <button onClick={() => { setShowNew(false); setNewDesc(""); setNewCost(""); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {investment.workOrders.length === 0 && !showNew && (
        <div className="stat-card flex flex-col items-center py-12">
          <Plus size={40} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No work orders yet. Click &quot;Create Work Order&quot; to add one.</p>
        </div>
      )}

      {openOrders.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Open ({openOrders.length})</h4>
          <div className="space-y-2">
            {openOrders.map((wo) => (
              <div key={wo.id} className="stat-card border-l-4 border-l-amber-400 flex items-start gap-3">
                <button onClick={() => toggleStatus(wo.id, wo.status)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-slate-300 hover:border-blue-500 flex-shrink-0 transition" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{wo.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{wo.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{formatCurrency(wo.cost)}</span>
                <button onClick={() => store.deleteWorkOrder(investment.id, wo.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Completed ({completedOrders.length})</h4>
          <div className="space-y-2">
            {completedOrders.map((wo) => (
              <div key={wo.id} className="stat-card border-l-4 border-l-emerald-400 flex items-start gap-3 opacity-75">
                <button onClick={() => toggleStatus(wo.id, wo.status)}
                  className="mt-0.5 w-5 h-5 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={14} className="text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 line-through">{wo.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{wo.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-500">{formatCurrency(wo.cost)}</span>
                <button onClick={() => store.deleteWorkOrder(investment.id, wo.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VitalInformationTab({ investment }: { investment: RentalProperty }) {
  const store = useStore();
  const update = (patch: Partial<RentalProperty>) => store.updateInvestment(investment.id, patch);

  const utilities = [
    { providerKey: "electricProvider" as const, accountKey: "electricAccount" as const, label: "Electric", icon: Zap, color: "text-amber-600 bg-amber-100", placeholder: "Georgia Power" },
    { providerKey: "waterProvider" as const, accountKey: "waterAccount" as const, label: "Water", icon: Droplets, color: "text-blue-600 bg-blue-100", placeholder: "City Water Dept" },
    { providerKey: "gasProvider" as const, accountKey: "gasAccount" as const, label: "Gas", icon: Flame, color: "text-orange-600 bg-orange-100", placeholder: "Atlanta Gas Light" },
    { providerKey: "sewerProvider" as const, accountKey: "sewerAccount" as const, label: "Sewer", icon: Waves, color: "text-cyan-600 bg-cyan-100", placeholder: "City Sewer" },
    { providerKey: "trashProvider" as const, accountKey: "trashAccount" as const, label: "Trash", icon: Recycle, color: "text-emerald-600 bg-emerald-100", placeholder: "Waste Management" },
  ];

  return (
    <div className="space-y-6">
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Vital Information</h3>
        <p className="text-xs text-slate-500 mb-5">Utility providers and account info for this property.</p>

        <div className="space-y-4">
          {utilities.map((u) => {
            const Icon = u.icon;
            return (
              <div key={u.providerKey} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", u.color)}>
                    <Icon size={16} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">{u.label}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Provider / Company</label>
                    <input type="text" value={investment[u.providerKey]}
                      onChange={(e) => update({ [u.providerKey]: e.target.value } as Partial<RentalProperty>)}
                      placeholder={u.placeholder}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Account # / Login</label>
                    <input type="text" value={investment[u.accountKey]}
                      onChange={(e) => update({ [u.accountKey]: e.target.value } as Partial<RentalProperty>)}
                      placeholder="Account number or login info"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaseAgreementTab({ investment }: { investment: RentalProperty }) {
  const store = useStore();
  const update = (patch: Partial<RentalProperty>) => store.updateInvestment(investment.id, patch);

  const utilities: { key: keyof Pick<RentalProperty, "gas" | "electric" | "sewer" | "water" | "trash">; label: string }[] = [
    { key: "gas", label: "Gas" },
    { key: "electric", label: "Electric" },
    { key: "sewer", label: "Sewer" },
    { key: "water", label: "Water" },
    { key: "trash", label: "Trash" },
  ];

  return (
    <div className="space-y-6">
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Lease Agreement</h3>
        <p className="text-xs text-slate-500 mb-5">Template with all the info a landlord needs to track for this tenancy.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Rent */}
          <FormRow number={1} label="Monthly Rent">
            <CurrencyInput value={investment.monthlyRent} onChange={(v) => update({ monthlyRent: v })} placeholder="1500" />
          </FormRow>

          {/* 2. Deposit Amount */}
          <FormRow number={2} label="Security Deposit">
            <CurrencyInput value={investment.depositAmount} onChange={(v) => update({ depositAmount: v })} placeholder="1500" />
          </FormRow>

          {/* 3. Lease Start Date */}
          <FormRow number={3} label="Lease Start Date">
            <input type="date" value={investment.leaseStartDate} onChange={(e) => update({ leaseStartDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </FormRow>

          {/* 7. Lease End Date */}
          <FormRow number={7} label="Lease End Date">
            <input type="date" value={investment.leaseEndDate} onChange={(e) => update({ leaseEndDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </FormRow>

          {/* 4. Tenant Names */}
          <FormRow number={4} label="Tenant Name(s)" fullWidth>
            <input type="text" value={investment.tenantNames} onChange={(e) => update({ tenantNames: e.target.value })}
              placeholder="John Smith, Jane Smith"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </FormRow>

          {/* 5. Number of Occupants */}
          <FormRow number={5} label="Number of Occupants">
            <input type="number" min={0} value={investment.numberOfOccupants || ""} onChange={(e) => update({ numberOfOccupants: parseInt(e.target.value) || 0 })}
              placeholder="3"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </FormRow>

          {/* 8. Tenant Contact Info */}
          <FormRow number={8} label="Tenant Contact Info" fullWidth>
            <textarea value={investment.tenantContactInfo} onChange={(e) => update({ tenantContactInfo: e.target.value })}
              placeholder="Phone: 555-123-4567&#10;Email: john@example.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" />
          </FormRow>

          {/* 9. Property Manager Contact Info */}
          <FormRow number={9} label="Property Manager Contact" fullWidth>
            <textarea value={investment.propertyManagerContact} onChange={(e) => update({ propertyManagerContact: e.target.value })}
              placeholder="Name, phone, email, company"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" />
          </FormRow>
        </div>
      </div>

      {/* 6. Who pays utilities */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">6</span>
          <h3 className="text-sm font-semibold text-slate-700">Who Pays Utilities</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {utilities.map((u) => (
            <div key={u.key} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500 mb-2">{u.label}</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={investment[u.key].tenantPays}
                  onChange={(e) => update({ [u.key]: { ...investment[u.key], tenantPays: e.target.checked } } as Partial<RentalProperty>)}
                  className="w-4 h-4 rounded text-emerald-600" />
                <span className={cn("font-medium", investment[u.key].tenantPays ? "text-emerald-700" : "text-slate-500")}>
                  {investment[u.key].tenantPays ? "Tenant" : "Landlord"}
                </span>
              </label>
              {!investment[u.key].tenantPays && investment[u.key].monthlyCost > 0 && (
                <p className="text-xs text-slate-400 mt-1">${investment[u.key].monthlyCost}/mo</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Manage utility costs on the Overview tab.</p>
      </div>
    </div>
  );
}

function FormRow({ number, label, children, fullWidth }: { number: number; label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={cn(fullWidth && "md:col-span-2")}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">{number}</span>
        <label className="text-sm font-medium text-slate-700">{label}</label>
      </div>
      {children}
    </div>
  );
}

function CurrencyInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
      <input type="number" value={value || ""} placeholder={placeholder || "0"}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-medium" />
    </div>
  );
}

function NumberField({ label, value, onChange, accent }: { label: string; value: number; onChange: (v: number) => void; accent?: "emerald" }) {
  return (
    <div>
      <label className="text-xs text-slate-500 block mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input type="number" value={value || ""} placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn("w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-medium",
            accent === "emerald" && "text-emerald-700")} />
      </div>
    </div>
  );
}

function ExpenseLine({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn("font-semibold", color, bold && "text-base")}>{formatCurrency(value)}</p>
    </div>
  );
}

function NoteView({ investment }: { investment: NoteInvestment }) {
  const store = useStore();
  const update = (patch: Partial<NoteInvestment>) => store.updateInvestment(investment.id, patch);

  // Total profit = monthly payment × months in term - principal
  const months = (investment.dateLent && investment.dateDue)
    ? Math.max(0, Math.round((new Date(investment.dateDue).getTime() - new Date(investment.dateLent).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const totalPayments = investment.monthlyPaymentAmount * months;
  const totalProfit = totalPayments - investment.loanAmount;
  const years = months / 12;

  // Interest earned (for sanity display): principal × rate × years
  const interestEarned = investment.loanAmount * (investment.annualInterestRate / 100) * years;

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Borrower Name", value: (
      <input type="text" value={investment.borrowerName}
        onChange={(e) => update({ borrowerName: e.target.value })}
        placeholder="John Smith"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    )},
    { label: "Loan Amount", value: (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input type="number" value={investment.loanAmount || ""}
          onChange={(e) => update({ loanAmount: parseFloat(e.target.value) || 0 })}
          placeholder="150000"
          className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-medium" />
      </div>
    )},
    { label: "Date Lent", value: (
      <input type="date" value={investment.dateLent}
        onChange={(e) => update({ dateLent: e.target.value })}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    )},
    { label: "Date Due", value: (
      <input type="date" value={investment.dateDue}
        onChange={(e) => update({ dateDue: e.target.value })}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    )},
    { label: "Monthly Payment Date", value: (
      <input type="text" value={investment.monthlyPaymentDate}
        onChange={(e) => update({ monthlyPaymentDate: e.target.value })}
        placeholder="e.g. 1st of month"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    )},
    { label: "Monthly Payment Amount", value: (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input type="number" value={investment.monthlyPaymentAmount || ""}
          onChange={(e) => update({ monthlyPaymentAmount: parseFloat(e.target.value) || 0 })}
          placeholder="1500"
          className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-medium" />
      </div>
    )},
    { label: "Annual Interest Rate", value: (
      <div className="relative">
        <input type="number" step="0.01" value={investment.annualInterestRate || ""}
          onChange={(e) => update({ annualInterestRate: parseFloat(e.target.value) || 0 })}
          placeholder="8.5"
          className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
      </div>
    )},
    { label: "Collateral (Property Address)", value: (
      <input type="text" value={investment.collateral}
        onChange={(e) => update({ collateral: e.target.value })}
        placeholder="456 Elm St, Atlanta, GA 30316"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Note Details</h3>
        <p className="text-xs text-slate-500 mb-5">Loan / note investment information.</p>

        <div className="divide-y divide-slate-100">
          {fields.map((f, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 sm:gap-6 py-3 items-center">
              <label className="text-sm font-medium text-slate-600">{f.label}:</label>
              <div>{f.value}</div>
            </div>
          ))}

          {/* Calculated Total Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 sm:gap-6 py-4 items-center bg-emerald-50/40 -mx-5 px-5 rounded-lg mt-2">
            <label className="text-sm font-semibold text-slate-700">Total Profit:</label>
            <div>
              <span className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(totalProfit)}
              </span>
              <span className="text-xs text-slate-500 ml-3">
                (auto-calculated: {months} month{months === 1 ? "" : "s"} &times; {formatCurrency(investment.monthlyPaymentAmount)} &minus; {formatCurrency(investment.loanAmount)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">Loan Term</p>
          <p className="text-lg font-bold text-slate-900">{months} mo</p>
          <p className="text-xs text-slate-400">{years.toFixed(1)} years</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">Total Payments</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalPayments)}</p>
          <p className="text-xs text-slate-400">over loan term</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">Interest @ Rate</p>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(interestEarned)}</p>
          <p className="text-xs text-slate-400">{investment.annualInterestRate}% × {years.toFixed(1)}y</p>
        </div>
        <div className="stat-card bg-emerald-50/40">
          <p className="text-xs text-slate-400 mb-1">Net Profit</p>
          <p className={cn("text-lg font-bold", totalProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-slate-400">payments − principal</p>
        </div>
      </div>
    </div>
  );
}

