"use client";

import { useState } from "react";
import { X, Download, Star, Share2, ExternalLink, Clock, Ruler, HardDrive, Hash } from "lucide-react";
import { formatFileSize, formatDate, getFileCategory, isPreviewableImage, isVideo, isAudio } from "@/lib/utils";
import type { Resource } from "@/types";

interface FileDetailPanelProps {
  resource: Resource;
  appid: string;
  onClose: () => void;
}

export function FileDetailPanel({ resource, appid, onClose }: FileDetailPanelProps) {
  const [imgError, setImgError] = useState(false);
  const category = getFileCategory(resource.ext);

  return (
    <aside
      className="w-72 shrink-0 flex flex-col overflow-hidden fade-in"
      style={{ borderLeft: "1px solid var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span className="text-sm font-semibold truncate pr-2">{resource.name}</span>
        <button onClick={onClose} className="shrink-0 transition-colors"
          style={{ color: "var(--color-foreground-subtle)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 预览区 */}
        <div className="w-full bg-checkerboard flex items-center justify-center overflow-hidden"
          style={{ minHeight: 160, maxHeight: 260, background: "var(--color-surface-2)" }}>
          {!imgError && (isPreviewableImage(resource.ext) || resource.hasthumb) ? (
            <img
              src={`/api/thumb/${resource.rid}?size=large`}
              alt={resource.name}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : isVideo(resource.ext) ? (
            <video
              src={`/api/file/${resource.rid}`}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: 240 }}
            />
          ) : isAudio(resource.ext) ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">&#127925;</div>
              <audio src={`/api/file/${resource.rid}`} controls className="w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-8"
              style={{ color: "var(--color-foreground-subtle)" }}>
              <span className="text-4xl opacity-30">&#128196;</span>
              <span className="text-sm">.{resource.ext}</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <a
            href={`/api/file/${resource.rid}?download=1`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            <Download className="w-3.5 h-3.5" />
            下载
          </a>
          <button
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground-muted)" }}
            onClick={() => alert("分享功能开发中")}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground-muted)" }}
            onClick={() => alert("收藏功能开发中")}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 文件信息 */}
        <div className="px-4 py-3 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-foreground-muted)" }}>文件信息</h3>

          <InfoRow icon={<HardDrive className="w-3.5 h-3.5" />} label="大小" value={formatFileSize(resource.size)} />
          <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="格式" value={`.${resource.ext}`.toUpperCase()} />
          {resource.width > 0 && (
            <InfoRow icon={<Ruler className="w-3.5 h-3.5" />} label="尺寸" value={`${resource.width} × ${resource.height}`} />
          )}
          {resource.duration && resource.duration > 0 && (
            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="时长" value={formatDuration(resource.duration)} />
          )}
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="添加时间" value={formatDate(resource.btime)} />
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="修改时间" value={formatDate(resource.mtime)} />

          {resource.grade > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>评分</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < resource.grade ? "fill-current" : ""}`}
                    style={{ color: i < resource.grade ? "var(--color-accent)" : "var(--color-border)" }}
                  />
                ))}
              </div>
            </div>
          )}

          {resource.desc && (
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--color-foreground-muted)" }}>描述</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{resource.desc}</p>
            </div>
          )}

          {resource.link && (
            <a href={resource.link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--color-primary)" }}>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{resource.link}</span>
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span style={{ color: "var(--color-foreground-subtle)" }}>{icon}</span>
        <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>{label}</span>
      </div>
      <span className="text-xs font-medium truncate" style={{ color: "var(--color-foreground)" }}>{value}</span>
    </div>
  );
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
