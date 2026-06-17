import type { RentalProperty, NoteInvestment, Investment } from "./types";

export function rentalOwnerUtilities(r: RentalProperty): number {
  return [r.electric, r.water, r.gas, r.sewer, r.trash]
    .filter((u) => !u.tenantPays)
    .reduce((s, u) => s + (u.monthlyCost || 0), 0);
}

export function rentalPITI(r: RentalProperty): number {
  return r.principal + r.interest + r.taxes + r.insurance;
}

/** Net monthly cash flow for a rental. */
export function rentalCashFlow(r: RentalProperty): number {
  return r.monthlyRent - rentalPITI(r) - rentalOwnerUtilities(r) - (r.propertyManagerFee || 0);
}

export function isRental(i: Investment): i is RentalProperty {
  return i.type === "rental";
}
export function isNote(i: Investment): i is NoteInvestment {
  return i.type === "note";
}

export function portfolioSummary(investments: Investment[]) {
  let monthlyCashFlow = 0;
  let rentals = 0;
  let notes = 0;
  let notesPrincipal = 0;
  let grossRent = 0;
  for (const i of investments) {
    if (isRental(i)) {
      rentals++;
      grossRent += i.monthlyRent;
      if (i.collectingIncome) monthlyCashFlow += rentalCashFlow(i);
    } else {
      notes++;
      notesPrincipal += i.loanAmount;
      if (i.collectingIncome) monthlyCashFlow += i.monthlyPaymentAmount;
    }
  }
  return { monthlyCashFlow, rentals, notes, notesPrincipal, grossRent };
}
