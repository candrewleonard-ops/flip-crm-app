import React from "react";
import { Landmark } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function Portfolio() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={Landmark} title="Passive Income Portfolio" />
      <EmptyState icon={Landmark} title="Portfolio view is being built" />
    </div>
  );
}
