"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchCommand from "./SearchCommand";
import { signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { roleAccess } from "@/lib/role-access";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Admin" },
  { href: "/workflow", label: "Workflow" },
  { href: "/intake", label: "Intake" },
  { href: "/metrics", label: "Metrics" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/workspace", label: "Workspace" },
  { href: "/integrations", label: "Integrations" },
  { href: "/team", label: "Team & Chat" },
  { href: "/roles", label: "Role View" },
  { href: "/account", label: "Account" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const sessionRole = (data?.user as Session["user"] & { role?: string })?.role ?? "";
  const [role, setRole] = useState<string>("");
  const [extraRoles, setExtraRoles] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [meId, setMeId] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspaceMentions, setWorkspaceMentions] = useState(0);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    async function loadMe() {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const me = await res.json();
      setExtraRoles(Array.isArray(me?.extraRoles) ? me.extraRoles : []);
      setMeId(me?.id ?? "");
      if (me?.role) setRole(me.role);
      setRoleLoaded(true);
    }
    loadMe();
  }, []);

  useEffect(() => {
    if (sessionRole) {
      setRole(sessionRole);
      setRoleLoaded(true);
    }
  }, [sessionRole]);

  useEffect(() => {
    function safeParse<T>(value: string | null, fallback: T): T {
      try {
        return value ? (JSON.parse(value) as T) : fallback;
      } catch {
        return fallback;
      }
    }
    function computeUnread() {
      if (!meId || typeof window === "undefined") return;
      const messages = safeParse<{ channelId: string; ts: string; authorId?: string | null }[]>(
        localStorage.getItem("docflow-chat-messages"),
        []
      );
      const lastRead = safeParse<Record<string, Record<string, number>>>(localStorage.getItem("docflow-chat-lastread"), {});
      const lastForMe = lastRead[meId] ?? {};
      let count = 0;
      for (const msg of messages) {
        const ts = new Date(msg.ts).getTime();
        const last = lastForMe[msg.channelId] ?? 0;
        if (ts > last && msg.authorId !== meId) count += 1;
      }
      setUnreadCount(count);
    }
    function computeMentions() {
      if (!meId || typeof window === "undefined") return;
      const mentions = safeParse<Record<string, number>>(localStorage.getItem("docflow-workspace-mentions"), {});
      setWorkspaceMentions(mentions[meId] ?? 0);
    }
    computeUnread();
    computeMentions();
    function onStorage() {
      computeUnread();
      computeMentions();
    }
    window.addEventListener("storage", onStorage);
    const interval = setInterval(computeUnread, 3000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [meId]);

  const effectiveRole = roleLoaded ? (role || "GUEST") : "GUEST";
  const allowed = Array.from(
    new Set([
      ...(roleAccess[effectiveRole] ?? roleAccess.MANAGER),
      ...extraRoles.flatMap((r) => roleAccess[r] ?? []),
    ])
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="container py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div />
            <div className="flex items-center gap-3 justify-self-center">
              <div className="h-10 w-10 rounded-2xl bg-[var(--accent)] text-white grid place-items-center text-sm font-semibold">
                DF
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">Yandex Crowd DocFlow</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold lg:hidden"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                ☰
              </button>
            </div>
          </div>

          <div className="mt-3 hidden flex-wrap items-center justify-center gap-3 text-sm font-semibold lg:flex">
            {navItems
              .filter((item) => allowed.some((route) => item.href.startsWith(route)))
              .map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-2 transition ${
                      active ? "bg-[var(--accent)] !text-white" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    <span className="relative">
                      {item.label}
                      {item.href === "/workspace" && workspaceMentions > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                          {workspaceMentions > 9 ? "9+" : workspaceMentions}
                        </span>
                      )}
                      {item.href === "/team" && unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            <SearchCommand />
            <button
              className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/70 hover:bg-black/5"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-black/10 bg-white px-4 pb-4 pt-2 lg:hidden">
            <div className="grid gap-2 text-sm font-semibold">
              {navItems
                .filter((item) => allowed.some((route) => item.href.startsWith(route)))
                .map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.href === "/workspace" && workspaceMentions > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                          {workspaceMentions > 9 ? "9+" : workspaceMentions}
                        </span>
                      )}
                      {item.href === "/team" && unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              <div className="mt-2 flex items-center gap-2">
                <SearchCommand />
              </div>
              <button
                className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/70 hover:bg-black/5"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="container py-10 min-w-0">{children}</main>
      <footer className="container pb-10">
        <div className="glow-line mb-6" />
        <div className="flex flex-col gap-2 text-sm text-black/60 md:flex-row md:items-center md:justify-between">
          <p>DocFlow OS MVP · 24h build</p>
          <p>Intake → Workflow → DocOps → Compliance → Publish</p>
        </div>
      </footer>
    </div>
  );
}
