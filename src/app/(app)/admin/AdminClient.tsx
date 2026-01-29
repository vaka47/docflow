"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  team?: string | null;
  extraRoles?: string[];
};

const roles = ["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER", "CROWD"];

export default function AdminClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [creating, setCreating] = useState({
    name: "",
    email: "",
    role: "EDITOR",
    password: "",
    team: "",
    extraRoles: [] as string[],
  });
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/users");
    if (!res.ok) {
      setUsers([]);
      return;
    }
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(id: string, patch: Partial<UserItem>) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setToast("Не удалось обновить пользователя");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    await load();
    setToast("Права обновлены");
    setTimeout(() => setToast(null), 2000);
  }

  async function createUser() {
    if (!creating.name || !creating.email || !creating.password) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating),
    });
    if (!res.ok) {
      setToast("Не удалось создать пользователя");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setCreating({ name: "", email: "", role: "EDITOR", password: "", team: "", extraRoles: [] });
    await load();
    setToast("Сотрудник добавлен");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <RoleGate allow={["ADMIN"]}>
      <div className="grid gap-6">
        {toast && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toast}
          </div>
        )}

        <section className="surface p-6">
          <h2 className="text-lg font-semibold">Добавить сотрудника</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
              placeholder="Имя"
              value={creating.name}
              onChange={(event) => setCreating({ ...creating, name: event.target.value })}
            />
            <input
              className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
              placeholder="Email"
              value={creating.email}
              onChange={(event) => setCreating({ ...creating, email: event.target.value })}
            />
            <input
              className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
              placeholder="Пароль"
              type="password"
              value={creating.password}
              onChange={(event) => setCreating({ ...creating, password: event.target.value })}
            />
            <input
              className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
              placeholder="Команда (например, Legal)"
              value={creating.team}
              onChange={(event) => setCreating({ ...creating, team: event.target.value })}
            />
            <select
              className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
              value={creating.role}
              onChange={(event) => setCreating({ ...creating, role: event.target.value })}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={creating.extraRoles.includes(role)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...creating.extraRoles, role]
                        : creating.extraRoles.filter((r) => r !== role);
                      setCreating({ ...creating, extraRoles: next });
                    }}
                  />
                  Доп. роль: {role}
                </label>
              ))}
            </div>
          </div>
          <button
            className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            onClick={createUser}
          >
            Добавить сотрудника
          </button>
        </section>

        <section className="surface p-6">
          <h2 className="text-lg font-semibold">Права и команды</h2>
          <input
            className="mt-3 w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
            placeholder="Быстрый поиск по сотрудникам..."
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-3">Сотрудник</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Роль</th>
                  <th className="p-3">Команда</th>
                  <th className="p-3">Доп. роли</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => {
                    if (!userQuery.trim()) return true;
                    const q = userQuery.toLowerCase();
                    return (
                      user.name.toLowerCase().includes(q) ||
                      user.email.toLowerCase().includes(q) ||
                      (user.team ?? "").toLowerCase().includes(q)
                    );
                  })
                  .map((user) => (
                  <tr key={user.id} className="border-b border-black/5">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <select
                        className="rounded-xl border border-black/10 px-2 py-1 text-xs"
                        value={user.role}
                        onChange={(event) => updateUser(user.id, { role: event.target.value })}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        className="rounded-xl border border-black/10 px-2 py-1 text-xs"
                        value={user.team ?? ""}
                        onChange={(event) => updateUser(user.id, { team: event.target.value })}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                          <label key={role} className="flex items-center gap-1 text-[11px]">
                            <input
                              type="checkbox"
                              checked={(user.extraRoles ?? []).includes(role)}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...(user.extraRoles ?? []), role]
                                  : (user.extraRoles ?? []).filter((r) => r !== role);
                                updateUser(user.id, { extraRoles: next });
                              }}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="p-3 text-sm text-black/50" colSpan={5}>
                      Нет сотрудников.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </RoleGate>
  );
}
