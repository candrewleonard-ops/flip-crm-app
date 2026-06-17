import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

export interface ConfirmState {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="sm"
      title={state?.title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className={state?.danger ? "btn btn-danger" : "btn btn-primary"}
            onClick={() => {
              state?.onConfirm();
              onClose();
            }}
          >
            {state?.confirmLabel ?? "Confirm"}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {state?.danger && (
          <div className="rounded-full bg-red-50 p-2 ring-1 ring-red-100 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <p className="text-sm text-slate-600 leading-relaxed">{state?.message}</p>
      </div>
    </Modal>
  );
}

/** Small hook to manage a single confirm dialog per page. */
export function useConfirm() {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const confirm = React.useCallback((s: ConfirmState) => setState(s), []);
  const close = React.useCallback(() => setState(null), []);
  return { state, confirm, close };
}
