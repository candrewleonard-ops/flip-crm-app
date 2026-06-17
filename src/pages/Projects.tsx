import React from "react";
import { Building2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function Projects() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={Building2} title="Projects" />
      <EmptyState icon={Building2} title="Projects view is being built" />
    </div>
  );
}
