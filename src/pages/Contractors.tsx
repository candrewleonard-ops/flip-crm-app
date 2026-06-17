import React from "react";
import { HardHat } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function Contractors() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={HardHat} title="Contractors" />
      <EmptyState icon={HardHat} title="Contractors view is being built" />
    </div>
  );
}
