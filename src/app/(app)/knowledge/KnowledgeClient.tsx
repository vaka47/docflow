"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useSearchParams } from "next/navigation";

type KBItem = { id: string; title: string; content: string; tags: string[] };

const availableTags = ["intake", "sla", "quality", "compliance", "workflow", "crowd", "metrics", "legal", "faq"];

const faqExamples = [
  {
    title: "Как быстро запустить новую справку?",
    content: "Заполните intake, укажите аудиторию и источник истины. После triage редактор сформирует DoD и запуск в работу.",
    tags: ["intake", "faq"],
  },
  {
    title: "Кто согласует документы для регуляторов?",
    content: "Legal + product owner. Без их approval публикация невозможна.",
    tags: ["legal", "compliance"],
  },
  {
    title: "Почему нужен DoD?",
    content: "Он снижает rework: единые критерии качества, линтеры, preview и чек‑лист.",
    tags: ["quality", "workflow"],
  },
  {
    title: "Как понять, что задача просрочена?",
    content: "В карточке задачи SLA считается от даты создания. Система подсвечивает риски и отправляет напоминания.",
    tags: ["sla", "metrics"],
  },
  {
    title: "Когда стоит отдавать на crowd?",
    content: "Типовые секции и факты — в crowd. Смысловую сборку и финальный review делает редактор.",
    tags: ["crowd", "workflow"],
  },
];

export default function KnowledgeClient() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KBItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const searchParams = useSearchParams();
  const canManage = role === "MANAGER";

  async function load() {
    const res = await fetch("/api/kb", { cache: "no-store" });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/stream/kb");
    es.onmessage = () => load();
    return () => es.close();
  }, []);

  useEffect(() => {
    async function loadMe() {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const me = await res.json();
      setRole(me?.role ?? "");
    }
    loadMe();
  }, []);

  useEffect(() => {
    const id = searchParams.get("kb");
    if (!id || items.length === 0) return;
    const found = items.find((item) => item.id === id);
    if (found) setSelectedItem(found);
  }, [searchParams, items]);

  const suggestions = useMemo(() => {
    const lower = tagInput.toLowerCase();
    return availableTags.filter(
      (tag) => tag.includes(lower) && !selectedTags.includes(tag)
    );
  }, [tagInput, selectedTags]);

  function addTag(tag: string) {
    if (!tag || selectedTags.includes(tag)) return;
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function startEdit(item: KBItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setSelectedTags(item.tags ?? []);
    setTagInput("");
    setShowForm(true);
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setSelectedTags([]);
    setTagInput("");
    setEditingId(null);
  }

  async function handleDelete(item: KBItem) {
    const confirmed = window.confirm("Удалить статью?");
    if (!confirmed) return;
    await fetch(`/api/kb/${item.id}`, { method: "DELETE" });
    setSelectedItem(null);
    await load();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      title,
      content,
      tags: selectedTags,
    };
    if (editingId) {
      await fetch(`/api/kb/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    setShowForm(false);
    await load();
  }

  return (
    <div className="grid gap-8">
      <section className="surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Часто задаваемые вопросы</h3>
          {canManage && (
            <button
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
              onClick={() => {
                if (!showForm) resetForm();
                setShowForm((prev) => !prev);
              }}
            >
              {showForm ? "Скрыть форму" : "Добавить статью"}
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqExamples.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white p-4 text-sm h-44 overflow-hidden cursor-pointer"
              onClick={() => setSelectedItem({ id: item.title, ...item })}
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-black/50">
                {item.tags.map((tag) => (
                  <span key={tag} className="pill bg-white">
                    {tag}
                  </span>
                ))}
              </div>
              <h4 className="mt-3 font-semibold">{item.title}</h4>
              <p
                className="subtle mt-1 text-sm"
                style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {item.content}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className={`fixed inset-0 z-40 transition ${showForm ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-lg transform bg-white p-6 shadow-2xl transition-transform ${
            showForm ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form className="grid gap-4" onSubmit={submit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Редактировать статью" : "Добавить статью"}</h3>
              <button
                type="button"
                className="rounded-full border border-black/10 px-3 py-1 text-xs"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Закрыть
              </button>
            </div>
            <input
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
              placeholder="Заголовок"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <textarea
              className="min-h-[180px] rounded-2xl border border-black/10 px-4 py-3 text-sm"
              placeholder="Контент"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Теги</label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className="pill bg-white"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <input
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
                placeholder="Начните вводить тег (например, intake)"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && tagInput.trim()) {
                    event.preventDefault();
                    addTag(tagInput.trim());
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 text-xs">
                {suggestions.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className="rounded-full border border-black/10 px-3 py-1"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white">
              Сохранить
            </button>
          </form>
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="surface p-6 h-44 overflow-hidden cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-black/50">
              {item.tags.map((tag) => (
                <span key={tag} className="pill bg-white">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
            <p
              className="subtle mt-2 text-sm"
              style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {item.content}
            </p>
          </article>
        ))}
        {items.length === 0 && (
          <div className="surface p-6 text-sm text-black/50">База знаний пока пуста.</div>
        )}
      </section>

      <Modal
        open={Boolean(selectedItem)}
        title={selectedItem?.title ?? "Статья"}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <div className="grid gap-3 text-sm">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-black/50">
              {selectedItem.tags.map((tag) => (
                <span key={tag} className="pill bg-white">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm">{selectedItem.content}</p>
            {canManage && items.some((item) => item.id === selectedItem.id) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="w-fit rounded-full border border-black/10 px-3 py-1 text-xs"
                  onClick={() => {
                    const item = items.find((kb) => kb.id === selectedItem.id);
                    if (item) startEdit(item);
                    setSelectedItem(null);
                  }}
                >
                  Редактировать
                </button>
                <button
                  className="w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600"
                  onClick={() => {
                    const item = items.find((kb) => kb.id === selectedItem.id);
                    if (item) handleDelete(item);
                  }}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
