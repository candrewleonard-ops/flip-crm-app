import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, Trash2, FileText, FileType, File as FileIcon, Play, X } from "lucide-react";
import type { StoredFile, FileAccept } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { FileDropzone, type DroppedFile } from "../ui/FileDropzone";
import { EmptyState } from "../ui/EmptyState";
import { fileKindFromName, bytes, cn } from "../../lib/utils";

const ACCEPT_ATTR: Record<FileAccept, string> = {
  image: "image/*",
  video: "video/*",
  media: "image/*,video/*",
  pdf: ".pdf",
  doc: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf",
  all: "*",
};

function DocIcon({ kind }: { kind: StoredFile["kind"] }) {
  if (kind === "pdf") return <FileType className="w-5 h-5 text-red-500" />;
  if (kind === "doc") return <FileText className="w-5 h-5 text-blue-500" />;
  return <FileIcon className="w-5 h-5 text-slate-400" />;
}

export function FileGallery({
  projectId,
  files,
  accept,
  variant,
  onAttach,
  onRemove,
  onCaption,
  emptyIcon,
  emptyText = "No files yet.",
}: {
  projectId: string;
  files: StoredFile[];
  accept: FileAccept;
  variant: "media" | "documents";
  onAttach: (files: StoredFile[]) => void;
  onRemove: (file: StoredFile) => void;
  onCaption?: (file: StoredFile, caption: string) => void;
  emptyIcon?: React.ElementType;
  emptyText?: string;
}) {
  const store = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<StoredFile | null>(null);

  const handleDropped = async (dropped: DroppedFile[]) => {
    setBusy(true);
    try {
      const imported: StoredFile[] = [];
      for (const d of dropped) {
        const kind = fileKindFromName(d.name);
        const f = await store.files.importBase64(projectId, kind, d.base64, d.name);
        if (f) imported.push(f);
      }
      if (imported.length) {
        onAttach(imported);
        toast.success(`Imported ${imported.length} file${imported.length === 1 ? "" : "s"}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBrowse = async () => {
    setBusy(true);
    try {
      const imported = await store.files.pickAndImport(projectId, accept);
      if (imported.length) {
        onAttach(imported);
        toast.success(`Imported ${imported.length} file${imported.length === 1 ? "" : "s"}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (f: StoredFile) => {
    await store.files.remove(f.relPath);
    onRemove(f);
    toast.success("File removed");
  };

  return (
    <div className="space-y-4">
      <FileDropzone
        onFiles={handleDropped}
        onBrowse={store.isDesktop ? handleBrowse : undefined}
        accept={ACCEPT_ATTR[accept]}
        compact
        label={busy ? "Importing…" : variant === "media" ? "Drop photos or videos" : "Drop documents"}
        hint={store.isDesktop ? "or click to browse files" : "or click to choose files"}
      />

      {files.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyText} />
      ) : variant === "media" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.id} className="group card overflow-hidden">
              <div
                className="relative aspect-[4/3] bg-slate-100 cursor-pointer flex items-center justify-center overflow-hidden"
                onClick={() => f.kind === "image" && setLightbox(f)}
              >
                {f.kind === "image" ? (
                  <img src={f.mediaUrl} alt={f.caption ?? f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : f.kind === "video" ? (
                  <>
                    <video src={f.mediaUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="w-8 h-8 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <DocIcon kind={f.kind} />
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {store.isDesktop && (
                    <button onClick={(e) => { e.stopPropagation(); void store.files.reveal(f.relPath); }} className="bg-white/90 rounded-md p-1 text-slate-600 hover:text-slate-900" title="Reveal in Explorer">
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); void removeFile(f); }} className="bg-white/90 rounded-md p-1 text-red-500 hover:text-red-700" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {onCaption ? (
                <input
                  defaultValue={f.caption ?? ""}
                  onBlur={(e) => onCaption(f, e.target.value)}
                  placeholder="Add caption…"
                  className="w-full text-xs px-2 py-1.5 outline-none border-t border-slate-100 text-slate-600"
                />
              ) : (
                <p className="text-xs px-2 py-1.5 text-slate-500 truncate border-t border-slate-100">{f.name}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <DocIcon kind={f.kind} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                <p className="text-xs text-slate-500">{bytes(f.size)} · added {new Date(f.addedAt).toLocaleDateString()}</p>
              </div>
              {store.isDesktop && (
                <button onClick={() => void store.files.reveal(f.relPath)} className="btn btn-ghost text-xs py-1" title="Open / reveal">
                  <FolderOpen className="w-4 h-4" /> Open
                </button>
              )}
              <button onClick={() => void removeFile(f)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightbox &&
        createPortal(
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-6 bg-black/80 animate-fade-in" onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
              <X className="w-7 h-7" />
            </button>
            <img src={lightbox.mediaUrl} alt={lightbox.caption ?? lightbox.name} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain" />
          </div>,
          document.body
        )}
    </div>
  );
}
