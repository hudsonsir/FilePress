"use client";

import { useState } from "react";
import { Star, Play, Music, FileText, Archive, File } from "lucide-react";
import { cn, formatFileSize, getFileCategory, getFileCategoryColor, isPreviewableImage } from "@/lib/utils";
import type { Resource } from "@/types";

interface FileCardProps {
  resource: Resource;
  selected?: boolean;
  viewMode?: "masonry" | "grid" | "list" | "detail";
  onSelect?: (rid: string, multi?: boolean) => void;
  onClick?: (resource: Resource) => void;
}

function ThumbImage({ resource }: { resource: Resource }) {
  const [error, setError] = useState(false);
  const category = getFileCategory(resource.ext);
  const color = getFileCategoryColor(category);

  if (!error && (resource.hasthumb || isPreviewableImage(resource.ext))) {
    return (
      <img
        src={`/api/thumb/${resource.rid}`}
        alt={resource.name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setError(true)}
      />
    );
  }

  // 占位图标
  const icons: Record<string, React.ReactNode> = {
    video: <Play className="w-8 h-8" style={{ color }} />,
    audio: <Music className="w-8 h-8" style={{ color }} />,
    document: <FileText className="w-8 h-8" style={{ color }} />,
    archive: <Archive className="w-8 h-8" style={{ color }} />,
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ background: `${color}10` }}>
      {icons[category] ?? <File className="w-8 h-8" style={{ color }} />}
      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded"
        style={{ background: `${color}20`, color }}>
        .{resource.ext}
      </span>
    </div>
  );
}

export function FileCard({ resource, selected, viewMode = "masonry", onSelect, onClick }: FileCardProps) {
  const aspectRatio = resource.width && resource.height
    ? resource.width / resource.height
    : 1;

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors rounded-md",
          selected && "ring-1"
        )}
        style={{
          background: selected ? "var(--color-primary-subtle)" : "var(--color-surface)",
          ...(selected ? { ringColor: "var(--color-primary)" } : {}),
        }}
        onClick={() => onClick?.(resource)}
      >
        <div className="w-10 h-10 rounded overflow-hidden shrink-0">
          <ThumbImage resource={resource} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{resource.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-foreground-muted)" }}>
            .{resource.ext} &middot; {formatFileSize(resource.size)}
          </p>
        </div>
        {resource.grade > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: resource.grade }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" style={{ color: "var(--color-accent)" }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "detail") {
    return (
      <div
        className={cn(
          "rounded-lg overflow-hidden cursor-pointer transition-all",
          selected && "ring-2"
        )}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          ...(selected ? { ringColor: "var(--color-primary)" } : {}),
        }}
        onClick={() => onClick?.(resource)}
      >
        <div className="w-full h-36 overflow-hidden">
          <ThumbImage resource={resource} />
        </div>
        <div className="p-3">
          <p className="text-sm font-medium truncate mb-1">{resource.name}</p>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-foreground-muted)" }}>
            <span>.{resource.ext} &middot; {formatFileSize(resource.size)}</span>
            {resource.width > 0 && (
              <span>{resource.width}&times;{resource.height}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // masonry / grid 模式
  const thumbHeight = viewMode === "grid"
    ? 160
    : Math.max(80, Math.min(320, Math.round(200 / aspectRatio)));

  return (
    <div
      className={cn(
        "group relative rounded-lg overflow-hidden cursor-pointer transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        selected && "ring-2"
      )}
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
      }}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onSelect?.(resource.rid, true);
        } else {
          onClick?.(resource);
        }
      }}
    >
      {/* 缩略图 */}
      <div style={{ height: thumbHeight }} className="overflow-hidden">
        <ThumbImage resource={resource} />
      </div>

      {/* 悬浮遮罩 */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.15)" }}>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(resource.rid); }}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{ background: selected ? "var(--color-primary)" : "rgba(255,255,255,0.9)" }}
          >
            {selected && <span className="text-white text-xs">✓</span>}
          </button>
        </div>
      </div>

      {/* 文件名（grid 模式显示） */}
      {viewMode === "grid" && (
        <div className="px-2 py-1.5">
          <p className="text-xs truncate" style={{ color: "var(--color-foreground-muted)" }}>
            {resource.name}
          </p>
        </div>
      )}

      {/* 评分角标 */}
      {resource.grade > 0 && (
        <div className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <Star className="w-3 h-3 fill-current text-yellow-400" />
          <span className="text-xs text-white">{resource.grade}</span>
        </div>
      )}
    </div>
  );
}
