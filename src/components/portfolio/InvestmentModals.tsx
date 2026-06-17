import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { RentalProperty, NoteInvestment, UtilityInfo } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";

export function newRental(): RentalProperty {
  const u = (): UtilityInfo => ({ tenantPays: true, monthlyCost: 0 });
  return {
    id: uuid(), type: "rental", name: "", collectingIncome: true,
    address: { street: "", city: "", state: "", zip: "", lat: 0, lng: 0 },
    photos: [],
    principal: 0, interest: 0, taxes: 0, insurance: 0, monthlyRent: 0,
    gas: u(), electric: u(), sewer: u(), water: u(), trash: u(),
    depositAmount: 0, leaseStartDate: "", leaseEndDate: "",
    tenantNames: "", numberOfOccupants: 0, tenantContactInfo: "",
    propertyManagerContact: "", propertyManagerFee: 0,
    electricProvider: "", electricAccount: "", waterProvider: "", waterAccount: "",
    gasProvider: "", gasAccount: "", sewerProvider: "", sewerAccount: "",
    trashProvider: "", trashAccount: "",
    workOrders: [],
    yearBuilt: "", squareFootage: "", bedrooms: "", bathrooms: "", lotSize: "", propertyType: "",
    acInstalled: "", roofInstalled: "", guttersInstalled: "", floorsInstalled: "",
    kitchenRemodeled: "", bathroomRemodeled: "", waterHeaterInstalled: "", furnaceInstalled: "",
    electricalUpdated: "", plumbingUpdated: "", foundationType: "", garageType: "",
    propertyNotes: "", createdAt: new Date().toISOString(),
  };
}

export function newNote(): NoteInvestment {
  return {
    id: uuid(), type: "note", name: "", collectingIncome: true,
    borrowerName: "", loanAmount: 0, dateLent: "", dateDue: "",
    monthlyPaymentDate: "", monthlyPaymentAmount: 0, annualInterestRate: 0,
    collateral: "", createdAt: new Date().toISOString(),
  };
}

const UTILS = ["electric", "water", "gas", "sewer", "trash"] as const;
const SPEC: { key: keyof RentalProperty; label: string }[] = [
  { key: "yearBuilt", label: "Year Built" }, { key: "squareFootage", label: "Sq Footage" },
  { key: "bedrooms", label: "Bedrooms" }, { key: "bathrooms", label: "Bathrooms" },
  { key: "lotSize", label: "Lot Size" }, { key: "propertyType", label: "Property Type" },
  { key: "foundationType", label: "Foundation" }, { key: "garageType", label: "Garage" },
  { key: "acInstalled", label: "A/C Installed" }, { key: "roofInstalled", label: "Roof Installed" },
  { key: "guttersInstalled", label: "Gutters" }, { key: "floorsInstalled", label: "Floors" },
  { key: "kitchenRemodeled", label: "Kitchen Remodel" }, { key: "bathroomRemodeled", label: "Bath Remodel" },
  { key: "waterHeaterInstalled", label: "Water Heater" }, { key: "furnaceInstalled", label: "Furnace" },
  { key: "electricalUpdated", label: "Electrical" }, { key: "plumbingUpdated", label: "Plumbing" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span>{children}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">{title}</h3>
      {children}
    </div>
  );
}

