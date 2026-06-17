import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  push(kind: ToastKind, message: string): void;
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};
const ACCENTS: Record<ToastKind, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-sky-600",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++counter.current;
      setItems((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), 3400);
    },
    [remove]
  );

  const api: ToastApi = {
    push,
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="card shadow-lg shadow-slate-900/10 px-3.5 py-3 flex items-start gap-3 animate-slide-up"
            >
              <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", ACCENTS[t.kind])} />
              <p className="text-sm text-slate-700 flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
