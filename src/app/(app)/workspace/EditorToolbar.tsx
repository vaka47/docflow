"use client";

import { Editor } from "@tiptap/react";

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </button>
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italic
      </button>
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </button>
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </button>
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        List
      </button>
      <button className="rounded-full border border-black/10 px-3 py-1 text-xs" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        HR
      </button>
    </div>
  );
}
