import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Hammer, Wrench, FolderKanban,
  ListChecks, MessagesSquare, HardHat, Image as ImageIcon, Box,
  ClipboardList, Receipt, ReceiptText, FileText,
} from "lucide-react";
import { useStore } from "../lib/store";
import { MetaBadge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useConfirm, ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PROJECT_STATUS_META, TASK_STATUS_META } from "../lib/labels";
import { money, fullAddress, cn, pct } from "../lib/utils";
import { CommunicationsHub } from "../components/CommunicationsHub";
import { ActiveWorkOrders } from "../components/project/ActiveWorkOrders";
import { TasksTab } from "../components/project/TasksTab";
import { ContractorsTab } from "../components/project/ContractorsTab";
import { PhotosTab } from "../components/project/PhotosTab";
import { RendersTab } from "../components/project/RendersTab";
import { VitalInfoTab } from "../components/project/VitalInfoTab";
import { ExpensesTab } from "../components/project/ExpensesTab";
import { InvoicesTab } from "../components/project/InvoicesTab";
import { DocumentsTab } from "../components/project/DocumentsTab";
import { ProjectModal } from "../components/project/ProjectModal";

type MainFolder = "renovation" | "information";
interface SubTab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const RENO_TABS: SubTab[] = [
  { id: "active", label: "Active Work Orders", icon: Hammer },
  { id: "tasks", label: "Tasks & Work Orders", icon: ListChecks },
  { id: "comms", label: "Communications", icon: MessagesSquare },
  { id: "crew", label: "Contractors", icon: HardHat },
  { id: "media", label: "Photos & Videos", icon: ImageIcon },
  { id: "renders", label: "3D Renders", icon: Box },
];
const INFO_TABS: SubTab[] = [
  { id: "vital", label: "Vital Information", icon: ClipboardList },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "media", label: "Photos & Videos", icon: ImageIcon },
];

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProject, getProjectTasks, deleteProject } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [folder, setFolder] = useState<MainFolder>("renovation");
  const [sub, setSub] = useState("active");
  const [editing, setEditing] = useState(false);

  const project = id ? getProject(id) : undefined;
  const tasks = useMemo(() => (project ? getProjectTasks(project.id) : []), [project, getProjectTasks]);

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState icon={FolderKanban} title="Project not found" message="It may have been deleted." action={<Link to="/projects" className="btn btn-primary">Back to Projects</Link>} />
      </div>
    );
  }

  const over = project.totalSpent > project.totalBudget;
  const remaining = project.totalBudget - project.totalSpent;
  const tabs = folder === "renovation" ? RENO_TABS : INFO_TABS;
  const statusStrip = (["in_progress", "scheduled", "blocked", "completed"] as const).map((s) => ({
    s,
    count: tasks.filter((t) => t.status === s).length,
  }));

  const switchFolder = (f: MainFolder) => {
    setFolder(f);
    setSub(f === "renovation" ? "active" : "vital");
  };

  const renderPanel = () => {
    const key = `${folder}-${sub}`;
    switch (key) {
      case "renovation-active": return <ActiveWorkOrders project={project} onOpenComms={() => setSub("comms")} />;
      case "renovation-tasks": return <TasksTab project={project} />;
      case "renovation-comms": return <CommunicationsHub scope={project.id} embedded />;
      case "renovation-crew": return <ContractorsTab project={project} />;
      case "renovation-media": return <PhotosTab project={project} />;
      case "renovation-renders": return <RendersTab project={project} />;
      case "information-vital": return <VitalInfoTab project={project} />;
      case "information-expenses": return <ExpensesTab project={project} />;
      case "information-invoices": return <InvoicesTab project={project} />;
      case "information-documents": return <DocumentsTab project={project} />;
      case "information-media": return <PhotosTab project={project} />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> All Projects
      </Link>

      {/* Header */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <MetaBadge meta={PROJECT_STATUS_META[project.status]} />
              {over && <span className="badge bg-red-50 text-red-700 ring-1 ring-red-600/20 heat-pulse">OVER BUDGET</span>}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{fullAddress(project.address)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline text-sm" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /> Edit</button>
            <button
              className="btn btn-outline text-sm text-red-600"
              onClick={() => confirm({ title: "Delete project?", message: `“${project.name}” and all its tasks, expenses, invoices and messages will be removed.`, danger: true, confirmLabel: "Delete project", onConfirm: () => { deleteProject(project.id); toast.success("Project deleted"); navigate("/projects"); } })}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            ["Total Budget", money(project.totalBudget), "text-slate-900"],
            ["Total Spent", money(project.totalSpent), over ? "text-red-600" : "text-slate-900"],
            ["Remaining", money(remaining), remaining < 0 ? "text-red-600" : "text-emerald-600"],
            ["Est. ARV", money(project.estimatedARV), "text-slate-900"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={cn("text-lg font-bold", color)}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <ProgressBar value={pct(project.totalSpent, project.totalBudget)} over={over} height="h-2.5" />
        </div>

        {project.scopeOfWork && <p className="text-sm text-slate-600 mt-4 leading-relaxed">{project.scopeOfWork}</p>}

        {/* Status strip */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {statusStrip.map(({ s, count }) => (
            <span key={s} className={cn("badge", TASK_STATUS_META[s].badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", TASK_STATUS_META[s].dot)} />
              {count} {TASK_STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Main folders */}
      <div className="flex gap-2 mb-4">
        {([
          ["renovation", "Renovation & Reconstruction", Wrench],
          ["information", "Project Information", FolderKanban],
        ] as const).map(([f, label, Icon]) => (
          <button
            key={f}
            onClick={() => switchFolder(f)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm transition-all ring-1",
              folder === f ? "bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/10" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              sub === t.id ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="animate-fade-in" key={`${folder}-${sub}`}>{renderPanel()}</div>

      <ProjectModal open={editing} onClose={() => setEditing(false)} project={project} />
      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}
