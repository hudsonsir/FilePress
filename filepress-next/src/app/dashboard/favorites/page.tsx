"use client";

import useSWR from "swr";
import { useState } from "react";
import { Star, BookOpen } from "lucide-react";
import { FileCard } from "@/components/files/FileCard";
import type { Resource } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function FavoritesPage() {
  // 先获取文件库列表，再按库分组展示收藏
  const { data: libs } = useSWR<Array<{ appid: string; appname: string }>>("/api/libraries", fetcher);
  const [selectedAppid, setSelectedAppid] = useState<string>("");

  const activeAppid = selectedAppid || libs?.[0]?.appid || "";

  const { data: favs, mutate } = useSWR<Resource[]>(
    activeAppid ? `/api/favorites?appid=${activeAppid}` : null,
    fetcher
  );

  async function handleUnfav(rid: string) {
    await fetch(`/api/favorites?rid=${rid}&appid=${activeAppid}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题栏 */}
      <header className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <Star className="w-5 h-5 fill-current" style={{ color: "var(--color-accent)" }} />
        <h1 className="text-base font-semibold">我的收藏</h1>
        <span className="text-sm ml-1" style={{ color: "var(--color-foreground-muted)" }}>
          {favs ? `${favs.length} 个文件` : ""}
        </span>

        {/* 文件库切换 */}
        {libs && libs.length > 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>文件库：</span>
            <select
              value={activeAppid}
              onChange={(e) => setSelectedAppid(e.target.value)}
              className="text-sm px-2 py-1 rounded-md outline-none"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              {libs.map((lib) => (
                <option key={lib.appid} value={lib.appid}>{lib.appname}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {!favs ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ aspectRatio: "1 / 1" }} />
            ))}
          </div>
        ) : favs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <BookOpen className="w-12 h-12" style={{ color: "var(--color-foreground-subtle)" }} />
            <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              暂无收藏文件
            </p>
            <p className="text-xs" style={{ color: "var(--color-foreground-subtle)" }}>
              在文件详情面板点击收藏按钮添加
            </p>
          </div>
        ) : (
          <div className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {favs.map((res) => (
              <div key={res.rid} className="relative group">
                <FileCard
                  resource={res}
                  viewMode="grid"
                  selected={false}
                  onSelect={() => {}}
                  onClick={() => {}}
                />
                {/* 悬浮取消收藏按钮 */}
                <button
                  onClick={() => handleUnfav(res.rid)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-accent)", color: "white" }}
                  title="取消收藏"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
