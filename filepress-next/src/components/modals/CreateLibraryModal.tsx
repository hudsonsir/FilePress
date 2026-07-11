"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreate: (name: string, desc: string) => Promise<void>;
}

export function CreateLibraryModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), desc.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl fade-in"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h2 className="text-base font-semibold">新建文件库</h2>
          <button onClick={onClose} style={{ color: "var(--color-foreground-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">库名称 <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：设计素材库、产品图库..."
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">描述（可选）</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="对这个文件库的简短描述..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground-muted)" }}>
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
