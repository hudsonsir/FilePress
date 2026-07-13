"use client";

import useSWR from "swr";
import { Share2, Trash2, ExternalLink, Eye, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Share } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function SharesPage() {
  const { data: shares, mutate } = useSWR<Share[]>("/api/shares", fetcher);

  async function handleDelete(id: number) {
    if (!confirm("确认删除该分享链接？")) return;
    await fetch(`/api/shares?id=${id}`, { method: "DELETE" });
    mutate();
  }

  function getStatusLabel(status: number) {
    const map: Record<number, { label: string; color: string }> = {
      0: { label: "正常", color: "var(--color-success)" },
      [-1]: { label: "已过期", color: "var(--color-foreground-muted)" },
      [-2]: { label: "次数耗尽", color: "var(--color-accent)" },
      [-3]: { label: "已屏蔽", color: "var(--color-danger)" },
    };
    return map[status] ?? { label: "未知", color: "var(--color-foreground-muted)" };
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <h1 className="text-lg font-bold">分享管理</h1>
        </div>

        {!shares ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-xl p-12 text-center"
            style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)" }}>
            <Share2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              还没有分享任何文件
            </p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-foreground-muted)" }}>标题/路径</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-foreground-muted)" }}>状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-foreground-muted)" }}>统计</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-foreground-muted)" }}>创建时间</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--color-foreground-muted)" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share, idx) => {
                  const { label, color } = getStatusLabel(share.status);
                  return (
                    <tr
                      key={share.id}
                      style={{ borderBottom: idx < shares.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-xs">{share.title || share.filepath}</p>
                        {share.title && (
                          <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--color-foreground-muted)" }}>
                            {share.filepath}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${color}15`, color }}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{share.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />{share.downloads}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatDate(share.dateline, "date")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/share/${share.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--color-primary)" }}
                            title="查看分享"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(share.id)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--color-danger)" }}
                            title="删除分享"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
