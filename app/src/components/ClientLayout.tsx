"use client";

import { usePathname } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

const FULL_BLEED = ["/landingpage", "/signup", "/login"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (fullBleed) {
    return (
      <StoreProvider>
        <ToastProvider>{children}</ToastProvider>
      </StoreProvider>
    );
  }

  return (
    <StoreProvider>
      <ToastProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <TopBar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
