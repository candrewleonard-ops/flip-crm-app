import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Landmark, Home, FileText, Plus, CheckCircle2,
  Circle, Wrench, ImageIcon,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { RentalProperty, WorkOrder } from "../lib/types";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useConfirm, ConfirmDialog } from "../components/ui/ConfirmDialog";
import { FileGallery } from "../components/project/FileGallery";
import { RentalModal, NoteModal } from "../components/portfolio/InvestmentModals";
import { isRental, rentalCashFlow, rentalPITI, rentalOwnerUtilities } from "../lib/portfolio";
import { money, fullAddress, formatDate, cn } from "../lib/utils";

const SPEC_VIEW: { key: keyof RentalProperty; label: string }[] = [
  { key: "yearBuilt", label: "Year Built" }, { key: "squareFootage", label: "Sq Footage" },
  { key: "bedrooms", label: "Beds" }, { key: "bathrooms", label: "Baths" },
  { key: "lotSize", label: "Lot Size" }, { key: "propertyType", label: "Type" },
  { key: "foundationType", label: "Foundation" }, { key: "garageType", label: "Garage" },
  { key: "acInstalled", label: "A/C" }, { key: "roofInstalled", label: "Roof" },
  { key: "guttersInstalled", label: "Gutters" }, { key: "floorsInstalled", label: "Floors" },
  { key: "kitchenRemodeled", label: "Kitchen" }, { key: "bathroomRemodeled", label: "Bath" },
  { key: "waterHeaterInstalled", label: "Water Heater" }, { key: "furnaceInstalled", label: "Furnace" },
  { key: "electricalUpdated", label: "Electrical" }, { key: "plumbingUpdated", label: "Plumbing" },
];

export function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, updateInvestment, deleteInvestment } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [editing, setEditing] = useState(false);

  const inv = db.investments.find((i) => i.id === id);
  if (!inv) {
    return <div className="p-6"><EmptyState icon={Landmark} title="Investment not found" action={<Link to="/portfolio" className="btn btn-primary">Back</Link>} /></div>;
  }

  const del = () =>
    confirm({ title: "Delete investment?", message: `“${inv.name}” will be removed.`, danger: true, confirmLabel: "Delete", onConfirm: () => { deleteInvestment(inv.id); toast.success("Deleted"); navigate("/portfolio"); } });

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"><ArrowLeft className="w-4 h-4" /> Portfolio</Link>

      {isRental(inv) ? <RentalView rental={inv} onEdit={() => setEditing(true)} onDelete={del} update={(p) => updateInvestment(inv.id, p)} /> : (
        <NoteView note={inv} onEdit={() => setEditing(true)} onDelete={del} />
      )}

      {isRental(inv) ? <RentalModal open={editing} onClose={() => setEditing(false)} rental={inv} /> : <NoteModal open={editing} onClose={() => setEditing(false)} note={inv} />}
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}

