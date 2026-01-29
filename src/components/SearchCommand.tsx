"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type RequestItem = { id: string; title: string; description: string };

type KBItem = { id: string; title: string; content: string };

export default function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [kb, setKb] = useState<KBItem[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/requests", { cache: "no-store" });
      const k = await fetch("/api/kb", { cache: "no-store" });
      const rData = r.ok ? await r.json() : [];
      const kData = k.ok ? await k.json() : [];
      setRequests(Array.isArray(rData) ? rData : []);
      setKb(Array.isArray(kData) ? kData : []);
    }
    if (open) load();
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setOpen(false);
      setQuery("");
    }, 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  const q = query.toLowerCase();
  const reqResults = requests.filter(
    (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  );
  const kbResults = kb.filter(
    (item) => item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
  );

  return (
    <>
      <button
        type="button"
        className="relative z-50 cursor-pointer rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold pointer-events-auto"
        onMouseDown={() => setOpen(true)}
        onClick={() => setOpen(true)}
      >
        Поиск
      </button>
      <Modal open={open} title="Глобальный поиск" onClose={() => setOpen(false)}>
        <input
          className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Искать задачи, статьи..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Задачи</p>
            <div className="mt-2 grid gap-2">
              {reqResults.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  className="rounded-xl border border-black/10 p-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/workflow?req=${item.id}`);
                  }}
                >
                  {item.title}
                </button>
              ))}
              {reqResults.length === 0 && <p className="text-xs text-black/40">Нет совпадений</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Knowledge Base</p>
            <div className="mt-2 grid gap-2">
              {kbResults.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  className="rounded-xl border border-black/10 p-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/knowledge?kb=${item.id}`);
                  }}
                >
                  {item.title}
                </button>
              ))}
              {kbResults.length === 0 && <p className="text-xs text-black/40">Нет совпадений</p>}
            </div>
          </div>
          <Link
            href="/knowledge"
            className="text-xs font-semibold text-[var(--accent)]"
            onClick={() => setOpen(false)}
          >
            Перейти в базу знаний →
          </Link>
        </div>
      </Modal>
    </>
  );
}
