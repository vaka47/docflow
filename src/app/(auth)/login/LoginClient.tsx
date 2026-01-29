"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { demoUsers } from "@/lib/demo-users";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/workflow";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const roleLabels: Record<string, string> = {
    MANAGER: "Менеджеры",
    EDITOR: "Редакторы",
    LEGAL: "Юристы",
    CROWD: "Крауд",
    REQUESTER: "Заказчики",
    ADMIN: "Админы",
  };
  const usersByRole = useMemo(() => {
    return demoUsers.reduce<Record<string, typeof demoUsers>>((acc, user) => {
      const key = user.role;
      acc[key] = acc[key] ? [...acc[key], user] : [user];
      return acc;
    }, {});
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email) {
      setError("Выберите пользователя.");
      return;
    }
    const res = await signIn("credentials", {
      redirect: false,
      email,
      demo: "true",
      callbackUrl,
    });
    if (res?.error) {
      setError("Не удалось войти. Проверьте выбор пользователя.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="surface w-full max-w-lg p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">DocFlow OS</p>
          <h1 className="section-title mt-3 text-3xl md:text-4xl">Вход в систему</h1>
          <p className="subtle mt-2 text-sm">Выберите пользователя и войдите без пароля.</p>
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold">
              Пользователь
              <select
                className="rounded-2xl border border-black/10 px-4 py-3"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              >
                <option value="">Выбрать пользователя</option>
                {Object.entries(usersByRole).map(([role, users]) => (
                  <optgroup key={role} label={roleLabels[role] ?? role}>
                    {users.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name} — {user.team}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white">
              Войти
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 text-sm">
            <p className="font-semibold">Быстрый вход</p>
            <p className="subtle">Менеджер — Анна Смирнова</p>
            <p className="subtle">Эдитор — Илья Петров</p>
            <p className="subtle">Юрист — Юлия Волкова</p>
          </div>
          <p className="mt-6 text-sm text-black/50">Регистрация отключена для демо.</p>
        </div>
      </div>
    </div>
  );
}
