import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "WorkTop CRM — Run your projects from anywhere",
  description: "WorkTop CRM is a project, contractor, and invoice command center for builders, flippers, and operators.",
  icons: { icon: "/WorkTopLogo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex bg-slate-50">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
