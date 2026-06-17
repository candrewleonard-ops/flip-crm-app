import React from "react";
import { ReceiptText } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function Invoices() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={ReceiptText} title="Invoices" />
      <EmptyState icon={ReceiptText} title="Invoices view is being built" />
    </div>
  );
}
