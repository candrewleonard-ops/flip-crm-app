import React, { useMemo, useState } from "react";
import { Plus, LayoutList, Columns3, FolderPlus, Trash2, Wand2 } from "lucide-react";
import type { Project, TaskItem, TaskStatus } from "../../lib/types";
import { useStore } from "../../lib/store";
import { DEFAULT_TASKS } from "../../lib/catalogs";
import { TASK_STATUS_META, TASK_STATUS_ORDER, PRIORITY_RANK } from "../../lib/labels";
import { TaskCard } from "./TaskCard";
import { TaskEditorModal } from "./TaskEditorModal";
import { useToast } from "../ui/Toast";
import { useConfirm, ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { cn, money } from "../../lib/utils";

export function TasksTab({ project }: { project: Project }) {
  const {
    getProjectTasks, deleteTask, setTaskStatus, addProjectSubfolder, deleteProjectSubfolder,
    addTask, generateStandardWorkOrders, previewStandardWorkOrders,
  } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const tasks = getProjectTasks(project.id);

  const [view, setView] = useState<"list" | "kanban">("list");
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [quick, setQuick] = useState("");

  const quickAdd = () => {
    const title = quick.trim();
    if (!title) return;
    const tmpl = DEFAULT_TASKS.find((t) => t.title.toLowerCase() === title.toLowerCase());
    addTask({ projectId: project.id, title, category: tmpl?.category ?? "General" });
    setQuick("");
    toast.success("Task added");
  };

  const generate = () => {
    const { missing, projectedBudget } = previewStandardWorkOrders(project.id);
    if (missing === 0) {
      toast.info("All standard work orders already exist");
      return;
    }
    confirm({
      title: "Generate standard work orders?",
      message: `This adds ${missing} standard rehab task${missing === 1 ? "" : "s"} — each with its microtask checklist, a sequential schedule, and an auto-budget (flooring is priced from square footage). Projected total budget: ${money(projectedBudget)}. Existing tasks are left untouched.`,
      confirmLabel: `Generate ${missing}`,
      onConfirm: () => {
        const res = generateStandardWorkOrders(project.id);
        toast.success(`Added ${res.added} standard work orders`);
        toast.info(`Project budget set to ${money(res.budget)}`);
      },
    });
  };

  const subfolders = (project.subfolders ?? []).filter((s) => s.parent === "renovation");

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter)),
    [tasks, statusFilter]
  );

  const onDelete = (t: TaskItem) =>
    confirm({
      title: "Delete task?",
      message: `“${t.title}” and its checklist will be removed.`,
      danger: true,
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteTask(t.id);
        toast.success("Task deleted");
      },
    });

  const grouped = useMemo(() => {
    const groups: { id: string; name: string; tasks: TaskItem[] }[] = [];
    for (const sf of subfolders) {
      groups.push({ id: sf.id, name: sf.name, tasks: filtered.filter((t) => t.subfolderId === sf.id) });
    }
    groups.push({ id: "__none", name: subfolders.length ? "Ungrouped" : "All Tasks", tasks: filtered.filter((t) => !t.subfolderId || !subfolders.some((s) => s.id === t.subfolderId)) });
    return groups.filter((g) => g.tasks.length > 0 || g.id !== "__none");
  }, [filtered, subfolders]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select className="input py-1.5 text-sm w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}>
          <option value="all">All statuses</option>
          {TASK_STATUS_ORDER.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
        </select>
        <div className="inline-flex rounded-lg ring-1 ring-slate-200 overflow-hidden">
          <button onClick={() => setView("list")} className={cn("px-2.5 py-1.5 flex items-center gap-1 text-sm", view === "list" ? "bg-blue-600 text-white" : "bg-white text-slate-600")}>
            <LayoutList className="w-4 h-4" /> List
          </button>
          <button onClick={() => setView("kanban")} className={cn("px-2.5 py-1.5 flex items-center gap-1 text-sm", view === "kanban" ? "bg-blue-600 text-white" : "bg-white text-slate-600")}>
            <Columns3 className="w-4 h-4" /> Board
          </button>
        </div>
        <button
          className="btn btn-outline text-sm"
          onClick={() => {
            const name = window.prompt("New subfolder name (e.g. Upstairs Bath)");
            if (name?.trim()) {
              addProjectSubfolder(project.id, name.trim(), "renovation");
              toast.success("Subfolder added");
            }
          }}
        >
          <FolderPlus className="w-4 h-4" /> Subfolder
        </button>
        <div className="flex-1" />
        <button className="btn btn-outline text-sm" onClick={generate}>
          <Wand2 className="w-4 h-4 text-blue-600" /> Generate standard work orders
        </button>
        <button className="btn btn-primary text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Quick add a task by title (e.g. Drywall Work)… auto-loads its checklist"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickAdd()}
        />
        <button className="btn btn-outline" onClick={quickAdd} disabled={!quick.trim()}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={LayoutList} title="No tasks yet" message="Add a task from a template to auto-load its microtask checklist." action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> New Task</button>} />
      ) : view === "list" ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.id}>
              {(subfolders.length > 0 || g.id !== "__none") && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">{g.name}</h3>
                  <span className="text-xs text-slate-400">{g.tasks.length}</span>
                  {g.id !== "__none" && (
                    <button
                      className="text-slate-300 hover:text-red-500"
                      title="Delete subfolder"
                      onClick={() =>
                        confirm({
                          title: "Delete subfolder?",
                          message: `Tasks in “${g.name}” will move to Ungrouped.`,
                          danger: true,
                          confirmLabel: "Delete",
                          onConfirm: () => deleteProjectSubfolder(project.id, g.id),
                        })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {g.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} onEdit={setEditing} onDelete={onDelete} />
                ))}
                {g.tasks.length === 0 && <p className="text-xs text-slate-400">No tasks here.</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {TASK_STATUS_ORDER.map((s) => {
            const col = filtered.filter((t) => t.status === s).sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
            return (
              <div
                key={s}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/task");
                  if (id) setTaskStatus(id, s);
                }}
                className="bg-slate-50 rounded-xl p-2 ring-1 ring-slate-100 min-h-32"
              >
                <div className="flex items-center gap-1.5 px-1 py-1.5 mb-1">
                  <span className={cn("w-2 h-2 rounded-full", TASK_STATUS_META[s].dot)} />
                  <h4 className="text-xs font-semibold text-slate-700">{TASK_STATUS_META[s].label}</h4>
                  <span className="text-xs text-slate-400">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onEdit={setEditing}
                      onDelete={onDelete}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskEditorModal open={creating} onClose={() => setCreating(false)} projectId={project.id} subfolders={project.subfolders ?? []} />
      <TaskEditorModal open={!!editing} onClose={() => setEditing(null)} projectId={project.id} task={editing ?? undefined} subfolders={project.subfolders ?? []} />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}
