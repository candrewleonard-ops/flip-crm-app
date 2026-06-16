"use client";

import { useEffect, useState } from "react";

// Standalone desktop build: there is no sign-in. The app runs as a single
// local user. A profile can optionally be saved in localStorage so the
// sidebar shows a name/initials, but nothing here talks to a server.

export interface AppUser {
  id: string;
  email: string;
  name: string;
  initials: string;
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DEFAULT_USER: AppUser = {
  id: "local-user",
  email: "Local workspace",
  name: "You",
  initials: "YO",
};

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(DEFAULT_USER);
  const [loading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("flipcrm_profile_v1");
      if (raw) {
        const p = JSON.parse(raw);
        const name = (p.name as string) || "You";
        setUser({
          id: "local-user",
          email: (p.email as string) || "Local workspace",
          name,
          initials: (p.avatarInitials as string) || deriveInitials(name),
        });
      }
    } catch {
      /* ignore — fall back to the default local user */
    }
  }, []);

  return { user, loading };
}

// No remote session to end. Clearing the saved profile and returning to the
// dashboard is the closest equivalent for a local-only app.
export function signOut() {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("flipcrm_profile_v1"); } catch {}
    window.location.href = "/";
  }
}
