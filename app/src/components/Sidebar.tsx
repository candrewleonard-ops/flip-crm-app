"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, HardHat, FileText,
  MessageSquare, Settings, Phone, UserPlus, Landmark, AlertTriangle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, signOut } from "@/lib/useUser";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/portfolio", label: "Passive Income Portfolio", icon: Landmark },
  { href: "/contractors", label: "Contractors", icon: HardHat },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/communications", label: "Hot Tasks & Comms", icon: AlertTriangle },
  { href: "/admin", label: "Admin / Users", icon: Settings },
  { href: "/contact", label: "Contact Us", icon: Phone },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (pathname === "/signup" || pathname === "/login" || pathname === "/landingpage") return null;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200 flex flex-col z-30">
      <Link href="/" className="h-20 flex items-center gap-3 px-4 border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
        <Image
          src="/WorkTopLogo.svg"
          alt="WorkTop CRM"
          width={44}
          height={44}
          priority
          className="rounded-lg bg-white/5 p-1"
        />
        <div className="leading-tight">
          <p className="font-bold text-sm text-white">
            Work<span className="text-blue-400">Top</span>
          </p>
          <p className="text-[10px] text-slate-400 tracking-[0.18em] uppercase">CRM</p>
        </div>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-auto">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn("relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-600/20 text-blue-300 shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />}
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link href="/signup" className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <UserPlus size={16} /> Sign Up / Log In
          </Link>
        )}
      </div>
    </aside>
  );
}
