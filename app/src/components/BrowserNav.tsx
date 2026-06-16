"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

export function BrowserNav() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-0.5 mr-3">
      <button
        onClick={() => router.back()}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        title="Back"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => router.forward()}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        title="Forward"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => router.refresh()}
        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        title="Refresh"
      >
        <RotateCw size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}
