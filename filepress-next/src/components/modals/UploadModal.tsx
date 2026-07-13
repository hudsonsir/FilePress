"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { X, Upload, CheckCircle, XCircle, Loader2, FileUp } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface Props {
  appid: string;
  fid?: string;
  onClose: () => void;
  onUploaded?: (count: number) => void;
}

export function UploadModal({ appid, fid, onClose, onUploaded }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  async function startUpload() {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;

    let doneCount = 0;

    for (const item of pending) {
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i)
      );

      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("appid", appid);
        if (fid) fd.append("fid", fid);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (data.code === 0) {
          doneCount++;
          setItems((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, status: "done" } : i)
          );
        } else {
          setItems((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, status: "error", error: data.message } : i)
          );
        }
      } catch {
        setItems((prev) =>
          prev.map((i) => i.id === item.id ? { ...i, status: "error", error: "网络错误" } : i)
        );
      }
    }

    if (doneCount > 0) onUploaded?.(doneCount);
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl fade-in flex flex-col"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxHeight: "80vh" }}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h2 className="text-base font-semibold">上传文件</h2>
          <button onClick={onClose} style={{ color: "var(--color-foreground-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 拖放区域 */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition-all"
            style={{
              border: `2px dashed ${dragging ? "var(--color-primary)" : "var(--color-border)"}`,
              background: dragging ? "var(--color-primary-subtle)" : "var(--color-surface-2)",
            }}
          >
            <FileUp className="w-8 h-8" style={{ color: "var(--color-foreground-subtle)" }} />
            <div className="text-center">
              <p className="text-sm font-medium">拖拽文件到此处</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-foreground-muted)" }}>
                或点击选择文件
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          {/* 文件列表 */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{item.file.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-foreground-muted)" }}>
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {item.status === "pending" && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--color-surface-3)", color: "var(--color-foreground-muted)" }}>
                        待上传
                      </span>
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                    )}
                    {item.status === "done" && (
                      <CheckCircle className="w-4 h-4" style={{ color: "var(--color-success)" }} />
                    )}
                    {item.status === "error" && (
                      <div className="flex items-center gap-1">
                        <XCircle className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
                        <span className="text-xs" style={{ color: "var(--color-danger)" }}>{item.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: "1px solid var(--color-border)" }}>
          <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
            {items.length > 0 ? `共 ${items.length} 个文件` : "尚未选择文件"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground-muted)" }}
            >
              关闭
            </button>
            <button
              onClick={startUpload}
              disabled={pendingCount === 0 || uploadingCount > 0}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {uploadingCount > 0
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 上传中...</>
                : <><Upload className="w-3.5 h-3.5" /> 开始上传 {pendingCount > 0 ? `(${pendingCount})` : ""}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
