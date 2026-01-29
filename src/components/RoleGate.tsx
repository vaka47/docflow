"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

export default function RoleGate({
  allow,
  silent = false,
  children,
}: {
  allow: string[];
  silent?: boolean;
  children: React.ReactNode;
}) {
  const { data, status } = useSession();
  const role = (data?.user as Session["user"] & { role?: string })?.role ?? "GUEST";
  const [extraRoles, setExtraRoles] = useState<string[]>([]);
  const [preview] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("docflow-role-preview") || "";
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const me = await res.json();
      setExtraRoles(Array.isArray(me?.extraRoles) ? me.extraRoles : []);
    }
    load();
  }, []);

  if (status === "loading") {
    return silent ? null : <div className="surface p-6 text-sm text-black/50">Загрузка...</div>;
  }

  const effectiveRole = preview || role;
  const allowed = allow.includes(effectiveRole) || extraRoles.some((r) => allow.includes(r));
  if (!allowed) {
    return silent ? null : (
      <div className="surface p-6 text-sm">
        <p className="font-semibold">Доступ ограничен</p>
        <p className="subtle mt-2">Эта зона доступна для ролей: {allow.join(", ")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