export function RentalModal({ open, onClose, rental, onSaved }: { open: boolean; onClose: () => void; rental?: RentalProperty; onSaved?: (id: string) => void; }) {
  const { addInvestment, updateInvestment } = useStore();
  const toast = useToast();
  const [d, setD] = useState<RentalProperty>(rental ?? newRental());

  useEffect(() => { if (open) setD(rental ? { ...rental } : newRental()); }, [open, rental]);

  const set = <K extends keyof RentalProperty>(k: K, v: RentalProperty[K]) => setD((p) => ({ ...p, [k]: v }));
  const setAddr = (k: keyof RentalProperty["address"], v: string) => setD((p) => ({ ...p, address: { ...p.address, [k]: v } }));
  const setUtil = (u: typeof UTILS[number], patch: Partial<UtilityInfo>) => setD((p) => ({ ...p, [u]: { ...p[u], ...patch } }));
  const num = (k: keyof RentalProperty) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);
  const str = (k: keyof RentalProperty) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never);

  const save = () => {
    if (!d.name.trim()) return;
    if (rental) { updateInvestment(rental.id, d); toast.success("Rental updated"); }
    else { addInvestment(d); toast.success("Rental added"); }
    onSaved?.(d.id);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="2xl" title={rental ? "Edit Rental" : "Add Rental Property"}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!d.name.trim()} onClick={save}>{rental ? "Save" : "Add"}</button></>}>
      <div className="space-y-5">
        <Section title="Property">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><input className="input mt-1" value={d.name} onChange={str("name")} placeholder="e.g. Maple St Duplex" /></Field>
            <Field label="Street"><input className="input mt-1" value={d.address.street} onChange={(e) => setAddr("street", e.target.value)} /></Field>
            <Field label="City"><input className="input mt-1" value={d.address.city} onChange={(e) => setAddr("city", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State"><input className="input mt-1" value={d.address.state} maxLength={2} onChange={(e) => setAddr("state", e.target.value)} /></Field>
              <Field label="ZIP"><input className="input mt-1" value={d.address.zip} onChange={(e) => setAddr("zip", e.target.value)} /></Field>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 mt-2"><input type="checkbox" checked={d.collectingIncome} onChange={(e) => set("collectingIncome", e.target.checked)} /> Currently collecting income</label>
        </Section>

        <Section title="Finances (PITI & Rent)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Monthly Rent"><input type="number" className="input mt-1" value={d.monthlyRent} onChange={num("monthlyRent")} /></Field>
            <Field label="Principal"><input type="number" className="input mt-1" value={d.principal} onChange={num("principal")} /></Field>
            <Field label="Interest"><input type="number" className="input mt-1" value={d.interest} onChange={num("interest")} /></Field>
            <Field label="Taxes"><input type="number" className="input mt-1" value={d.taxes} onChange={num("taxes")} /></Field>
            <Field label="Insurance"><input type="number" className="input mt-1" value={d.insurance} onChange={num("insurance")} /></Field>
            <Field label="Deposit Held"><input type="number" className="input mt-1" value={d.depositAmount} onChange={num("depositAmount")} /></Field>
          </div>
        </Section>

        <Section title="Utilities">
          <div className="space-y-2">
            {UTILS.map((u) => (
              <div key={u} className="grid grid-cols-[80px_auto_1fr_1fr] gap-2 items-center">
                <span className="text-sm font-medium text-slate-600 capitalize">{u}</span>
                <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={d[u].tenantPays} onChange={(e) => setUtil(u, { tenantPays: e.target.checked })} /> Tenant pays</label>
                <input type="number" className="input py-1.5 text-sm" placeholder="Monthly $ (if owner pays)" value={d[u].monthlyCost} onChange={(e) => setUtil(u, { monthlyCost: Number(e.target.value) })} disabled={d[u].tenantPays} />
                <input className="input py-1.5 text-sm" placeholder="Provider · Account" value={(d[`${u}Provider` as keyof RentalProperty] as string) ?? ""} onChange={(e) => set(`${u}Provider` as keyof RentalProperty, e.target.value as never)} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tenant & Lease">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tenant Names"><input className="input mt-1" value={d.tenantNames} onChange={str("tenantNames")} /></Field>
            <Field label="Occupants"><input type="number" className="input mt-1" value={d.numberOfOccupants} onChange={num("numberOfOccupants")} /></Field>
            <Field label="Lease Start"><input type="date" className="input mt-1" value={d.leaseStartDate} onChange={str("leaseStartDate")} /></Field>
            <Field label="Lease End"><input type="date" className="input mt-1" value={d.leaseEndDate} onChange={str("leaseEndDate")} /></Field>
            <Field label="Tenant Contact"><input className="input mt-1" value={d.tenantContactInfo} onChange={str("tenantContactInfo")} /></Field>
            <Field label="Property Manager"><input className="input mt-1" value={d.propertyManagerContact} onChange={str("propertyManagerContact")} /></Field>
            <Field label="PM Fee (monthly)"><input type="number" className="input mt-1" value={d.propertyManagerFee} onChange={num("propertyManagerFee")} /></Field>
          </div>
        </Section>

        <Section title="Property Spec Sheet">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SPEC.map((s) => (
              <Field key={String(s.key)} label={s.label}><input className="input mt-1" value={(d[s.key] as string) ?? ""} onChange={(e) => set(s.key, e.target.value as never)} /></Field>
            ))}
          </div>
        </Section>

        <Field label="Notes"><textarea className="input mt-1 resize-none" rows={2} value={d.propertyNotes} onChange={(e) => set("propertyNotes", e.target.value as never)} /></Field>
      </div>
    </Modal>
  );
}

export function NoteModal({ open, onClose, note, onSaved }: { open: boolean; onClose: () => void; note?: NoteInvestment; onSaved?: (id: string) => void; }) {
  const { addInvestment, updateInvestment } = useStore();
  const toast = useToast();
  const [d, setD] = useState<NoteInvestment>(note ?? newNote());

  useEffect(() => { if (open) setD(note ? { ...note } : newNote()); }, [open, note]);
  const set = <K extends keyof NoteInvestment>(k: K, v: NoteInvestment[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = () => {
    if (!d.name.trim()) return;
    if (note) { updateInvestment(note.id, d); toast.success("Note updated"); }
    else { addInvestment(d); toast.success("Note added"); }
    onSaved?.(d.id);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={note ? "Edit Private Note" : "Add Private Note"}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!d.name.trim()} onClick={save}>{note ? "Save" : "Add"}</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name / Label"><input className="input mt-1" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Henderson Bridge Loan" /></Field>
        <Field label="Borrower"><input className="input mt-1" value={d.borrowerName} onChange={(e) => set("borrowerName", e.target.value)} /></Field>
        <Field label="Loan Amount"><input type="number" className="input mt-1" value={d.loanAmount} onChange={(e) => set("loanAmount", Number(e.target.value))} /></Field>
        <Field label="Annual Interest Rate (%)"><input type="number" step="0.1" className="input mt-1" value={d.annualInterestRate} onChange={(e) => set("annualInterestRate", Number(e.target.value))} /></Field>
        <Field label="Date Lent"><input type="date" className="input mt-1" value={d.dateLent} onChange={(e) => set("dateLent", e.target.value)} /></Field>
        <Field label="Date Due"><input type="date" className="input mt-1" value={d.dateDue} onChange={(e) => set("dateDue", e.target.value)} /></Field>
        <Field label="Monthly Payment"><input type="number" className="input mt-1" value={d.monthlyPaymentAmount} onChange={(e) => set("monthlyPaymentAmount", Number(e.target.value))} /></Field>
        <Field label="Payment Date"><input className="input mt-1" value={d.monthlyPaymentDate} onChange={(e) => set("monthlyPaymentDate", e.target.value)} placeholder="e.g. 1st of month" /></Field>
        <label className="block sm:col-span-2"><span className="text-xs font-medium text-slate-600">Collateral</span><input className="input mt-1" value={d.collateral} onChange={(e) => set("collateral", e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2"><input type="checkbox" checked={d.collectingIncome} onChange={(e) => set("collectingIncome", e.target.checked)} /> Currently collecting payments</label>
      </div>
    </Modal>
  );
}
