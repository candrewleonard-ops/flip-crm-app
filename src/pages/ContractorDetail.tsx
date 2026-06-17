import React from "react";
import { useParams } from "react-router-dom";
import { HardHat } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { useStore } from "../lib/store";

export function ContractorDetail() {
  const { id } = useParams();
  const { getContractor } = useStore();
  const c = id ? getContractor(id) : undefined;
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={HardHat} title={c?.name ?? "Contractor"} />
      <EmptyState icon={HardHat} title="Contractor detail is being built" />
    </div>
  );
}