function RentalView({ rental, onEdit, onDelete, update }: { rental: RentalProperty; onEdit: () => void; onDelete: () => void; update: (p: Partial<RentalProperty>) => void; }) {
  const cf = rentalCashFlow(rental);
  const utils = [
    { label: "Electric", u: rental.electric, p: rental.electricProvider, a: rental.electricAccount },
    { label: "Water", u: rental.water, p: rental.waterProvider, a: rental.waterAccount },
    { label: "Gas", u: rental.gas, p: rental.gasProvider, a: rental.gasAccount },
    { label: "Sewer", u: rental.sewer, p: rental.sewerProvider, a: rental.sewerAccount },
    { label: "Trash", u: rental.trash, p: rental.trashProvider, a: rental.trashAccount },
  ];

  const [woDesc, setWoDesc] = useState("");
  const [woCost, setWoCost] = useState(0);

  const addWo = () => {
    if (!woDesc.trim()) return;
    const wo: WorkOrder = { id: `wo_${Date.now().toString(36)}`, description: woDesc.trim(), cost: Number(woCost) || 0, date: new Date().toISOString().slice(0, 10), status: "open" };
    update({ workOrders: [wo, ...rental.workOrders] });
    setWoDesc(""); setWoCost(0);
  };
  const toggleWo = (wid: string) => update({ workOrders: rental.workOrders.map((w) => (w.id === wid ? { ...w, status: w.status === "open" ? "completed" : "open" } : w)) });
  const delWo = (wid: string) => update({ workOrders: rental.workOrders.filter((w) => w.id !== wid) });

  return (
    <>
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-3"><Home className="w-6 h-6 text-sky-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{rental.name}</h1>
              <p className="text-sm text-slate-500">{fullAddress(rental.address)}</p>
            </div>
            <Badge className={rental.collectingIncome ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-slate-100 text-slate-500"}>{rental.collectingIncome ? "Collecting income" : "Vacant"}</Badge>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline text-sm" onClick={onEdit}><Pencil className="w-4 h-4" /> Edit</button>
            <button className="btn btn-outline text-sm text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            ["Monthly Rent", money(rental.monthlyRent), "text-slate-900"],
            ["PITI", money(rentalPITI(rental)), "text-slate-900"],
            ["Owner Utilities", money(rentalOwnerUtilities(rental)), "text-slate-900"],
            ["Net Cash Flow", money(cf), cf >= 0 ? "text-emerald-600" : "text-red-600"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">{l}</p><p className={cn("text-lg font-bold", c)}>{v}</p></div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3">PITI Breakdown</h2>
          <dl className="space-y-2 text-sm">
            {[["Principal", rental.principal], ["Interest", rental.interest], ["Taxes", rental.taxes], ["Insurance", rental.insurance]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between"><dt className="text-slate-500">{l}</dt><dd className="font-medium">{money(v as number)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="font-semibold text-slate-700">Total PITI</dt><dd className="font-bold">{money(rentalPITI(rental))}</dd></div>
          </dl>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Lease & Tenant</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Tenant", rental.tenantNames || "—"], ["Occupants", String(rental.numberOfOccupants || "—")],
              ["Lease", `${formatDate(rental.leaseStartDate)} → ${formatDate(rental.leaseEndDate)}`],
              ["Deposit Held", money(rental.depositAmount)], ["Contact", rental.tenantContactInfo || "—"],
              ["Property Mgr", rental.propertyManagerContact || "Self-managed"], ["PM Fee", money(rental.propertyManagerFee)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-3"><dt className="text-slate-500 shrink-0">{l}</dt><dd className="font-medium text-right truncate">{v}</dd></div>
            ))}
          </dl>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-3">Utilities</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="text-left py-1">Utility</th><th className="text-left py-1">Responsible</th><th className="text-right py-1">Owner Cost</th><th className="text-left py-1 pl-4">Provider</th><th className="text-left py-1">Account</th></tr></thead>
            <tbody>
              {utils.map((x) => (
                <tr key={x.label} className="border-t border-slate-100">
                  <td className="py-1.5 font-medium text-slate-700">{x.label}</td>
                  <td className="py-1.5">{x.u.tenantPays ? <span className="text-emerald-600">Tenant</span> : <span className="text-slate-600">Owner</span>}</td>
                  <td className="py-1.5 text-right">{x.u.tenantPays ? "—" : money(x.u.monthlyCost)}</td>
                  <td className="py-1.5 pl-4 text-slate-600">{x.p || "—"}</td>
                  <td className="py-1.5 text-slate-500">{x.a || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-3">Property Spec Sheet</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPEC_VIEW.map((s) => (
              <div key={String(s.key)} className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-500">{s.label}</p><p className="text-sm font-medium text-slate-800 truncate">{(rental[s.key] as string) || "—"}</p></div>
            ))}
          </div>
          {rental.propertyNotes && <p className="text-sm text-slate-600 mt-3 bg-amber-50 rounded-lg p-3">{rental.propertyNotes}</p>}
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-500" /> Work Orders</h2>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" placeholder="Describe a repair / work order…" value={woDesc} onChange={(e) => setWoDesc(e.target.value)} />
            <input type="number" className="input w-28" placeholder="Cost" value={woCost} onChange={(e) => setWoCost(Number(e.target.value))} />
            <button className="btn btn-primary" onClick={addWo} disabled={!woDesc.trim()}><Plus className="w-4 h-4" /> Add</button>
          </div>
          {rental.workOrders.length === 0 ? <p className="text-sm text-slate-400">No work orders.</p> : (
            <div className="space-y-1.5">
              {rental.workOrders.map((w) => (
                <div key={w.id} className="flex items-center gap-2 rounded-lg ring-1 ring-slate-200 px-3 py-2">
                  <button onClick={() => toggleWo(w.id)}>{w.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}</button>
                  <span className={cn("flex-1 text-sm", w.status === "completed" && "line-through text-slate-400")}>{w.description}</span>
                  <span className="text-xs text-slate-500">{formatDate(w.date)}</span>
                  <span className="text-sm font-medium">{money(w.cost)}</span>
                  <button onClick={() => delWo(w.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-slate-500" /> Photos</h2>
          <FileGallery
            projectId={rental.id}
            files={rental.photos}
            accept="media"
            variant="media"
            emptyIcon={ImageIcon}
            emptyText="No photos yet"
            onAttach={(files) => update({ photos: [...rental.photos, ...files] })}
            onRemove={(f) => update({ photos: rental.photos.filter((p) => p.id !== f.id) })}
          />
        </div>
      </div>
    </>
  );
}

function NoteView({ note, onEdit, onDelete }: { note: import("../lib/types").NoteInvestment; onEdit: () => void; onDelete: () => void; }) {
  return (
    <>
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-3"><FileText className="w-6 h-6 text-violet-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{note.name}</h1>
              <p className="text-sm text-slate-500">Borrower: {note.borrowerName}</p>
            </div>
            <Badge className={note.collectingIncome ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-slate-100 text-slate-500"}>{note.collectingIncome ? "Performing" : "Paused"}</Badge>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline text-sm" onClick={onEdit}><Pencil className="w-4 h-4" /> Edit</button>
            <button className="btn btn-outline text-sm text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            ["Loan Amount", money(note.loanAmount)],
            ["Annual Interest Rate", `${note.annualInterestRate}%`],
            ["Monthly Payment", money(note.monthlyPaymentAmount)],
            ["Payment Date", note.monthlyPaymentDate || "—"],
            ["Date Lent", formatDate(note.dateLent)],
            ["Date Due", formatDate(note.dateDue)],
            ["Collateral", note.collateral || "—"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{l}</dt><dd className="font-medium text-right">{v}</dd></div>
          ))}
        </dl>
      </div>
    </>
  );
}
