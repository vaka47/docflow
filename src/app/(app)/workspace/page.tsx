"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RoleGate from "@/components/RoleGate";
import { exportToDocx } from "@/lib/docx";
import { saveAs } from "file-saver";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import EditorToolbar from "./EditorToolbar";
import jsPDF from "jspdf";
import Modal from "@/components/Modal";

type Doc = {
  id: string;
  title: string;
  content: string;
  version: string;
  sections: string[];
  publishedAt?: string | null;
  updatedAt: string;
};

type Version = { id: string; title: string; version: string; createdAt: string };

type Comment = { id: string; author: string; content: string; line: number | null; createdAt: string };
type User = { id: string; name: string; team?: string | null; role?: string };

type Presence = { name: string; ts: number; color: string };

const seedDocs: Omit<Doc, "id" | "updatedAt">[] = [
  {
    title: "FAQ по запуску Алисы",
    content: "<h1>FAQ</h1><p>Вопрос/Ответ...</p>",
    version: "1.2",
    sections: ["Введение", "Сценарии", "FAQ"],
  },
  {
    title: "Регуляторика: отчетность",
    content: "<h1>Регуляторика</h1><p>Требования...</p>",
    version: "2.0",
    sections: ["Нормативы", "Процедуры", "Сроки"],
  },
];

