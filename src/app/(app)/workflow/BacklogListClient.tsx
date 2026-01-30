"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  type: string;
  owner: { name: string };
  createdAt: string;
};

export default function BacklogListClient() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [role, setRole] = useState<string>("MANAGER");

  async function load() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) {
      setItems([]);
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setItems(list.filter((item) => item.status === "BACKLOG"));
  }

  async function loadMe() {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const user = await res.json();
    setRole(user.role || "MANAGER");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    loadMe();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    await load();
  }

  const canPromote = ["ADMIN", "MANAGER", "EDITOR"].includes(role);

  return (
    <RoleGate allow={["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER"]} silent>
      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Backlog</h3>
        <p className="subtle mt-2 text-sm">Идеи и заявки до приоритизации и запуска в работу.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3">Задача</th>
                <th className="p-3">Тип</th>
                <th className="p-3">Владелец</th>
                <th className="p-3">Создана</th>
                {canPromote && <th className="p-3">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">{item.type}</td>
                  <td className="p-3">{item.owner.name}</td>
                  <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                  {canPromote && (
                    <td className="p-3">
                      <button
                        className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => updateStatus(item.id, "NEW")}
                      >
                        В работу
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-3 text-sm text-black/50" colSpan={canPromote ? 5 : 4}>
                    Backlog пуст.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </RoleGate>
  );
}
