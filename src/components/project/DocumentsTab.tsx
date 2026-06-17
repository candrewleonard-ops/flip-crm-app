import React from "react";
import { FileText } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import { FileGallery } from "./FileGallery";

export function DocumentsTab({ project }: { project: Project }) {
  const { updateProject } = useStore();
  return (
    <FileGallery
      projectId={project.id}
      files={project.documents}
      accept="doc"
      variant="documents"
      emptyIcon={FileText}
      emptyText="No documents yet"
      onAttach={(files) => updateProject(project.id, { documents: [...project.documents, ...files] })}
      onRemove={(f) => updateProject(project.id, { documents: project.documents.filter((p) => p.id !== f.id) })}
    />
  );
}
