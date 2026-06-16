"use client";

import { useState } from "react";
import {
  Shield, UserPlus, Users, Settings, Building2,
  Mail, Phone, Crown, Eye, Wrench, Trash2, Edit3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { cn, formatDate } from "@/lib/utils";
import { UserRole } from "@/lib/types";

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  admin: { label: "Admin", icon: Crown, color: "bg-amber-100 text-amber-700", description: "Full access to all features, user management, and billing" },
  project_manager: { label: "Project Manager", icon: Wrench, color: "bg-blue-100 text-blue-700", description: "Manage projects, contractors, invoices, and communications" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-slate-100 text-slate-600", description: "View-only access to projects and reports" },
};

export default function AdminPage() {
  const store = useStore();
  const toast = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("project_manager");

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin &amp; User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage users, roles, and organization settings</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Organization Info */}
      <div className="stat-card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{store.organization.name}</h2>
            <p className="text-sm text-slate-500">{store.organization.members.length} members &middot; Created {formatDate(store.organization.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]).map(([role, config]) => (
          <div key={role} className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.color)}>
                <config.icon size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">{config.label}</h3>
            </div>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="stat-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Phone</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Joined</th>
              <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.users.map((user) => {
              const role = roleConfig[user.role];
              const isCurrentUser = user.id === store.currentUser.id;
              return (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.name}
                          {isCurrentUser && <span className="text-xs text-blue-600 ml-1.5">(You)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" /> {user.email}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{user.phone}</td>
                  <td className="py-3 px-4">
                    <span className={cn("badge", role.color)}>
                      <role.icon size={10} className="mr-1" /> {role.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      {!isCurrentUser && (
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Twilio Configuration */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings size={18} className="text-slate-400" /> Twilio Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Account SID</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              type="password"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Auth Token</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              type="password"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Twilio Phone Number</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Webhook URL</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="https://yourapp.com/api/twilio/webhook"
              readOnly
              value="https://worktopcrm.com/api/twilio/webhook"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Save Configuration</button>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition">Test Connection</button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Configure your Twilio account to enable SMS and voice calling from the Communications hub. You&apos;ll need a Twilio account with a verified phone number.
        </p>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setShowAddUser(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Jane Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="jane@worktopcrm.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Phone</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+15551234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Role</label>
                <div className="space-y-2">
                  {(Object.entries(roleConfig) as [UserRole, typeof roleConfig[UserRole]][]).map(([role, config]) => (
                    <label
                      key={role}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer",
                        newRole === role ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={newRole === role}
                        onChange={() => setNewRole(role)}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{config.label}</p>
                        <p className="text-xs text-slate-400">{config.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setShowAddUser(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={() => {
                  if (!newName.trim() || !newEmail.trim()) {
                    toast.error("Name and email are required");
                    return;
                  }
                  store.addUser({
                    id: `u-${Date.now()}`,
                    name: newName.trim(),
                    email: newEmail.trim(),
                    phone: newPhone.trim(),
                    role: newRole,
                    organizationId: store.organization.id,
                    createdAt: new Date().toISOString().slice(0, 10),
                  });
                  toast.success(`Added ${newName.trim()}`);
                  setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole("project_manager");
                  setShowAddUser(false);
                }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-500/20">
                  <UserPlus size={14} className="inline mr-1" /> Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
