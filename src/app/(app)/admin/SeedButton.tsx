"use client";

import { useState } from "react";

export default function SeedButton() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSeed() {
    setStatus("Seeding...");
    const res = await fetch("/api/seed", { method: "POST" });
    let data: { message?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      setStatus(data?.message ?? "Failed");
      return;
    }
    setStatus(data?.message ?? "Seeded");
  }

  async function handleReset() {
    const confirmed = window.confirm("Сбросить все данные и перезаполнить демо?");
    if (!confirmed) return;
    setStatus("Resetting...");
    const reset = await fetch("/api/reset", { method: "POST" });
    if (!reset.ok) {
      setStatus("Reset failed");
      return;
    }
    await handleSeed();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        onClick={handleSeed}
        className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
      >
        Seed demo data
      </button>
      <button
        onClick={handleReset}
        className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold"
      >
        Reset + Seed
      </button>
      {status && <span className="text-xs text-black/50">{status}</span>}
    </div>
  );
}
