"use client";

import { useState } from "react";
import { X, Share2, Copy, Check, Clock } from "lucide-react";
import type { Resource } from "@/types";

interface Props {
  resource: Resource;
  appid: string;
  onClose: () => void;
}

export function ShareModal({ resource, appid, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [expireDays, setExpireDays] = useState(0);

  async function handleCreate() {
    setLoading(true);
    try {
      const endtime = expireDays > 0
        ? Math.floor(Date.now() / 1000) + expireDays * 86400
        : 0;
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resource.name,
          filepath: resource.rid,
          appid,
          endtime,
          password,
          perm: 1,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        setShareLink(`${base}/share/${data.data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl fade-in"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-base font-semibold">分享文件</h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--color-foreground-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold uppercase"
              style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
              {resource.ext.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{resource.name}</p>
            </div>
          </div>

          {/* 访问密码 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">访问密码（可留空）</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置访问密码"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* 有效期 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Clock className="inline w-3.5 h-3.5 mr-1" />
              有效期
            </label>
            <div className="flex gap-2">
              {[
                { label: "永久", value: 0 },
                { label: "1天", value: 1 },
                { label: "7天", value: 7 },
                { label: "30天", value: 30 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpireDays(opt.value)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: expireDays === opt.value ? "var(--color-primary)" : "var(--color-surface-2)",
                    color: expireDays === opt.value ? "white" : "var(--color-foreground-muted)",
                    border: `1px solid ${expireDays === opt.value ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 已生成链接 */}
          {shareLink && (
            <div className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "var(--color-success-subtle)", border: "1px solid var(--color-success)" }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: "var(--color-foreground)" }}>
                {shareLink}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                style={{ background: "var(--color-success)", color: "white" }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: "1px solid var(--color-border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground-muted)" }}>
            关闭
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !!shareLink}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            {loading ? "生成中..." : "生成分享链接"}
          </button>
        </div>
      </div>
    </div>
  );
}
