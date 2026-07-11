"use client";

import useSWR from "swr";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Folder as FolderType } from "@/types";

interface FolderTreeProps {
  appid: string;
  activeFid: string;
  onSelect: (fid: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

function FolderNode({
  folder, appid, activeFid, onSelect, depth = 0,
}: {
  folder: FolderType;
  appid: string;
  activeFid: string;
  onSelect: (fid: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = activeFid === folder.fid;

  const { data: children } = useSWR<FolderType[]>(
    expanded ? `/api/folders?appid=${appid}&pfid=${folder.fid}` : null,
    fetcher
  );

  return (
    <div>
      <button
        onClick={() => {
          onSelect(active ? "" : folder.fid);
          setExpanded(true);
        }}
        className="w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-md text-sm transition-colors text-left"
        style={{
          paddingLeft: `${(depth + 1) * 12}px`,
          background: active ? "var(--color-primary-subtle)" : "transparent",
          color: active ? "var(--color-primary)" : "var(--color-foreground)",
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="shrink-0 opacity-50"
        >
          {expanded
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronRight className="w-3 h-3" />
          }
        </button>
        {active
          ? <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          : <Folder className="w-3.5 h-3.5 shrink-0" />
        }
        <span className="truncate flex-1">{folder.fname}</span>
        {folder.filenum > 0 && (
          <span className="text-xs shrink-0 opacity-40">{folder.filenum}</span>
        )}
      </button>
      {expanded && children && children.map((child) => (
        <FolderNode
          key={child.fid}
          folder={child}
          appid={appid}
          activeFid={activeFid}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function FolderTree({ appid, activeFid, onSelect }: FolderTreeProps) {
  const { data: roots } = useSWR<FolderType[]>(
    `/api/folders?appid=${appid}&pfid=`,
    fetcher
  );

  return (
    <div className="px-2 py-2" style={{ minHeight: 0 }}>
      <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-foreground-muted)" }}>
        目录
      </div>

      {/* 全部 */}
      <button
        onClick={() => onSelect("")}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left"
        style={{
          background: !activeFid ? "var(--color-primary-subtle)" : "transparent",
          color: !activeFid ? "var(--color-primary)" : "var(--color-foreground-muted)",
        }}
      >
        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
        全部文件
      </button>

      {roots?.map((f) => (
        <FolderNode
          key={f.fid}
          folder={f}
          appid={appid}
          activeFid={activeFid}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
