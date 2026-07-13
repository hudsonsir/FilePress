"use client";

import { useState, useCallback, useEffect } from "react";
import { use } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { FileGrid } from "@/components/files/FileGrid";
import { Toolbar } from "@/components/files/Toolbar";
import { FileDetailPanel } from "@/components/files/FileDetailPanel";
import { TagPanel } from "@/components/files/TagPanel";
import { FolderTree } from "@/components/files/FolderTree";
import { UploadModal } from "@/components/modals/UploadModal";
import type { Resource, ViewMode, SortField, SortOrder, FilterState } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);
const PAGE_SIZE = 60;

interface PageProps {
  params: Promise<{ appid: string }>;
}

export default function LibraryPage({ params }: PageProps) {
  const { appid } = use(params);

  const [viewMode, setViewMode] = useState<ViewMode>("masonry");
  const [selectedRids, setSelectedRids] = useState<Set<string>>(new Set());
  const [openResource, setOpenResource] = useState<Resource | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    keyword: "", ext: "", type: "", fid: "", tagId: "",
    sort: "btime", order: "desc",
  });

  // 延迟搜索
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(filter.keyword), 400);
    return () => clearTimeout(t);
  }, [filter.keyword]);

  function buildQuery(page: number) {
    const p = new URLSearchParams({
      appid,
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort: filter.sort,
      order: filter.order,
    });
    if (debouncedKeyword) p.set("keyword", debouncedKeyword);
    if (filter.ext) p.set("ext", filter.ext);
    if (filter.type) p.set("type", filter.type);
    if (filter.fid) p.set("fid", filter.fid);
    if (filter.tagId) p.set("tagId", filter.tagId);
    return `/api/resources?${p}`;
  }

  const { data: pages, size, setSize, isLoading, isValidating } = useSWRInfinite<{
    list: Resource[]; total: number; page: number; pageSize: number;
  }>(
    (index) => buildQuery(index + 1),
    fetcher,
    { revalidateFirstPage: false }
  );

  const resources: Resource[] = pages?.flatMap((p) => p.list) ?? [];
  const total = pages?.[0]?.total ?? 0;
  const hasMore = resources.length < total;

  const handleLoadMore = useCallback(() => {
    if (!isValidating) setSize((s) => s + 1);
  }, [isValidating, setSize]);

  const handleSelect = useCallback((rid: string, multi = false) => {
    setSelectedRids((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(rid)) next.delete(rid);
        else next.add(rid);
      } else {
        if (next.has(rid) && next.size === 1) next.clear();
        else { next.clear(); next.add(rid); }
      }
      return next;
    });
  }, []);

  function updateFilter<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    setFilter((f) => ({ ...f, [key]: val }));
    setSize(1);
    setSelectedRids(new Set());
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧：目录树 + 标签面板 */}
      <div className="w-52 shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <FolderTree
          appid={appid}
          activeFid={filter.fid}
          onSelect={(fid) => updateFilter("fid", fid)}
        />
        <div style={{ borderTop: "1px solid var(--color-border)" }} className="flex-1 overflow-hidden">
          <TagPanel
            appid={appid}
            activeTagId={filter.tagId}
            onSelect={(tagId) => updateFilter("tagId", tagId)}
          />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sort={filter.sort}
          order={filter.order}
          onSortChange={(sort, order) => {
            updateFilter("sort", sort);
            updateFilter("order", order);
          }}
          keyword={filter.keyword}
          onKeywordChange={(kw) => updateFilter("keyword", kw)}
          total={total}
          selected={selectedRids.size}
          onClearSelection={() => setSelectedRids(new Set())}
          onUpload={() => setShowUpload(true)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {!isLoading && resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3"
              style={{ color: "var(--color-foreground-muted)" }}>
              <span className="text-4xl opacity-20">&#128193;</span>
              <p className="text-sm">该库暂无文件</p>
            </div>
          ) : (
            <FileGrid
              resources={resources}
              viewMode={viewMode}
              selectedRids={selectedRids}
              onSelect={handleSelect}
              onOpen={setOpenResource}
              loading={isLoading || isValidating}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          )}
        </main>
      </div>

      {/* 右侧：文件详情面板 */}
      {openResource && (
        <FileDetailPanel
          resource={openResource}
          appid={appid}
          onClose={() => setOpenResource(null)}
        />
      )}

      {/* 上传弹窗 */}
      {showUpload && (
        <UploadModal
          appid={appid}
          fid={filter.fid || undefined}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setSize(1);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}
