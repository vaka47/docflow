"use client";

import { useEffect, useMemo, useState } from "react";
import RoleGate from "@/components/RoleGate";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  owner: { name: string };
  createdAt: string;
  dueAt?: string | null;
  slaDays: number;
};

export default function SlaReportClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/requests", { cache: "no-store" });
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    }
    load();
  }, []);

  const overdue = useMemo(() => {
    return requests
      .map((item) => {
        const deadline = item.dueAt
          ? new Date(item.dueAt)
          : new Date(new Date(item.createdAt).getTime() + item.slaDays * 86400000);
        const diff = Math.ceil((now - deadline.getTime()) / 86400000);
        return { ...item, deadline, overdueDays: diff };
      })
      .filter((item) => item.overdueDays > 0 && item.status !== "PUBLISHED")
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [requests, now]);

  return (
    <RoleGate allow={["ADMIN", "MANAGER"]}>
      <section className="surface p-6">
        <h3 className="text-lg font-semibold">SLA просрочки</h3>
        <p className="subtle mt-2 text-sm">Список задач, вышедших за SLA.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3">Задача</th>
                <th className="p-3">Владелец</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Дедлайн</th>
                <th className="p-3">Просрочка</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">{item.owner.name}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">{item.deadline.toLocaleDateString()}</td>
                  <td className="p-3 text-red-600">{item.overdueDays} дн.</td>
                </tr>
              ))}
              {overdue.length === 0 && (
                <tr>
                  <td className="p-3 text-sm text-black/50" colSpan={5}>
                    Просрочек нет.
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
