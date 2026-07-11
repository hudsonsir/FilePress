"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderOpen, Home, Star, Share2, Search,
  Settings, LogOut, ChevronDown, ChevronRight,
  Plus, LayoutGrid, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Library } from "@/types";

interface SidebarProps {
  user: { uid: number; username: string; avatar?: string };
  libraries: Library[];
  onCreateLibrary?: () => void;
}

export function Sidebar({ user, libraries, onCreateLibrary }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [libExpanded, setLibExpanded] = useState(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/dashboard", label: "首页", icon: Home },
    { href: "/dashboard/recent", label: "最近使用", icon: Clock },
    { href: "/dashboard/favorites", label: "我的收藏", icon: Star },
    { href: "/dashboard/shares", label: "分享管理", icon: Share2 },
    { href: "/dashboard/search", label: "全局搜索", icon: Search },
  ];

  return (
    <aside
      className="flex flex-col h-full w-56 shrink-0 select-none"
      style={{ background: "var(--color-sidebar)", borderRight: "1px solid var(--color-sidebar-border)" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--color-primary)" }}>
          <FolderOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-wide" style={{ color: "white" }}>FilePress</span>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
            )}
            style={{
              background: pathname === href ? "var(--color-sidebar-active-bg)" : "transparent",
              color: pathname === href
                ? "var(--color-sidebar-active-text)"
                : "var(--color-sidebar-text)",
            }}
            onMouseEnter={(e) => {
              if (pathname !== href) {
                (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== href) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* 文件库列表 */}
        <div className="pt-3">
          <button
            onClick={() => setLibExpanded(!libExpanded)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-colors"
            style={{ color: "var(--color-sidebar-text-muted)" }}
          >
            <span>文件库</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onCreateLibrary?.(); }}
                className="p-0.5 rounded transition-colors hover:opacity-100 opacity-60"
                style={{ color: "var(--color-sidebar-text)" }}
                title="新建库"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {libExpanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />
              }
            </div>
          </button>

          {libExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {libraries.length === 0 ? (
                <button
                  onClick={onCreateLibrary}
                  className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm transition-colors opacity-60"
                  style={{ color: "var(--color-sidebar-text-muted)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建文件库
                </button>
              ) : (
                libraries.map((lib) => {
                  const href = `/dashboard/library/${lib.appid}`;
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={lib.appid}
                      href={href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
                      style={{
                        background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                        color: active ? "var(--color-sidebar-active-text)" : "var(--color-sidebar-text)",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate flex-1">{lib.appname}</span>
                      <span className="text-xs opacity-40 shrink-0">{lib.filecount ?? ""}</span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </nav>

      {/* 底部用户区 */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid var(--color-sidebar-border)" }}>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
          style={{ color: "var(--color-sidebar-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-sidebar-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Settings className="w-4 h-4" />
          系统设置
        </Link>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
          <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--color-primary)", color: "white" }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <span className="flex-1 text-sm truncate" style={{ color: "var(--color-sidebar-text)" }}>
            {user.username}
          </span>
          <button
            onClick={handleLogout}
            title="退出登录"
            className="transition-colors opacity-60 hover:opacity-100"
            style={{ color: "var(--color-sidebar-text)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
