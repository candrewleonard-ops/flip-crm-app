import React from "react";
import { ImageIcon } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import { FileGallery } from "./FileGallery";

export function PhotosTab({ project }: { project: Project }) {
  const { updateProject } = useStore();
  return (
    <FileGallery
      projectId={project.id}
      files={project.photos}
      accept="media"
      variant="media"
      emptyIcon={ImageIcon}
      emptyText="No photos or videos yet"
      onAttach={(files) => updateProject(project.id, { photos: [...project.photos, ...files] })}
      onRemove={(f) => updateProject(project.id, { photos: project.photos.filter((p) => p.id !== f.id) })}
      onCaption={(f, caption) =>
        updateProject(project.id, { photos: project.photos.map((p) => (p.id === f.id ? { ...p, caption } : p)) })
      }
    />
  );
}
