"use client";

import { signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useState } from "react";

export default function RoleSwitcher() {
  const { data } = useSession();
  const role = (data?.user as Session["user"] & { role?: string })?.role ?? "GUEST";
  const [preview, setPreview] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("docflow-role-preview") || "";
  });

  function updatePreview(value: string) {
    setPreview(value);
    if (value) {
      localStorage.setItem("docflow-role-preview", value);
    } else {
      localStorage.removeItem("docflow-role-preview");
    }
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase"
        value={preview || role}
        onChange={(event) => updatePreview(event.target.value === role ? "" : event.target.value)}
      >
        <option value={role}>ROLE: {role}</option>
        <option value="MANAGER">MANAGER</option>
        <option value="EDITOR">EDITOR</option>
        <option value="LEGAL">LEGAL</option>
        <option value="REQUESTER">REQUESTER</option>
        <option value="CROWD">CROWD</option>
      </select>
      {data?.user && (
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
        >
          Logout
        </button>
      )}
    </div>
  );
}
