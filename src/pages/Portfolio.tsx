import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Landmark, Plus, Home, FileText, TrendingUp, Wallet, Banknote } from "lucide-react";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { RentalModal, NoteModal } from "../components/portfolio/InvestmentModals";
import { isRental, isNote, rentalCashFlow, portfolioSummary } from "../lib/portfolio";
import { money, fullAddress, cn } from "../lib/utils";

export function Portfolio() {
  const { db } = useStore();
  const [addRental, setAddRental] = useState(false);
  const [addNote, setAddNote] = useState(false);

  const rentals = db.investments.filter(isRental);
  const notes = db.investments.filter(isNote);
  const sum = portfolioSummary(db.investments);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        icon={Landmark}
        title="Passive Income Portfolio"
        subtitle="Rentals and private notes"
        actions={
          <>
            <button className="btn btn-outline text-sm" onClick={() => setAddNote(true)}><Plus className="w-4 h-4" /> Note</button>
            <button className="btn btn-primary text-sm" onClick={() => setAddRental(true)}><Plus className="w-4 h-4" /> Rental</button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Cash Flow" value={money(sum.monthlyCashFlow)} icon={TrendingUp} accent="text-emerald-600" />
        <StatCard label="Gross Monthly Rent" value={money(sum.grossRent)} icon={Wallet} accent="text-blue-600" />
        <StatCard label="Rentals" value={sum.rentals} icon={Home} accent="text-sky-600" />
        <StatCard label="Notes Outstanding" value={money(sum.notesPrincipal)} icon={Banknote} accent="text-violet-600" sub={`${sum.notes} note${sum.notes === 1 ? "" : "s"}`} />
      </div>

      {db.investments.length === 0 ? (
        <EmptyState icon={Landmark} title="No investments yet" message="Add a rental property or a private note to start tracking passive income." action={<button className="btn btn-primary" onClick={() => setAddRental(true)}><Plus className="w-4 h-4" /> Add Rental</button>} />
      ) : (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2"><Home className="w-5 h-5 text-sky-600" /> Rentals</h2>
          {rentals.length === 0 ? <p className="text-sm text-slate-400 mb-6">No rentals yet.</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {rentals.map((r) => {
                const cf = rentalCashFlow(r);
                return (
                  <Link key={r.id} to={`/portfolio/${r.id}`} className="card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{r.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{fullAddress(r.address)}</p>
                      </div>
                      <Badge className={r.collectingIncome ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-slate-100 text-slate-500"}>{r.collectingIncome ? "Active" : "Vacant"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-500">Rent</p><p className="text-sm font-bold text-slate-900">{money(r.monthlyRent)}</p></div>
                      <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-500">Cash Flow</p><p className={cn("text-sm font-bold", cf >= 0 ? "text-emerald-600" : "text-red-600")}>{money(cf)}</p></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-violet-600" /> Private Notes</h2>
          {notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((n) => (
                <Link key={n.id} to={`/portfolio/${n.id}`} className="card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{n.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{n.borrowerName}</p>
                    </div>
                    <Badge className="bg-violet-50 text-violet-700 ring-1 ring-violet-600/20">{n.annualInterestRate}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-500">Principal</p><p className="text-sm font-bold text-slate-900">{money(n.loanAmount)}</p></div>
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-500">Monthly</p><p className="text-sm font-bold text-emerald-600">{money(n.monthlyPaymentAmount)}</p></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <RentalModal open={addRental} onClose={() => setAddRental(false)} />
      <NoteModal open={addNote} onClose={() => setAddNote(false)} />
    </div>
  );
}
