import React from "react";
import { useParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { useStore } from "../lib/store";

export function ProjectDetail() {
  const { id } = useParams();
  const { getProject } = useStore();
  const project = id ? getProject(id) : undefined;
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader icon={Building2} title={project?.name ?? "Project"} />
      <EmptyState icon={Building2} title="Project detail is being built" />
    </div>
  );
}
