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
  dueAt?: string | null;
  slaDays: number;
};

export default function ApprovalInboxClient() {
  const [items, setItems] = useState<RequestItem[]>([]);

  async function load() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) {
      setItems([]);
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setItems(list.filter((item) => item.status === "APPROVAL"));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
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

  function deadline(item: RequestItem) {
    if (item.dueAt) return new Date(item.dueAt);
    return new Date(new Date(item.createdAt).getTime() + item.slaDays * 86400000);
  }

  return (
    <RoleGate allow={["ADMIN", "LEGAL"]} silent>
      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Approval Inbox</h3>
        <p className="subtle mt-2 text-sm">Задачи, ожидающие юридического согласования.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3">Задача</th>
                <th className="p-3">Тип</th>
                <th className="p-3">Владелец</th>
                <th className="p-3">Дедлайн</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">{item.type}</td>
                  <td className="p-3">{item.owner.name}</td>
                  <td className="p-3">{deadline(item).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => updateStatus(item.id, "PUBLISHED")}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs"
                        onClick={() => updateStatus(item.id, "REVIEW")}
                      >
                        Вернуть в Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-3 text-sm text-black/50" colSpan={5}>
                    Сейчас нет задач на согласование.
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
