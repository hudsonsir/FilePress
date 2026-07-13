"use client";

import { useCallback, useRef, useEffect } from "react";
import { FileCard } from "./FileCard";
import type { Resource, ViewMode } from "@/types";

interface FileGridProps {
  resources: Resource[];
  viewMode: ViewMode;
  selectedRids?: Set<string>;
  onSelect?: (rid: string, multi?: boolean) => void;
  onOpen?: (resource: Resource) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function SkeletonCard({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="w-10 h-10 rounded skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded skeleton w-2/3" />
          <div className="h-2.5 rounded skeleton w-1/3" />
        </div>
      </div>
    );
  }
  const h = viewMode === "grid" ? 160 : Math.floor(Math.random() * 120) + 100;
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="skeleton" style={{ height: h }} />
      {viewMode === "grid" && <div className="h-8 px-2 py-1.5"><div className="h-2.5 rounded skeleton w-3/4" /></div>}
    </div>
  );
}

export function FileGrid({
  resources,
  viewMode,
  selectedRids = new Set(),
  onSelect,
  onOpen,
  loading = false,
  hasMore = false,
  onLoadMore,
}: FileGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 无限滚动
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [onLoadMore, hasMore]);

  const handleOpen = useCallback((r: Resource) => onOpen?.(r), [onOpen]);
  const handleSelect = useCallback((rid: string, multi?: boolean) => onSelect?.(rid, multi), [onSelect]);

  if (viewMode === "masonry") {
    return (
      <div>
        <div className="masonry-grid" style={{ "--masonry-cols": "4" } as React.CSSProperties}>
          {resources.map((r) => (
            <div key={r.rid} className="masonry-item">
              <FileCard
                resource={r}
                viewMode="masonry"
                selected={selectedRids.has(r.rid)}
                onSelect={handleSelect}
                onClick={handleOpen}
              />
            </div>
          ))}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={`sk-${i}`} className="masonry-item">
              <SkeletonCard viewMode="masonry" />
            </div>
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-12" />}
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {resources.map((r) => (
            <FileCard
              key={r.rid}
              resource={r}
              viewMode="grid"
              selected={selectedRids.has(r.rid)}
              onSelect={handleSelect}
              onClick={handleOpen}
            />
          ))}
          {loading && Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} viewMode="grid" />
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-12" />}
      </div>
    );
  }

  if (viewMode === "detail") {
    return (
      <div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {resources.map((r) => (
            <FileCard
              key={r.rid}
              resource={r}
              viewMode="detail"
              selected={selectedRids.has(r.rid)}
              onSelect={handleSelect}
              onClick={handleOpen}
            />
          ))}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} viewMode="detail" />
          ))}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-12" />}
      </div>
    );
  }

  // list
  return (
    <div>
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        {resources.map((r) => (
          <div key={r.rid} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
            <FileCard
              resource={r}
              viewMode="list"
              selected={selectedRids.has(r.rid)}
              onSelect={handleSelect}
              onClick={handleOpen}
            />
          </div>
        ))}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={`sk-${i}`} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
            <SkeletonCard key={`sk-${i}`} viewMode="list" />
          </div>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-12" />}
    </div>
  );
}
