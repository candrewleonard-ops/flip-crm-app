import type { Invoice, Project, Contractor } from "./types";
import { INVOICE_TERMS } from "./catalogs";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function usd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

/** Build a print-ready HTML document for an invoice (used by printToPDF). */
export function renderInvoiceHtml(
  invoice: Invoice,
  project: Project | undefined,
  contractor: Contractor | undefined,
  companyName: string
): string {
  const rows = invoice.lineItems
    .map(
      (li) => `<tr>
        <td>${esc(li.description)}<div class="muted">${esc(li.category)}${li.subcategory ? " · " + esc(li.subcategory) : ""}</div></td>
        <td class="r">${li.quantity}</td>
        <td class="r">${usd(li.unitPrice)}</td>
        <td class="r">${usd(li.total)}</td>
      </tr>`
    )
    .join("");

  const milestone = (label: string, amount: number, paid: boolean) =>
    `<div class="ms ${paid ? "paid" : ""}"><div class="msl">${label}</div><div class="msa">${usd(amount)}</div><div class="msp">${paid ? "PAID" : "Due"}</div></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 40px; font-size: 13px; }
  h1 { font-size: 26px; margin: 0; color: #2563eb; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
  .muted { color: #64748b; font-size: 11px; }
  .grid2 { display: flex; gap: 40px; margin-bottom: 20px; }
  .lbl { text-transform: uppercase; font-size: 10px; letter-spacing: .05em; color: #94a3b8; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; background: #f1f5f9; padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase; }
  td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .r { text-align: right; }
  .tot { display: flex; justify-content: flex-end; margin-top: 12px; }
  .tot .box { width: 240px; }
  .tot .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .tot .grand { border-top: 2px solid #0f172a; font-weight: 700; font-size: 16px; padding-top: 8px; }
  .ms-wrap { display: flex; gap: 10px; margin: 20px 0; }
  .ms { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
  .ms.paid { background: #ecfdf5; border-color: #a7f3d0; }
  .msl { font-size: 11px; color: #64748b; }
  .msa { font-size: 16px; font-weight: 700; margin: 4px 0; }
  .msp { font-size: 10px; font-weight: 700; color: #64748b; }
  .ms.paid .msp { color: #059669; }
  .terms { white-space: pre-wrap; font-size: 10px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 22px; line-height: 1.5; }
  </style></head><body>
    <div class="head">
      <div><h1>${esc(companyName)}</h1><div class="muted">Fix &amp; Flip Contractor Invoice</div></div>
      <div style="text-align:right"><div class="lbl">Invoice Date</div><div>${new Date(invoice.createdAt).toLocaleDateString()}</div></div>
    </div>
    <div class="grid2">
      <div><div class="lbl">Contractor</div><div><strong>${esc(contractor?.name ?? "—")}</strong></div><div class="muted">${esc(contractor?.company ?? "")}</div><div class="muted">${esc(contractor?.email ?? "")} ${esc(contractor?.phone ?? "")}</div></div>
      <div><div class="lbl">Project</div><div><strong>${esc(project?.name ?? "—")}</strong></div><div class="muted">${project ? esc(`${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zip}`) : ""}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="muted">No line items</td></tr>'}</tbody></table>
    <div class="tot"><div class="box"><div class="row grand"><span>Total</span><span>${usd(invoice.subtotal)}</span></div></div></div>
    <div class="ms-wrap">
      ${milestone("Deposit (25%)", invoice.depositAmount, invoice.depositPaid)}
      ${milestone("Midpoint (25%)", invoice.midpointAmount, invoice.midpointPaid)}
      ${milestone("Completion (50%)", invoice.completionAmount, invoice.completionPaid)}
    </div>
    <div class="terms">${esc(invoice.terms || INVOICE_TERMS)}</div>
  </body></html>`;
}
