import React, { useState } from "react";
import { Box, FolderOpen, Trash2, RefreshCw, Plus } from "lucide-react";
import type { Project, ThreeDRender } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { FileDropzone, type DroppedFile } from "../ui/FileDropzone";

const DEFAULT_LABELS = ["Post Trashout", "50% Complete", "100% Complete"];

export function RendersTab({ project }: { project: Project }) {
  const store = useStore();
  const { updateProject } = store;
  const toast = useToast();
  const [customLabels, setCustomLabels] = useState<string[]>([]);

  const labels = Array.from(
    new Set([...DEFAULT_LABELS, ...project.renders.map((r) => r.label), ...customLabels])
  );

  const attach = async (label: string, dropped?: DroppedFile) => {
    let file = null;
    if (dropped) file = await store.files.importBase64(project.id, "image", dropped.base64, dropped.name);
    else {
      const arr = await store.files.pickAndImport(project.id, "image");
      file = arr[0] ?? null;
    }
    if (!file) return;
    const render: ThreeDRender = {
      id: file.id,
      label,
      relPath: file.relPath,
      mediaUrl: file.mediaUrl,
      capturedAt: new Date().toISOString(),
    };
    updateProject(project.id, { renders: [...project.renders.filter((r) => r.label !== label), render] });
    toast.success(`${label} render saved`);
  };

  const remove = async (r: ThreeDRender) => {
    await store.files.remove(r.relPath);
    updateProject(project.id, { renders: project.renders.filter((x) => x.label !== r.label) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Labeled before/after render slots for this property.</p>
        <button
          className="btn btn-outline text-sm"
          onClick={() => {
            const name = window.prompt("Render label (e.g. Exterior Concept)");
            if (name?.trim()) setCustomLabels((p) => [...p, name.trim()]);
          }}
        >
          <Plus className="w-4 h-4" /> Add slot
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labels.map((label) => {
          const render = project.renders.find((r) => r.label === label);
          return (
            <div key={label} className="card overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                {render && (
                  <div className="flex items-center gap-1">
                    {store.isDesktop && (
                      <button onClick={() => void store.files.reveal(render.relPath)} className="text-slate-400 hover:text-slate-700" title="Reveal">
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => void attach(label)} className="text-slate-400 hover:text-blue-600" title="Replace">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => void remove(render)} className="text-slate-400 hover:text-red-600" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {render ? (
                <img src={render.mediaUrl} alt={label} className="w-full aspect-video object-cover" />
              ) : (
                <div className="p-3">
                  <FileDropzone
                    compact
                    accept="image/*"
                    label="Add render"
                    hint="drop or browse an image"
                    onFiles={(files) => files[0] && void attach(label, files[0])}
                    onBrowse={store.isDesktop ? () => void attach(label) : undefined}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {labels.length === 0 && (
        <div className="text-center text-sm text-slate-400 py-10">
          <Box className="w-8 h-8 mx-auto mb-2 text-slate-300" /> No render slots.
        </div>
      )}
    </div>
  );
}
