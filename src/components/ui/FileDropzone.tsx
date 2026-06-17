import React, { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DroppedFile {
  name: string;
  base64: string; // data URL
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Drag-and-drop zone. Dropped files are read to data URLs and handed to
 * `onFiles`. A "Browse" button triggers the native picker via `onBrowse`
 * (which should call window.api.files.pickAndImport on desktop).
 */
export function FileDropzone({
  onFiles,
  onBrowse,
  accept,
  label = "Drag files here",
  hint = "or click to browse",
  compact = false,
}: {
  onFiles: (files: DroppedFile[]) => void;
  onBrowse?: () => void;
  accept?: string;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const out: DroppedFile[] = [];
      for (const f of Array.from(fileList)) {
        out.push({ name: f.name, base64: await readAsDataURL(f) });
      }
      onFiles(out);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
      onClick={() => (onBrowse ? onBrowse() : inputRef.current?.click())}
      className={cn(
        "rounded-xl border-2 border-dashed cursor-pointer text-center transition-colors",
        compact ? "p-4" : "p-8",
        over ? "border-blue-400 bg-blue-50/60" : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <UploadCloud className={cn("mx-auto text-slate-400", compact ? "w-6 h-6" : "w-9 h-9")} />
      <p className={cn("font-medium text-slate-700", compact ? "text-sm mt-1.5" : "mt-3")}>{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
    </div>
  );
}
