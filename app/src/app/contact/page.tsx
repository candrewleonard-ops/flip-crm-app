"use client";

import Image from "next/image";
import { Camera, Mail, ExternalLink, Globe, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 fade-in">
      <div className="text-center mb-8">
        <Image src="/WorkTopLogo.svg" alt="WorkTop CRM" width={88} height={88} priority className="mx-auto mb-4 rounded-2xl bg-white shadow-sm p-2" />
        <h1 className="text-3xl font-bold text-slate-900">
          Work<span className="text-blue-500">Top</span> <span className="text-slate-400 text-2xl font-medium">CRM</span>
        </h1>
        <p className="text-slate-500 mt-2">Run your projects from anywhere.</p>
      </div>

      <div className="stat-card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Get in touch</h2>
          <p className="text-sm text-slate-600">
            Questions, feedback, or onboarding help? We respond fast.
          </p>
        </div>

        <div className="space-y-4">
          <a href="https://worktopcrm.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition group">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 group-hover:text-blue-700">Website</p>
              <p className="text-sm text-blue-600">worktopcrm.com</p>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
          </a>

          <a href="mailto:hello@worktopcrm.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition group">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 group-hover:text-blue-700">Email</p>
              <p className="text-sm text-blue-600">hello@worktopcrm.com</p>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
          </a>

          <a href="/communications"
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 group-hover:text-emerald-700">In-app messaging</p>
              <p className="text-sm text-emerald-600">Reach your team & contractors</p>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-500" />
          </a>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            WorkTop CRM &middot; Built for builders, flippers & operators
          </p>
        </div>
      </div>
    </div>
  );
}
