import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Plus, FolderPlus, Search, Pencil, Trash2, FolderTree, GripVertical,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { Project, Folder } from "../lib/types";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { MetaBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useConfirm, ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProjectModal } from "../components/project/ProjectModal";
import { PROJECT_STATUS_META } from "../lib/labels";
import { money, fullAddress, pct, cn } from "../lib/utils";

export function Projects() {
  const store = useStore();
  const { db, getChildFolders } = store;
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createFolder, setCreateFolder] = useState<string | undefined>(undefined);

  const roots = getChildFolders(null);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return db.projects.filter(
      (p) => p.name.toLowerCase().includes(q) || fullAddress(p.address).toLowerCase().includes(q)
    );
  }, [search, db.projects]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        icon={Building2}
        title="Projects"
        subtitle={`${db.projects.length} properties across ${db.folders.length} folders`}
        actions={
          <>
            <button
              className="btn btn-outline text-sm"
              onClick={() => {
                const name = window.prompt("New folder name");
                if (name?.trim()) {
                  store.addFolder({ name: name.trim() });
                  toast.success("Folder created");
                }
              }}
            >
              <FolderPlus className="w-4 h-4" /> New Folder
            </button>
            <button className="btn btn-primary text-sm" onClick={() => { setCreateFolder(undefined); setCreating(true); }}>
              <Plus className="w-4 h-4" /> New Project
            </button>
          </>
        }
      />

      <div className="relative mb-5 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="input pl-9" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {matches ? (
        matches.length === 0 ? (
          <EmptyState icon={Search} title="No matching projects" message={`Nothing matches “${search}”.`} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )
      ) : roots.length === 0 ? (
        <EmptyState icon={FolderTree} title="No folders yet" message="Create a folder to organize your flips." />
      ) : (
        <div className="space-y-5">
          {roots.map((f) => (
            <FolderSection
              key={f.id}
              folder={f}
              depth={0}
              onNewProject={(folderId) => { setCreateFolder(folderId); setCreating(true); }}
              confirm={confirm}
            />
          ))}
        </div>
      )}

      <ProjectModal open={creating} onClose={() => setCreating(false)} defaultFolder={createFolder} />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}

function FolderSection({
  folder, depth, onNewProject, confirm,
}: {
  folder: Folder;
  depth: number;
  onNewProject: (folderId: string) => void;
  confirm: ReturnType<typeof useConfirm>["confirm"];
}) {
  const store = useStore();
  const { db, getChildFolders, moveProjectToFolder, updateFolder, deleteFolder, addFolder } = store;
  const toast = useToast();
  const [dragOver, setDragOver] = useState(false);
  const children = getChildFolders(folder.id);
  const directProjects = db.projects.filter((p) => p.folderId === folder.id);

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false);
          const pid = e.dataTransfer.getData("text/project");
          if (pid) { moveProjectToFolder(pid, folder.id); toast.success("Moved to " + folder.name); }
        }}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-3 py-2 mb-3 transition-colors",
          dragOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-white ring-1 ring-slate-200"
        )}
      >
        <label className="relative cursor-pointer" title="Recolor">
          <span className="w-3.5 h-3.5 rounded-full block ring-2 ring-white shadow" style={{ background: folder.color }} />
          <input type="color" value={folder.color} onChange={(e) => updateFolder(folder.id, { color: e.target.value })} className="absolute inset-0 opacity-0 w-4 h-4 cursor-pointer" />
        </label>
        <h2 className="font-semibold text-slate-800">{folder.name}</h2>
        <span className="text-xs text-slate-400">{directProjects.length}</span>
        <div className="flex-1" />
        <button onClick={() => onNewProject(folder.id)} className="text-slate-400 hover:text-blue-600 p-1" title="New project here"><Plus className="w-4 h-4" /></button>
        <button onClick={() => { const n = window.prompt("Subfolder name"); if (n?.trim()) { addFolder({ name: n.trim(), parentId: folder.id }); toast.success("Subfolder added"); } }} className="text-slate-400 hover:text-blue-600 p-1" title="Add subfolder"><FolderPlus className="w-4 h-4" /></button>
        <button onClick={() => { const n = window.prompt("Rename folder", folder.name); if (n?.trim()) updateFolder(folder.id, { name: n.trim() }); }} className="text-slate-400 hover:text-slate-700 p-1" title="Rename"><Pencil className="w-4 h-4" /></button>
        <button
          onClick={() => confirm({ title: "Delete folder?", message: `Projects in “${folder.name}” move to another top folder. Subfolders are removed.`, danger: true, confirmLabel: "Delete", onConfirm: () => { deleteFolder(folder.id); toast.success("Folder deleted"); } })}
          className="text-slate-400 hover:text-red-600 p-1" title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {directProjects.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          {directProjects.map((p) => <ProjectCard key={p.id} project={p} draggable />)}
        </div>
      )}

      {children.map((c) => (
        <FolderSection key={c.id} folder={c} depth={depth + 1} onNewProject={onNewProject} confirm={confirm} />
      ))}
    </div>
  );
}

function ProjectCard({ project, draggable = false }: { project: Project; draggable?: boolean }) {
  const { getProjectTasks } = useStore();
  const over = project.totalSpent > project.totalBudget;
  const tasks = getProjectTasks(project.id);
  const activeWork = tasks.filter((t) => t.status === "in_progress" || t.status === "scheduled").length;

  return (
    <Link
      to={`/projects/${project.id}`}
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/project", project.id)}
      className="card p-4 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all block relative"
    >
      {draggable && <GripVertical className="w-4 h-4 text-slate-300 absolute top-3 right-3" />}
      <div className="flex items-start gap-2 pr-5">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
          <p className="text-xs text-slate-500 truncate">{fullAddress(project.address)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <MetaBadge meta={PROJECT_STATUS_META[project.status]} />
        {over && <span className="badge bg-red-50 text-red-700 ring-1 ring-red-600/20">OVER</span>}
        {activeWork > 0 && <span className="badge bg-sky-50 text-sky-700 ring-1 ring-sky-600/20">{activeWork} active</span>}
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{money(project.totalSpent)}</span>
          <span>{money(project.totalBudget)}</span>
        </div>
        <ProgressBar value={pct(project.totalSpent, project.totalBudget)} over={over} />
      </div>
    </Link>
  );
}
