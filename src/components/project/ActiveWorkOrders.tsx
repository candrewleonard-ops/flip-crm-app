import React, { useMemo, useState } from "react";
import { Hammer, Play, CalendarClock } from "lucide-react";
import type { Project, TaskItem } from "../../lib/types";
import { useStore } from "../../lib/store";
import { PRIORITY_RANK } from "../../lib/labels";
import { TaskCard } from "./TaskCard";
import { TaskEditorModal } from "./TaskEditorModal";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { useConfirm, ConfirmDialog } from "../ui/ConfirmDialog";
import { money } from "../../lib/utils";

function ts(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`).getTime();
  return isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

export function ActiveWorkOrders({ project, onOpenComms }: { project: Project; onOpenComms: () => void }) {
  const { getProjectTasks, deleteTask } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [editing, setEditing] = useState<TaskItem | null>(null);

  const orders = useMemo(() => {
    return getProjectTasks(project.id)
      .filter((t) => t.status === "in_progress" || t.status === "scheduled")
      .sort((a, b) => {
        const rank = (s: TaskItem["status"]) => (s === "in_progress" ? 0 : 1);
        if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
        if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        return ts(a.dueDate ?? a.scheduledDate) - ts(b.dueDate ?? b.scheduledDate);
      });
  }, [getProjectTasks, project.id]);

  const activeCount = orders.filter((t) => t.status === "in_progress").length;
  const scheduledCount = orders.filter((t) => t.status === "scheduled").length;
  const totalEst = orders.reduce((s, t) => s + t.estimatedCost, 0);

  const onDelete = (t: TaskItem) =>
    confirm({
      title: "Delete task?",
      message: `“${t.title}” will be removed.`,
      danger: true,
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteTask(t.id);
        toast.success("Task deleted");
      },
    });

  return (
    <div>
      <div className="card p-4 mb-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-50 p-2"><Play className="w-4 h-4 text-sky-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{activeCount}</p>
            <p className="text-xs text-slate-500">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-50 p-2"><CalendarClock className="w-4 h-4 text-amber-600" /></div>
          <div>
            <p className="text-xl font-bold text-slate-900">{scheduledCount}</p>
            <p className="text-xs text-slate-500">Scheduled</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <p className="text-xl font-bold text-slate-900">{money(totalEst)}</p>
          <p className="text-xs text-slate-500">Estimated cost in flight</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={Hammer} title="No active work orders" message="Tasks marked in-progress or scheduled show up here, ready to action." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {orders.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} onDelete={onDelete} onOpenComms={onOpenComms} />
          ))}
        </div>
      )}

      <TaskEditorModal open={!!editing} onClose={() => setEditing(null)} projectId={project.id} task={editing ?? undefined} subfolders={project.subfolders ?? []} />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}
