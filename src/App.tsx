import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Hammer } from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Contractors } from "./pages/Contractors";
import { ContractorDetail } from "./pages/ContractorDetail";
import { Invoices } from "./pages/Invoices";
import { Communications } from "./pages/Communications";
import { Portfolio } from "./pages/Portfolio";
import { PortfolioDetail } from "./pages/PortfolioDetail";
import { Settings } from "./pages/Settings";

function LoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useStore();
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="rounded-2xl bg-blue-600 p-3 shadow-lg shadow-blue-900/30 animate-scale-in">
          <Hammer className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm">Loading FlipCRM…</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <LoadingGate>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/contractors" element={<Contractors />} />
                <Route path="/contractors/:id" element={<ContractorDetail />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/communications" element={<Communications />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:id" element={<PortfolioDetail />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </LoadingGate>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
