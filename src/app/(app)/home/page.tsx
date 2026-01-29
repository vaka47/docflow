"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const roleHome: Record<string, string> = {
  ADMIN: "/admin",
  MANAGER: "/workflow",
  EDITOR: "/workspace",
  LEGAL: "/workflow",
  CROWD: "/crowd",
  REQUESTER: "/workflow",
  GUEST: "/login",
};

export default function HomeRedirect() {
  const router = useRouter();
  const { data, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const role = (data?.user as { role?: string } | undefined)?.role ?? "GUEST";
    router.replace(roleHome[role] ?? "/workflow");
  }, [status, data, router]);

  return <div className="surface p-6 text-sm">Перенаправляем...</div>;
}