export default function WorkspacePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [autosaveAt, setAutosaveAt] = useState<string>("");
  const [commentAuthor, setCommentAuthor] = useState("Аноним");
  const [commentLine, setCommentLine] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [role, setRole] = useState<string>("");
  const [mentionType, setMentionType] = useState<"user" | "team" | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [docQuery, setDocQuery] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishFilter, setPublishFilter] = useState<"all" | "published">("all");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fontLoadedRef = useRef(false);
  const mentionKey = "docflow-workspace-mentions";
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const fontBase64Ref = useRef<string | null>(null);
  const clientId = useState(() => (typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)))[0];

  const channel = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new BroadcastChannel(`docflow-doc-${activeId || "default"}`);
  }, [activeId]);


  function colorFromName(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 70% 55%)`;
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    async function loadMe() {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const user = await res.json();
      if (user?.name) setCommentAuthor(user.name);
      if (user?.role) setRole(user.role);
      if (user?.id) {
        const stored = localStorage.getItem(mentionKey);
        if (stored) {
          try {
            const map = JSON.parse(stored) as Record<string, number>;
            delete map[user.id];
            localStorage.setItem(mentionKey, JSON.stringify(map));
          } catch {
            // ignore
          }
        }
      }
    }
    loadMe();
  }, []);

  const canDeleteDoc = role === "ADMIN" || role === "MANAGER";

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  useEffect(() => {
    async function loadDocs() {
      const res = await fetch("/api/docs", { cache: "no-store" });
      if (!res.ok) {
        setDocError("Документы недоступны. Проверьте миграции (docs).");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDocs(data);
        setActiveId(data[0].id);
        setTitle(data[0].title);
      } else {
        for (const doc of seedDocs) {
          const seedRes = await fetch("/api/docs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          });
          if (!seedRes.ok) {
            setDocError("Не удалось создать документы. Проверьте миграции (docs).");
            return;
          }
        }
        const res2 = await fetch("/api/docs", { cache: "no-store" });
        if (!res2.ok) {
          setDocError("Документы недоступны. Проверьте миграции (docs).");
          return;
        }
        const data2 = await res2.json();
        setDocs(data2);
        setActiveId(data2[0]?.id ?? "");
        setTitle(data2[0]?.title ?? "");
      }
    }
    loadDocs();
  }, [editor]);

  const active = useMemo(() => docs.find((d) => d.id === activeId), [docs, activeId]);
  function stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const filteredDocs = useMemo(() => {
    const needle = docQuery.toLowerCase().trim();
    return docs.filter((doc) => {
      if (publishFilter === "published" && !doc.publishedAt) return false;
      if (!needle) return true;
      const contentText = stripHtml(doc.content || "").toLowerCase();
      return (
        doc.title.toLowerCase().includes(needle) ||
        doc.sections?.some((section) => section.toLowerCase().includes(needle)) ||
        contentText.includes(needle)
      );
    });
  }, [docs, docQuery, publishFilter]);

  useEffect(() => {
    if (!editor || !active) return;
    if (!active.content) return;
    const current = editor.getHTML();
    if (current !== active.content) {
      editor.commands.setContent(active.content);
    }
  }, [editor, active, activeId]);

  async function createDemoDoc() {
    const doc = seedDocs[0];
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    if (!res.ok) {
      setDocError("Не удалось создать документ. Проверьте миграции (docs).");
      return;
    }
    const res2 = await fetch("/api/docs", { cache: "no-store" });
    if (!res2.ok) {
      setDocError("Документы недоступны. Проверьте миграции (docs).");
      return;
    }
    const data = await res2.json();
    setDocs(data);
    setActiveId(data[0]?.id ?? "");
    setTitle(data[0]?.title ?? "");
  }

  async function deleteDoc(id: string) {
    if (!canDeleteDoc) return;
    const confirmed = window.confirm("Удалить документ?");
    if (!confirmed) return;
    const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error || body?.detail || "";
      } catch {
        detail = "";
      }
      setToast(`Не удалось удалить документ${detail ? `: ${detail}` : ""}`);
      return;
    }
    const res2 = await fetch("/api/docs", { cache: "no-store" });
    if (res2.ok) {
      const data = await res2.json();
      setDocs(Array.isArray(data) ? data : []);
      const next = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setActiveId(next?.id ?? "");
      setTitle(next?.title ?? "");
    }
  }

  async function extractDocxText(buffer: ArrayBuffer) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value || "";
    } catch (error) {
      throw new Error("DOCX: не удалось импортировать mammoth");
    }
  }


  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = [".txt", ".md", ".html", ".docx"];
    const lower = file.name.toLowerCase();
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setUploadError("Поддерживаются .txt, .md, .html, .docx");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      let rawText = "";
      let content = "";
      try {
        if (lower.endsWith(".docx")) {
          const buffer = reader.result as ArrayBuffer;
          rawText = await extractDocxText(buffer);
        } else {
          rawText = typeof reader.result === "string" ? reader.result : "";
        }
        const isHtml = lower.endsWith(".html");
        if (isHtml) {
          content = rawText;
        } else {
          const safeText = rawText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          content = `<p>${safeText.replace(/\n/g, "<br/>")}</p>`;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось конвертировать документ.";
        setUploadError(message);
        event.target.value = "";
        return;
      }
      if (!rawText.trim()) {
        setUploadError("Не удалось извлечь текст из файла");
        event.target.value = "";
        return;
      }
      const title = file.name.replace(/\.[^/.]+$/, "");
      const payload = {
        title: title || "Новый документ",
        content,
        version: "1.0",
        sections: [],
      };
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setUploadError("Не удалось загрузить документ");
      } else {
        setUploadError(null);
        const res2 = await fetch("/api/docs", { cache: "no-store" });
        const data = await res2.json();
        setDocs(Array.isArray(data) ? data : []);
      }
      event.target.value = "";
    };
    reader.onerror = () => {
      setUploadError("Не удалось прочитать файл");
      event.target.value = "";
    };
    if (lower.endsWith(".docx")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  useEffect(() => {
    async function loadVersions() {
      if (!activeId) return;
      const res = await fetch(`/api/docs/${activeId}/versions`);
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    }
    loadVersions();
  }, [activeId, active?.version, active?.sections]);

  useEffect(() => {
    async function loadComments() {
      if (!activeId) return;
      const res = await fetch(`/api/docs/${activeId}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    }
    loadComments();
  }, [activeId]);

  useEffect(() => {
    if (!channel) return;
    let alive = true;
    const interval = setInterval(() => {
      if (!alive) return;
      try {
        channel.postMessage({
          type: "presence",
          clientId,
          user: { name: commentAuthor || "User", color: colorFromName(commentAuthor || "User") },
          ts: Date.now(),
        });
      } catch {
        // channel may be closed during navigation
      }
    }, 3000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [channel, commentAuthor, clientId]);

  useEffect(() => {
    if (!channel) return;
    const handler = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.clientId === clientId) return;
      if (payload.type === "content" && editor) {
        editor.commands.setContent(payload.content, false);
      }
      if (payload.type === "presence") {
        setPresence((prev) => {
          const next = prev.filter((item) => item.name !== payload.user.name);
          return [...next, { name: payload.user.name, color: payload.user.color, ts: payload.ts }];
        });
      }
    };
    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }, [channel, editor, clientId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPresence((prev) => prev.filter((item) => Date.now() - item.ts < 15000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!channel || !editor) return;
    let handle: ReturnType<typeof setTimeout> | null = null;
    const updateHandler = () => {
      if (handle) clearTimeout(handle);
      handle = setTimeout(() => {
        try {
          channel.postMessage({
            type: "content",
            clientId,
            content: editor.getJSON(),
          });
        } catch {
          // channel may be closed during navigation
        }
      }, 300);
    };
    editor.on("update", updateHandler);
    return () => {
      editor.off("update", updateHandler);
      if (handle) clearTimeout(handle);
    };
  }, [channel, editor, clientId]);

  useEffect(() => {
    if (!isEditing || !activeId) return;
    const handle = setTimeout(async () => {
      const html = editor?.getHTML() || "";
      const res = await fetch(`/api/docs/${activeId}?draft=1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: html, version: active?.version, sections: active?.sections ?? [] }),
      });
      if (res.ok) {
        setAutosaveAt(new Date().toLocaleTimeString());
      } else {
        let message = "Не удалось сохранить черновик";
        try {
          const data = await res.json();
          if (data?.detail || data?.error) message = data.detail || data.error;
        } catch {
          // ignore
        }
        setToast(message);
        setTimeout(() => setToast(null), 3000);
      }
    }, 5000);
    return () => clearTimeout(handle);
  }, [title, isEditing, activeId, editor, active?.version, active?.sections]);

  async function saveVersion() {
    if (!activeId) {
      setToast("Сначала выберите документ");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const html = editor?.getHTML() || "";
    const saveRes = await fetch(`/api/docs/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: html, version: active?.version, sections: active?.sections ?? [] }),
    });
    if (!saveRes.ok) {
      let message = "Не удалось сохранить документ";
      try {
        const data = await saveRes.json();
        if (data?.detail || data?.error) message = data.detail || data.error;
      } catch {
        // ignore
      }
      setToast(message);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const listRes = await fetch("/api/docs", { cache: "no-store" });
    if (!listRes.ok) {
      setToast("Не удалось обновить список документов");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const data = await listRes.json();
    setDocs(data);
    const updated = data.find((d: Doc) => d.id === activeId);
    if (updated) {
      setTitle(updated.title);
      editor?.commands.setContent(updated.content || "");
    }
    setToast("Изменения сохранены");
    setTimeout(() => setToast(null), 2500);
  }

  async function loadPdfFont() {
    if (fontLoadedRef.current && fontBase64Ref.current) return;
    const res = await fetch("/fonts/Arial.ttf");
    if (!res.ok) throw new Error("Font load failed");
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    fontBase64Ref.current = base64;
    fontLoadedRef.current = true;
  }

  async function exportPdf(popup?: Window | null) {
    if (!editorRef.current) return;
    if (isExporting) return;
    setIsExporting(true);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    try {
      await loadPdfFont();
      const fileName = `${title || "document"}.pdf`;
      const pdf = new jsPDF("p", "pt", "a4");
      if (fontBase64Ref.current) {
        pdf.addFileToVFS("Arial.ttf", fontBase64Ref.current);
        pdf.addFont("Arial.ttf", "Arial", "normal");
        pdf.setFont("Arial");
      }
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 40;
      let cursorY = 60;
      const text = editor?.getText() || title || "Документ";
      const lines = pdf.splitTextToSize(text, pageWidth - marginX * 2);
      for (const line of lines) {
        if (cursorY > pageHeight - 40) {
          pdf.addPage();
          cursorY = 60;
        }
        pdf.text(line, marginX, cursorY);
        cursorY += 14;
      }
      if (isIOS) {
        const dataUri = pdf.output("datauristring");
        if (popup) {
          popup.location.href = dataUri;
        } else {
          window.location.href = dataUri;
        }
      } else {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось сформировать PDF";
      console.error("[PDF] export failed", error);
      setToast(message);
      setTimeout(() => setToast(null), 2500);
    } finally {
      setIsExporting(false);
    }
  }

  function handlePdfClick() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const popup = isIOS ? window.open("", "_blank") : null;
    if (isIOS && !popup) {
      setToast("Разрешите всплывающие окна для экспорта PDF");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    exportPdf(popup);
  }

  async function exportDocx() {
    const html = editor?.getHTML() || "";
    const blob = await exportToDocx(title, html);
    saveAs(blob, `${title || "document"}.docx`);
  }

  async function restoreVersion(versionId: string) {
    await fetch(`/api/docs/${activeId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const res = await fetch("/api/docs", { cache: "no-store" });
    const data = await res.json();
    setDocs(data);
    const updated = data.find((d: Doc) => d.id === activeId);
    if (updated) {
      setTitle(updated.title);
      editor?.commands.setContent(updated.content || "");
    }
  }

  async function publishDocument() {
    if (!activeId) {
      setToast("Сначала выберите документ");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const html = editor?.getHTML() || "";
    const res = await fetch(`/api/docs/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: html,
        version: active?.version,
        sections: active?.sections ?? [],
        publishedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      setToast("Не удалось опубликовать документ");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const listRes = await fetch("/api/docs", { cache: "no-store" });
    if (listRes.ok) {
      const data = await listRes.json();
      setDocs(Array.isArray(data) ? data : []);
    }
    setIsEditing(false);
    setToast("Документ опубликован");
    setTimeout(() => setToast(null), 3000);
  }

  async function addComment() {
    if (!activeId || !commentText.trim()) return;
    await fetch(`/api/docs/${activeId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: commentAuthor,
        content: commentText,
        line: commentLine ? Number(commentLine) : null,
      }),
    });
    registerMentions(commentText);
    setCommentText("");
    setCommentLine("");
    const res = await fetch(`/api/docs/${activeId}/comments`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  }

  const teamOptions = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.team || u.role).filter(Boolean))) as string[];
  }, [users]);

  const mentionOptions = useMemo(() => {
    if (!mentionOpen) return [];
    if (mentionType === "user") {
      const q = mentionQuery.trim().toLowerCase();
      return users
        .filter((u) => u.name.toLowerCase().includes(q))
        .slice(0, 6)
        .map((u) => ({ label: u.name, value: `@${u.name}` }));
    }
    if (mentionType === "team") {
      const q = mentionQuery.trim().toLowerCase();
      return teamOptions
        .filter((t) => t.toLowerCase().includes(q))
        .slice(0, 6)
        .map((t) => ({ label: t, value: `#${t}` }));
    }
    return [];
  }, [mentionOpen, mentionType, mentionQuery, users, teamOptions]);

  function updateMentionState(text: string, caret: number) {
    const left = text.slice(0, caret);
    const match = left.match(/(^|\\s)([@#])([^\\s@#]*)$/);
    if (!match) {
      setMentionOpen(false);
      setMentionType(null);
      setMentionQuery("");
      return;
    }
    const symbol = match[2];
    const query = match[3] ?? "";
    setMentionType(symbol === "@" ? "user" : "team");
    setMentionQuery(query);
    setMentionOpen(true);
  }

  function insertMention(value: string) {
    const textarea = commentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? commentText.length;
    const before = commentText.slice(0, start);
    const after = commentText.slice(start);
    const replaced = before.replace(/(^|\\s)([@#])([^\\s@#]*)$/, `$1${value} `);
    const next = `${replaced}${after}`;
    setCommentText(next);
    setMentionOpen(false);
    setMentionType(null);
    setMentionQuery("");
    requestAnimationFrame(() => {
      const pos = replaced.length + 1;
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
    });
  }

  function registerMentions(text: string) {
    if (!users.length) return;
    const tokens = (text.match(/[@#][^\s,.;:!?]+/g) || []).map((t) => t.toLowerCase());
    if (tokens.length === 0) return;
    const allUsers = users;
    const mentionedIds = new Set<string>();
    for (const token of tokens) {
      if (token === "@all" || token === "#all" || token === "@company" || token === "#company") {
        allUsers.forEach((u) => mentionedIds.add(u.id));
        continue;
      }
      if (token.startsWith("@")) {
        const namePart = token.slice(1);
        allUsers
          .filter((u) => u.name.toLowerCase().includes(namePart))
          .forEach((u) => mentionedIds.add(u.id));
      }
      if (token.startsWith("#")) {
        const teamPart = token.slice(1);
        allUsers
          .filter((u) => (u.team || u.role || "").toLowerCase().includes(teamPart))
          .forEach((u) => mentionedIds.add(u.id));
      }
    }
    if (mentionedIds.size === 0) return;
    try {
      const stored = localStorage.getItem(mentionKey);
      const map = stored ? (JSON.parse(stored) as Record<string, number>) : {};
      mentionedIds.forEach((id) => {
        map[id] = (map[id] || 0) + 1;
      });
      localStorage.setItem(mentionKey, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  async function deleteComment(commentId: string, author: string) {
    const confirmed = window.confirm("Удалить комментарий?");
    if (!confirmed) return;
    await fetch(`/api/docs/${activeId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, author }),
    });
    const res = await fetch(`/api/docs/${activeId}/comments`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
  }

  return (
    <RoleGate allow={["ADMIN", "MANAGER", "EDITOR"]}>
      <div className="grid gap-8">
        {toast && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toast}
          </div>
        )}
        <section className="grid gap-4 lg:grid-cols-[0.22fr_0.53fr_0.25fr]">
          <div className="surface p-4">
            <h3 className="text-lg font-semibold">Документы</h3>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                placeholder="Поиск документов..."
                value={docQuery}
                onChange={(event) => setDocQuery(event.target.value)}
              />
              <div className="flex items-center gap-2 text-xs font-semibold text-black/60">
                <button
                  className={`rounded-full border px-3 py-1 ${publishFilter === "all" ? "border-[var(--accent)] text-[var(--accent)]" : "border-black/10"}`}
                  onClick={() => setPublishFilter("all")}
                >
                  Все
                </button>
                <button
                  className={`rounded-full border px-3 py-1 ${publishFilter === "published" ? "border-emerald-300 text-emerald-700" : "border-black/10"}`}
                  onClick={() => setPublishFilter("published")}
                >
                  Опубликованные
                </button>
              </div>
              <label className="rounded-2xl border border-dashed border-black/20 bg-white px-3 py-2 text-center text-xs font-semibold text-black/60 cursor-pointer">
                Загрузить документ (.txt / .md / .html / .docx)
                <input type="file" accept=".txt,.md,.html,.docx" className="hidden" onChange={handleUpload} />
              </label>
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
            <div className="mt-4 grid gap-2">
              {docError && <p className="text-xs text-red-600">{docError}</p>}
              {docs.length === 0 && (
                <button
                  className="rounded-2xl border border-black/10 bg-white p-3 text-left text-sm"
                  onClick={createDemoDoc}
                >
                  Создать демо‑документ
                </button>
              )}
              {filteredDocs.map((doc) => {
                const isPublished = Boolean(doc.publishedAt);
                return (
                <button
                  key={doc.id}
                  className={`rounded-2xl border p-3 text-left text-sm ${
                    activeId === doc.id ? "bg-[var(--accent)]/5" : "bg-white"
                  } ${isPublished ? "border-emerald-300" : "border-amber-200"}`}
                  onClick={() => {
                    setActiveId(doc.id);
                    setTitle(doc.title);
                    editor?.commands.setContent(doc.content || "");
                  }}
                >
                  <p className="font-semibold">{doc.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/50">
                    <span>Версия {doc.version}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {isPublished ? "Опубликован" : "Черновик"}
                    </span>
                    {isPublished && doc.publishedAt && (
                      <span className="text-[10px] text-emerald-700">
                        {new Date(doc.publishedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </div>

          <div className="surface p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Документ</h3>
              <div className="flex items-center gap-3 text-xs text-black/50">
                {presence.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-full border border-black/10 px-2 py-1"
                    style={{ borderColor: p.color, color: p.color }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {isEditing ? <EditorToolbar editor={editor} /> : <div className="text-xs text-black/40">Просмотр</div>}
              {!isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                    onClick={() => setIsEditing(true)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                    title="Публикует документ и фиксирует финальную версию"
                    onClick={publishDocument}
                  >
                    Опубликовать
                  </button>
                  {active && canDeleteDoc && (
                    <button
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600"
                      onClick={() => deleteDoc(active.id)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                    title="Сохраняет изменения как черновик, без публикации"
                    onClick={() => {
                      saveVersion();
                      setIsEditing(false);
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              )}
            </div>
            <input
              className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Заголовок документа"
              disabled={!isEditing}
            />
            <div
              className="mt-3 min-h-[640px] rounded-2xl border border-black/10 bg-white p-4 text-base"
              ref={editorRef}
            >
              <EditorContent editor={editor} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="rounded-full border border-black/10 px-4 py-2 text-xs cursor-pointer" onClick={exportDocx}>
                Экспорт DOCX
              </button>
              {autosaveAt && <span className="text-xs text-black/40">Автосейв: {autosaveAt}</span>}
            </div>
            <div className="mt-2">
              <button
                className="rounded-full border border-black/10 px-4 py-2 text-xs cursor-pointer"
                onClick={handlePdfClick}
              >
                {isExporting ? "Экспорт PDF..." : "Экспорт PDF"}
              </button>
            </div>
          </div>

          <div className="surface p-4">
            <h3 className="text-lg font-semibold">Комментарии</h3>
            <div className="mt-2 grid gap-2 text-xs">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-black/10 bg-white p-2 text-left cursor-pointer"
                  onClick={() => setActiveComment(c)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{c.author}</p>
                    {c.author === commentAuthor && (
                      <button
                        className="text-sm font-semibold text-red-500"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteComment(c.id, c.author);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p
                    className="text-black/60"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.content}
                  </p>
                  {c.line !== null && <p className="text-black/40">Строка: {c.line}</p>}
                </div>
              ))}
              {comments.length === 0 && <p className="text-black/40">Нет комментариев</p>}
            </div>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-xl border border-black/10 px-3 py-2 text-xs"
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
                placeholder="Автор"
              />
              <input
                className="rounded-xl border border-black/10 px-3 py-2 text-xs"
                value={commentLine}
                onChange={(event) => setCommentLine(event.target.value)}
                placeholder="Строка (необязательно)"
              />
              <div className="relative">
                <textarea
                  ref={commentRef}
                  className="min-h-[60px] w-full rounded-xl border border-black/10 px-3 py-2 text-xs"
                  value={commentText}
                  onChange={(event) => {
                    setCommentText(event.target.value);
                    updateMentionState(event.target.value, event.target.selectionStart ?? event.target.value.length);
                  }}
                  onKeyUp={(event) => {
                    const target = event.currentTarget;
                    updateMentionState(target.value, target.selectionStart ?? target.value.length);
                  }}
                  placeholder="Комментарий"
                />
                {mentionOpen && mentionOptions.length > 0 && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-black/10 bg-white p-2 text-xs shadow-lg">
                    {mentionOptions.map((option) => (
                      <button
                        key={option.value}
                        className="block w-full rounded-lg px-2 py-1 text-left hover:bg-black/5"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertMention(option.value);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-black/40">Упоминания: @имя, #команда, @all</p>
              <button className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white" onClick={addComment}>
                Добавить комментарий
              </button>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold">История версий</h4>
              <ul className="mt-2 text-xs text-black/60">
                {versions.slice(0, 5).map((ver) => (
                  <li key={ver.id} className="flex items-center justify-between">
                    <span>• {ver.version} · {new Date(ver.createdAt).toLocaleString()}</span>
                    <button className="rounded-full border border-black/10 px-2 py-1 text-[10px]" onClick={() => restoreVersion(ver.id)}>
                      Откатить
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
      <Modal
        open={Boolean(activeComment)}
        title={activeComment ? `Комментарий от ${activeComment.author}` : ""}
        onClose={() => setActiveComment(null)}
      >
        {activeComment && (
          <div className="grid gap-2 text-sm">
            <p>{activeComment.content}</p>
            {activeComment.line !== null && <p className="text-black/40">Строка: {activeComment.line}</p>}
          </div>
        )}
      </Modal>
    </RoleGate>
  );
}
