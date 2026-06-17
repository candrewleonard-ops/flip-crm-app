import React, { useState } from "react";
import { Settings as SettingsIcon, FolderOpen, Download, Upload, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { useStore } from "../lib/store";
import { useToast } from "../components/ui/Toast";
import { useConfirm, ConfirmDialog } from "../components/ui/ConfirmDialog";

export function Settings() {
  const { db, updateSettings, resetToSampleData, isDesktop } = useStore();
  const toast = useToast();
  const { state, confirm, close } = useConfirm();
  const [company, setCompany] = useState(db.settings.companyName);
  const [userName, setUserName] = useState(db.settings.userName);

  const saveProfile = () => {
    updateSettings({ companyName: company.trim() || "My Company", userName: userName.trim() });
    toast.success("Settings saved");
  };

  const openFolder = async () => {
    if (window.api) await window.api.backup.openDataFolder();
    else toast.info("Available in the desktop app");
  };
  const exportBackup = async () => {
    if (!window.api) return toast.info("Available in the desktop app");
    const res = await window.api.backup.export();
    if (res.ok) toast.success(`Backup saved to ${res.path}`);
    else if (res.message) toast.error(res.message);
  };
  const importBackup = async () => {
    if (!window.api) return toast.info("Available in the desktop app");
    confirm({
      title: "Restore from backup?",
      message: "This replaces your current data with the selected backup. This cannot be undone.",
      confirmLabel: "Choose backup…",
      danger: true,
      onConfirm: async () => {
        const res = await window.api!.backup.import();
        if (res.ok) {
          toast.success("Backup restored — reloading…");
          setTimeout(() => window.location.reload(), 700);
        } else if (res.message) toast.error(res.message);
      },
    });
  };

  const stats = [
    ["Projects", db.projects.length],
    ["Tasks", db.tasks.length],
    ["Contractors", db.contractors.length],
    ["Invoices", db.invoices.length],
    ["Expenses", db.expenses.length],
    ["Messages", db.communications.length],
    ["Investments", db.investments.length],
  ] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <PageHeader icon={SettingsIcon} title="Admin & Settings" subtitle="Company profile and local data management." />

      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-slate-900 mb-4">Company Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Company name</span>
            <input className="input mt-1" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Your display name</span>
            <input className="input mt-1" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </label>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary" onClick={saveProfile}>
            <Save className="w-4 h-4" /> Save profile
          </button>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-slate-900 mb-1">Data Management</h2>
        <p className="text-sm text-slate-500 mb-4">
          All data lives locally on this computer{isDesktop ? "" : " (browser preview: localStorage)"}. Real files
          (photos, PDFs, receipts) are stored on disk, not in the database.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <button className="btn btn-outline justify-start" onClick={openFolder}>
            <FolderOpen className="w-4 h-4 text-blue-600" /> Open data folder
          </button>
          <button className="btn btn-outline justify-start" onClick={exportBackup}>
            <Download className="w-4 h-4 text-emerald-600" /> Export backup
          </button>
          <button className="btn btn-outline justify-start" onClick={importBackup}>
            <Upload className="w-4 h-4 text-amber-600" /> Import backup
          </button>
          <button
            className="btn btn-outline justify-start"
            onClick={() =>
              confirm({
                title: "Reset to sample data?",
                message: "This erases all your data and restores the original demo content. This cannot be undone.",
                confirmLabel: "Reset everything",
                danger: true,
                onConfirm: () => {
                  resetToSampleData();
                  toast.success("Restored sample data");
                },
              })
            }
          >
            <RotateCcw className="w-4 h-4 text-red-600" /> Reset to sample data
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Database</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(([label, n]) => (
            <div key={label} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{n}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog state={state} onClose={close} />
    </div>
  );
}
