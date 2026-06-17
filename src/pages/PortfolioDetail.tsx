import React from "react";
import { useParams } from "react-router-dom";
import { Landmark } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function PortfolioDetail() {
  const { id } = useParams();
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={Landmark} title="Investment" />
      <EmptyState icon={Landmark} title={`Detail for ${id ?? ""} is being built`} />
    </div>
  );
}
