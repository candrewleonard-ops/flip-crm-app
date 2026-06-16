"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Search, Grid3X3, List, Trash2, Edit3, Home, FileText, DollarSign } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";
import { InvestmentType, RentalProperty, NoteInvestment, Investment } from "@/lib/types";

export default function PortfolioPage() {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvestmentType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  let filtered = store.investments;
  if (typeFilter !== "all") filtered = filtered.filter((inv) => inv.type === typeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((inv) => {
      if (inv.type === "rental") return inv.name.toLowerCase().includes(q) || inv.address.city.toLowerCase().includes(q);
      return inv.name.toLowerCase().includes(q) || inv.borrowerName.toLowerCase().includes(q);
    });
  }

  const handleDelete = (id: string) => {
    store.deleteInvestment(id);
    setDeleteConfirm(null);
  };

  const totalRentals = store.getRentalProperties().length;
  const totalNotes = store.getNoteInvestments().length;

  // Calculate total monthly cashflow across rentals + notes (only if collecting)
  const rentalCashflow = store.getRentalProperties()
    .filter((r) => r.collectingIncome !== false)
    .reduce((sum, r) => {
      const piti = r.principal + r.interest + r.taxes + r.insurance;
      const utilCosts = [r.gas, r.electric, r.sewer, r.water, r.trash]
        .filter((u) => !u.tenantPays).reduce((s, u) => s + u.monthlyCost, 0);
      return sum + (r.monthlyRent - piti - utilCosts - r.propertyManagerFee);
    }, 0);
  const noteCashflow = store.getNoteInvestments()
    .filter((n) => n.collectingIncome !== false)
    .reduce((sum, n) => sum + n.monthlyPaymentAmount, 0);
  const totalMonthlyCashflow = rentalCashflow + noteCashflow;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Passive Income Portfolio</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} investments &middot; {totalRentals} rentals &middot; {totalNotes} notes</p>
        </div>
        <button onClick={() => setShowNewInvestment(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
          <Plus size={16} /> Create New Investment
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rentals</p>
            <p className="text-xl font-bold text-slate-900">{totalRentals}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Notes</p>
            <p className="text-xl font-bold text-slate-900">{totalNotes}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg",
            totalMonthlyCashflow >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20" : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20"
          )}>
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Monthly Cash Flow</p>
            <p className={cn("text-xl font-bold", totalMonthlyCashflow >= 0 ? "text-emerald-700" : "text-red-700")}>{formatCurrency(totalMonthlyCashflow)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setTypeFilter("all")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition", typeFilter === "all" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>All</button>
        <button onClick={() => setTypeFilter("rental")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5", typeFilter === "rental" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
          <Home size={12} /> Rental Properties
        </button>
        <button onClick={() => setTypeFilter("note")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5", typeFilter === "note" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
          <FileText size={12} /> Note Investments
        </button>
        <div className="flex-1"></div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white w-48" />
        </div>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={cn("p-1.5", viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400")}><Grid3X3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={cn("p-1.5", viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400")}><List size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center py-16">
          <DollarSign size={48} className="text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-400 mb-1">No investments yet</p>
          <p className="text-sm text-slate-400 mb-4">Click &quot;Create New Investment&quot; to add your first rental property or note.</p>
          <button onClick={() => setShowNewInvestment(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <Plus size={16} /> Create New Investment
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <InvestmentCard key={inv.id} investment={inv} store={store} onDelete={() => setDeleteConfirm(inv.id)} />
          ))}
        </div>
      ) : (
        <div className="stat-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Details</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Monthly Income</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const monthly = inv.type === "rental"
                  ? inv.monthlyRent
                  : inv.monthlyPaymentAmount;
                return (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4"><Link href={`/portfolio/${inv.id}`} className="font-medium text-slate-900 hover:text-blue-600">{inv.name}</Link></td>
                    <td className="py-3 px-4"><span className={cn("badge", inv.type === "rental" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700")}>{inv.type === "rental" ? "Rental" : "Note"}</span></td>
                    <td className="py-3 px-4 text-slate-500">{inv.type === "rental" ? `${inv.address.city}, ${inv.address.state}` : inv.borrowerName}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatCurrency(monthly)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setDeleteConfirm(inv.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNewInvestment && <NewInvestmentModal store={store} onClose={() => setShowNewInvestment(false)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Investment?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this investment and all associated data.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvestmentCard({ investment, store, onDelete }: { investment: Investment; store: ReturnType<typeof useStore>; onDelete: () => void }) {
  const collecting = investment.collectingIncome !== false;
  const toggleCollecting = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.updateInvestment(investment.id, { collectingIncome: !collecting });
  };

  if (investment.type === "rental") {
    const piti = investment.principal + investment.interest + investment.taxes + investment.insurance;
    const utilCosts = [investment.gas, investment.electric, investment.sewer, investment.water, investment.trash]
      .filter((u) => !u.tenantPays).reduce((s, u) => s + u.monthlyCost, 0);
    const cashflow = investment.monthlyRent - piti - utilCosts - investment.propertyManagerFee;

    return (
      <div className={cn("stat-card group relative", !collecting && "opacity-60 ring-2 ring-amber-300")}>
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <Link href={`/portfolio/${investment.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit3 size={14} /></Link>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
        <Link href={`/portfolio/${investment.id}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-emerald-100 text-emerald-700">Rental Property</span>
            {!collecting && <span className="badge bg-amber-100 text-amber-700">Not Collecting</span>}
          </div>
          {investment.photos.length > 0 ? (
            <div className="w-full h-32 rounded-lg mb-3 overflow-hidden bg-slate-100">
              <img src={investment.photos[0]} alt={investment.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-32 rounded-lg mb-3 bg-slate-100 flex items-center justify-center">
              <Home size={32} className="text-slate-300" />
            </div>
          )}
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{investment.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {investment.address.street}, {investment.address.city}, {investment.address.state}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">PITI</p><p className="text-sm font-semibold text-slate-800">{formatCurrency(piti)}</p></div>
            <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Rent</p><p className="text-sm font-semibold text-emerald-700">{formatCurrency(investment.monthlyRent)}</p></div>
            <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Cash Flow</p><p className={cn("text-sm font-semibold", cashflow >= 0 ? "text-emerald-700" : "text-red-600")}>{formatCurrency(cashflow)}</p></div>
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400">
            <span>{investment.workOrders.length} work orders</span>
            <span>{investment.tenantNames || "No tenant"}</span>
          </div>
        </Link>
        <button onClick={toggleCollecting}
          className={cn("mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition",
            collecting ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>
          {collecting ? "Not Collecting Income" : "Resume Collecting Income"}
        </button>
      </div>
    );
  }

  // Note investment card
  const inv = investment;
  const months = inv.dateLent && inv.dateDue
    ? Math.max(1, Math.round((new Date(inv.dateDue).getTime() - new Date(inv.dateLent).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const totalProfit = months > 0 ? (inv.monthlyPaymentAmount * months) - inv.loanAmount : 0;

  return (
    <div className={cn("stat-card group relative", !collecting && "opacity-60 ring-2 ring-amber-300")}>
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <Link href={`/portfolio/${inv.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit3 size={14} /></Link>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
      </div>
      <Link href={`/portfolio/${inv.id}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge bg-violet-100 text-violet-700">Note Investment</span>
          {!collecting && <span className="badge bg-amber-100 text-amber-700">Not Collecting</span>}
        </div>
        <div className="w-full h-32 rounded-lg mb-3 bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
          <FileText size={32} className="text-violet-300" />
        </div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{inv.name}</h3>
        <p className="text-xs text-slate-400 mt-1">Borrower: {inv.borrowerName}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Loan</p><p className="text-sm font-semibold text-slate-800">{formatCurrency(inv.loanAmount)}</p></div>
          <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Monthly</p><p className="text-sm font-semibold text-emerald-700">{formatCurrency(inv.monthlyPaymentAmount)}</p></div>
          <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Rate</p><p className="text-sm font-semibold text-blue-700">{inv.annualInterestRate}%</p></div>
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>Profit: {formatCurrency(totalProfit)}</span>
          <span>{inv.collateral ? "Collateralized" : "No collateral"}</span>
        </div>
      </Link>
      <button onClick={toggleCollecting}
        className={cn("mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition",
          collecting ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>
        {collecting ? "Not Collecting Monthly" : "Resume Collecting Monthly"}
      </button>
    </div>
  );
}

function NewInvestmentModal({ store, onClose }: { store: ReturnType<typeof useStore>; onClose: () => void }) {
  const [step, setStep] = useState<"choose" | "rental" | "note">("choose");
  const [rentalForm, setRentalForm] = useState({
    name: "", street: "", city: "", state: "", zip: "",
  });
  const [noteForm, setNoteForm] = useState({
    name: "", borrowerName: "", loanAmount: "", dateLent: "", dateDue: "",
    monthlyPaymentDate: "", monthlyPaymentAmount: "", annualInterestRate: "", collateral: "",
  });

  const setR = (key: string, val: string) => setRentalForm((p) => ({ ...p, [key]: val }));
  const setN = (key: string, val: string) => setNoteForm((p) => ({ ...p, [key]: val }));

  const defaultUtility = { tenantPays: false, monthlyCost: 0 };

  const createRental = () => {
    if (!rentalForm.name.trim()) return;
    const id = `inv-${Date.now()}`;
    const rental: RentalProperty = {
      id, type: "rental", name: rentalForm.name, collectingIncome: true,
      address: { street: rentalForm.street, city: rentalForm.city, state: rentalForm.state, zip: rentalForm.zip, lat: 33 + Math.random() * 15, lng: -120 + Math.random() * 50 },
      photos: [], principal: 0, interest: 0, taxes: 0, insurance: 0,
      monthlyRent: 0,
      gas: { ...defaultUtility }, electric: { ...defaultUtility }, sewer: { ...defaultUtility }, water: { ...defaultUtility }, trash: { ...defaultUtility },
      depositAmount: 0, leaseStartDate: "", leaseEndDate: "", tenantNames: "", numberOfOccupants: 0, tenantContactInfo: "", propertyManagerContact: "", propertyManagerFee: 0,
      electricProvider: "", electricAccount: "", waterProvider: "", waterAccount: "", gasProvider: "", gasAccount: "", sewerProvider: "", sewerAccount: "", trashProvider: "", trashAccount: "",
      workOrders: [],
      yearBuilt: "", squareFootage: "", bedrooms: "", bathrooms: "", lotSize: "", propertyType: "",
      acInstalled: "", roofInstalled: "", guttersInstalled: "", floorsInstalled: "", kitchenRemodeled: "", bathroomRemodeled: "",
      waterHeaterInstalled: "", furnaceInstalled: "", electricalUpdated: "", plumbingUpdated: "", foundationType: "", garageType: "", propertyNotes: "",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    store.addInvestment(rental);
    onClose();
  };

  const createNote = () => {
    if (!noteForm.name.trim()) return;
    const id = `inv-${Date.now()}`;
    const note: NoteInvestment = {
      id, type: "note", name: noteForm.name, collectingIncome: true,
      borrowerName: noteForm.borrowerName,
      loanAmount: parseFloat(noteForm.loanAmount) || 0,
      dateLent: noteForm.dateLent, dateDue: noteForm.dateDue,
      monthlyPaymentDate: noteForm.monthlyPaymentDate,
      monthlyPaymentAmount: parseFloat(noteForm.monthlyPaymentAmount) || 0,
      annualInterestRate: parseFloat(noteForm.annualInterestRate) || 0,
      collateral: noteForm.collateral,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    store.addInvestment(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {step === "choose" && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Investment</h2>
            <p className="text-sm text-slate-500 mb-6">What type of investment would you like to add?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setStep("rental")} className="stat-card hover:border-blue-300 hover:shadow-md transition text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3"><Home size={24} className="text-emerald-600" /></div>
                <h3 className="font-semibold text-slate-900 mb-1">Rental Property</h3>
                <p className="text-xs text-slate-500">Track rent, expenses, tenants, and cash flow for a rental property.</p>
              </button>
              <button onClick={() => setStep("note")} className="stat-card hover:border-blue-300 hover:shadow-md transition text-left">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3"><FileText size={24} className="text-violet-600" /></div>
                <h3 className="font-semibold text-slate-900 mb-1">Note Investment</h3>
                <p className="text-xs text-slate-500">Track a private loan/note with borrower info, payments, and interest.</p>
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
            </div>
          </>
        )}

        {step === "rental" && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Rental Property</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Property Name *</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 123 Oak Street Duplex" value={rentalForm.name} onChange={(e) => setR("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Street Address</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="123 Oak St" value={rentalForm.street} onChange={(e) => setR("street", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">City</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Atlanta" value={rentalForm.city} onChange={(e) => setR("city", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700 block mb-1">State</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="GA" value={rentalForm.state} onChange={(e) => setR("state", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">ZIP</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="30316" value={rentalForm.zip} onChange={(e) => setR("zip", e.target.value)} /></div>
              </div>
              <p className="text-xs text-slate-400">You can add financial details, photos, and lease info from the property detail page after creation.</p>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setStep("choose")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Back</button>
                <button onClick={createRental} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Create Rental Property</button>
              </div>
            </div>
          </>
        )}

        {step === "note" && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Note Investment</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Note Name *</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Smith Residence Note" value={noteForm.name} onChange={(e) => setN("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Borrower Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="John Smith" value={noteForm.borrowerName} onChange={(e) => setN("borrowerName", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Loan Amount</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="150000" value={noteForm.loanAmount} onChange={(e) => setN("loanAmount", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Date Lent</label><input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={noteForm.dateLent} onChange={(e) => setN("dateLent", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Date Due</label><input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={noteForm.dateDue} onChange={(e) => setN("dateDue", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Monthly Payment Date</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="1st of month" value={noteForm.monthlyPaymentDate} onChange={(e) => setN("monthlyPaymentDate", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Monthly Amount</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="1500" value={noteForm.monthlyPaymentAmount} onChange={(e) => setN("monthlyPaymentAmount", e.target.value)} /></div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Annual Rate %</label><input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="8.5" value={noteForm.annualInterestRate} onChange={(e) => setN("annualInterestRate", e.target.value)} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Collateral (Property Address)</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="456 Elm St, Atlanta, GA 30316" value={noteForm.collateral} onChange={(e) => setN("collateral", e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setStep("choose")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Back</button>
                <button onClick={createNote} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Create Note Investment</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
