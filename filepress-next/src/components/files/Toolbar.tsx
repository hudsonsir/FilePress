"use client";

import { Search, LayoutGrid, List, Rows3, AlignJustify, SortAsc, SortDesc, Upload, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode, SortField, SortOrder } from "@/types";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortField;
  order: SortOrder;
  onSortChange: (sort: SortField, order: SortOrder) => void;
  keyword: string;
  onKeywordChange: (kw: string) => void;
  total?: number;
  selected?: number;
  onUpload?: () => void;
  onClearSelection?: () => void;
}

const VIEW_MODES: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "masonry", icon: <LayoutGrid className="w-4 h-4" />, label: "瀑布流" },
  { mode: "grid", icon: <Rows3 className="w-4 h-4" />, label: "网格" },
  { mode: "detail", icon: <AlignJustify className="w-4 h-4" />, label: "详细" },
  { mode: "list", icon: <List className="w-4 h-4" />, label: "列表" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "btime", label: "添加时间" },
  { value: "mtime", label: "修改时间" },
  { value: "name", label: "文件名" },
  { value: "size", label: "文件大小" },
];

export function Toolbar({
  viewMode, onViewModeChange,
  sort, order, onSortChange,
  keyword, onKeywordChange,
  total, selected,
  onUpload, onClearSelection,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 shrink-0"
      style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>

      {/* 搜索框 */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "var(--color-foreground-subtle)" }} />
        <input
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="搜索文件名、标签、描述..."
          className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm outline-none transition-all"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-1">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortField, order)}
          className="text-sm px-2 py-1.5 rounded-md outline-none cursor-pointer"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => onSortChange(sort, order === "desc" ? "asc" : "desc")}
          className="p-1.5 rounded-md transition-colors"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground-muted)",
          }}
          title={order === "desc" ? "降序" : "升序"}
        >
          {order === "desc"
            ? <SortDesc className="w-4 h-4" />
            : <SortAsc className="w-4 h-4" />
          }
        </button>
      </div>

      {/* 视图切换 */}
      <div className="flex items-center rounded-md overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}>
        {VIEW_MODES.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            title={label}
            className="p-1.5 transition-colors"
            style={{
              background: viewMode === mode ? "var(--color-primary)" : "var(--color-surface-2)",
              color: viewMode === mode ? "white" : "var(--color-foreground-muted)",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* 上传按钮 */}
      {onUpload && (
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          <Upload className="w-3.5 h-3.5" />
          上传
        </button>
      )}

      {/* 总数 / 已选 */}
      {selected && selected > 0 ? (
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: "var(--color-primary)" }}>已选 {selected}</span>
          <button onClick={onClearSelection}
            style={{ color: "var(--color-foreground-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        total !== undefined && (
          <span className="text-xs shrink-0" style={{ color: "var(--color-foreground-subtle)" }}>
            共 {total} 个
          </span>
        )
      )}
    </div>
  );
}
