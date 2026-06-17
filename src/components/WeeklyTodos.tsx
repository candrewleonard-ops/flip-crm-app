import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ListTodo, Plus, EyeOff, Check } from "lucide-react";
import { useStore } from "../lib/store";

export function WeeklyTodos() {
  const { db, addWeeklyTodo, updateWeeklyTodo, deleteWeeklyTodo, getProject } = useStore();
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState(db.projects[0]?.id ?? "");

  const todos = db.weeklyTodos.filter((t) => !t.hiddenFromDashboard);

  const add = () => {
    if (!text.trim() || !projectId) return;
    addWeeklyTodo(projectId, text.trim());
    setText("");
  };

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-blue-600" /> This Week
      </h2>
      <div className="flex gap-2 mb-3">
        <select className="input py-1.5 text-sm w-32" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {db.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          className="input py-1.5 text-sm flex-1"
          placeholder="Add a to-do…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn btn-primary px-2.5 py-1.5" onClick={add} disabled={!text.trim()}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {todos.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">All clear for this week. 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((t) => {
            const proj = getProject(t.projectId);
            return (
              <li key={t.id} className="flex items-center gap-2 group">
                <button onClick={() => deleteWeeklyTodo(t.id)} className="w-5 h-5 rounded-md border border-slate-300 hover:bg-emerald-500 hover:border-emerald-500 flex items-center justify-center shrink-0 transition-colors" title="Mark done">
                  <Check className="w-3.5 h-3.5 text-transparent group-hover:text-white" />
                </button>
                <span className="text-sm text-slate-700 flex-1">{t.text}</span>
                {proj && <Link to={`/projects/${proj.id}`} className="text-xs text-slate-400 hover:text-blue-600 truncate max-w-28">{proj.name}</Link>}
                <button onClick={() => updateWeeklyTodo(t.id, { hiddenFromDashboard: true })} className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100" title="Hide from dashboard">
                  <EyeOff className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
