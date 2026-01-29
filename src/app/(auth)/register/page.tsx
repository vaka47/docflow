"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      setError("Не удалось создать аккаунт");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="surface w-full max-w-lg p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">DocFlow OS</p>
          <h1 className="section-title mt-3 text-3xl md:text-4xl">Регистрация</h1>
          <p className="subtle mt-2 text-sm">Создайте аккаунт менеджера или редактора.</p>
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold">
              Имя
              <input
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="Иван"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="you@yandex.ru"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Роль
              <select
                className="rounded-2xl border border-black/10 px-4 py-3"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="MANAGER">Менеджер</option>
                <option value="EDITOR">Редактор</option>
                <option value="REQUESTER">Заказчик</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Пароль
              <input
                className="rounded-2xl border border-black/10 px-4 py-3"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white">
              Создать аккаунт
            </button>
          </form>
          <p className="mt-6 text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-[var(--accent)]">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
