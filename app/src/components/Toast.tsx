"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error = useCallback((m: string) => toast(m, "error"), [toast]);
  const info = useCallback((m: string) => toast(m, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] max-w-md slide-in",
              t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
              t.type === "error" && "bg-red-50 border-red-200 text-red-900",
              t.type === "info" && "bg-blue-50 border-blue-200 text-blue-900",
            )}>
            {t.type === "success" && <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />}
            {t.type === "error" && <AlertCircle size={18} className="text-red-600 flex-shrink-0" />}
            {t.type === "info" && <Info size={18} className="text-blue-600 flex-shrink-0" />}
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-current opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
