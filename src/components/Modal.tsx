"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof window === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
      <button
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl" style={{ maxHeight: "85vh" }}>
        <div
          className="surface max-h-[85vh] overflow-y-auto p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="section-title text-2xl">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
            >
              Закрыть
            </button>
          </div>
          <div className="mt-4 text-sm">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
