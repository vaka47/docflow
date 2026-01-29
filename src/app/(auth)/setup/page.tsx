"use client";

import { useState } from "react";
import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="surface w-full max-w-lg p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">DocFlow OS</p>
          <h1 className="section-title mt-3 text-3xl md:text-4xl">Setup отключен</h1>
          <p className="subtle mt-2 text-sm">Демо-пользователи создаются автоматически при входе.</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-[var(--accent)]">
            Перейти к логину
          </Link>
        </div>
      </div>
    </div>
  );
}
