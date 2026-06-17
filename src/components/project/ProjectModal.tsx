import React, { useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus, Folder } from "../../lib/types";
import { useStore } from "../../lib/store";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { PROJECT_STATUS_META } from "../../lib/labels";

interface Draft {
  name: string;
  street: string; city: string; state: string; zip: string;
  status: ProjectStatus;
  folderId: string;
  purchasePrice: number; estimatedARV: number; totalBudget: number; totalSpent: number;
  startDate: string; estimatedEndDate: string;
  scopeOfWork: string;
}

function draftFrom(p?: Project, defaultFolder?: string): Draft {
  return {
    name: p?.name ?? "",
    street: p?.address.street ?? "", city: p?.address.city ?? "", state: p?.address.state ?? "", zip: p?.address.zip ?? "",
    status: p?.status ?? "active",
    folderId: p?.folderId ?? defaultFolder ?? "",
    purchasePrice: p?.purchasePrice ?? 0, estimatedARV: p?.estimatedARV ?? 0,
    totalBudget: p?.totalBudget ?? 0, totalSpent: p?.totalSpent ?? 0,
    startDate: p?.startDate ?? "", estimatedEndDate: p?.estimatedEndDate ?? "",
    scopeOfWork: p?.scopeOfWork ?? "",
  };
}

/** Hierarchically-ordered folder options with indentation. */
export function flattenFolders(folders: Folder[]): { folder: Folder; depth: number }[] {
  const out: { folder: Folder; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    folders
      .filter((f) => (f.parentId ?? null) === parentId)
      .forEach((f) => {
        out.push({ folder: f, depth });
        walk(f.id, depth + 1);
      });
  };
  walk(null, 0);
  return out;
}

export function ProjectModal({
  open, onClose, project, defaultFolder, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
  defaultFolder?: string;
  onSaved?: (id: string) => void;
}) {
  const { db, addProject, updateProject, moveProjectToFolder } = useStore();
  const toast = useToast();
  const [d, setD] = useState<Draft>(draftFrom(project, defaultFolder));

  useEffect(() => {
    if (open) setD(draftFrom(project, defaultFolder ?? db.folders[0]?.id));
  }, [open, project, defaultFolder, db.folders]);

  const folderOptions = useMemo(() => flattenFolders(db.folders), [db.folders]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = () => {
    if (!d.name.trim()) return;
    const payload = {
      name: d.name.trim(),
      address: { street: d.street, city: d.city, state: d.state, zip: d.zip, lat: project?.address.lat ?? 0, lng: project?.address.lng ?? 0 },
      status: d.status,
      folderId: d.folderId,
      purchasePrice: Number(d.purchasePrice) || 0,
      estimatedARV: Number(d.estimatedARV) || 0,
      totalBudget: Number(d.totalBudget) || 0,
      totalSpent: Number(d.totalSpent) || 0,
      startDate: d.startDate,
      estimatedEndDate: d.estimatedEndDate,
      scopeOfWork: d.scopeOfWork,
    };
    if (project) {
      updateProject(project.id, payload);
      if (project.folderId !== d.folderId) moveProjectToFolder(project.id, d.folderId);
      toast.success("Project updated");
      onSaved?.(project.id);
    } else {
      const created = addProject(payload);
      toast.success("Project created");
      onSaved?.(created.id);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={project ? "Edit Project" : "New Project"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!d.name.trim()} onClick={save}>{project ? "Save changes" : "Create project"}</button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Project name</span>
          <input className="input mt-1" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Maple St Flip" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Street address</span>
          <input className="input mt-1" value={d.street} onChange={(e) => set("street", e.target.value)} placeholder="123 Main St" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">City</span>
          <input className="input mt-1" value={d.city} onChange={(e) => set("city", e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">State</span>
            <input className="input mt-1" value={d.state} onChange={(e) => set("state", e.target.value)} maxLength={2} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">ZIP</span>
            <input className="input mt-1" value={d.zip} onChange={(e) => set("zip", e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <select className="input mt-1" value={d.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
            {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map((s) => <option key={s} value={s}>{PROJECT_STATUS_META[s].label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Folder</span>
          <select className="input mt-1" value={d.folderId} onChange={(e) => set("folderId", e.target.value)}>
            {folderOptions.map(({ folder, depth }) => (
              <option key={folder.id} value={folder.id}>{`${"  ".repeat(depth)}${folder.name}`}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Purchase price</span>
          <input type="number" className="input mt-1" value={d.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Estimated ARV</span>
          <input type="number" className="input mt-1" value={d.estimatedARV} onChange={(e) => set("estimatedARV", Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Total budget</span>
          <input type="number" className="input mt-1" value={d.totalBudget} onChange={(e) => set("totalBudget", Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Total spent</span>
          <input type="number" className="input mt-1" value={d.totalSpent} onChange={(e) => set("totalSpent", Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Start date</span>
          <input type="date" className="input mt-1" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Est. completion</span>
          <input type="date" className="input mt-1" value={d.estimatedEndDate} onChange={(e) => set("estimatedEndDate", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Scope of work</span>
          <textarea className="input mt-1 resize-none" rows={3} value={d.scopeOfWork} onChange={(e) => set("scopeOfWork", e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
