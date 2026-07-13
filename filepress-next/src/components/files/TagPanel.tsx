"use client";

import useSWR from "swr";
import { Tag, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Tag as TagType, TagGroup } from "@/types";

interface TagPanelProps {
  appid: string;
  activeTagId: string;
  onSelect: (tagId: string) => void;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => d.data);

export function TagPanel({ appid, activeTagId, onSelect }: TagPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { data } = useSWR<{ groups: TagGroup[]; tags: TagType[] }>(
    `/api/tags?appid=${appid}`,
    fetcher
  );

  if (!data) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 rounded skeleton" />
        ))}
      </div>
    );
  }

  const { groups, tags } = data;
  const ungrouped = tags.filter((t) => !t.groupid);

  function toggleGroup(cid: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Tag className="w-3.5 h-3.5" style={{ color: "var(--color-foreground-muted)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-foreground-muted)" }}>标签</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* 全部 */}
        <button
          onClick={() => onSelect("")}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left"
          )}
          style={{
            background: !activeTagId ? "var(--color-primary-subtle)" : "transparent",
            color: !activeTagId ? "var(--color-primary)" : "var(--color-foreground-muted)",
          }}
        >
          全部文件
        </button>

        {/* 分组标签 */}
        {groups.map((g) => {
          const groupTags = tags.filter((t) => t.groupid === g.cid);
          if (groupTags.length === 0) return null;
          const open = !collapsed.has(g.cid);
          return (
            <div key={g.cid}>
              <button
                onClick={() => toggleGroup(g.cid)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                <span className="font-semibold">{g.catname}</span>
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {open && groupTags.map((t) => (
                <TagItem key={t.tid} tag={t} active={activeTagId === String(t.tid)} onSelect={onSelect} />
              ))}
            </div>
          );
        })}

        {/* 未分组标签 */}
        {ungrouped.map((t) => (
          <TagItem key={t.tid} tag={t} active={activeTagId === String(t.tid)} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function TagItem({ tag, active, onSelect }: { tag: TagType; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(active ? "" : String(tag.tid))}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors text-left"
      style={{
        background: active ? "var(--color-primary-subtle)" : "transparent",
        color: active ? "var(--color-primary)" : "var(--color-foreground)",
      }}
    >
      <span className="truncate flex-1">{tag.tagname}</span>
      <span className="text-xs ml-1 shrink-0" style={{ color: "var(--color-foreground-subtle)" }}>
        {tag.hots}
      </span>
    </button>
  );
}
