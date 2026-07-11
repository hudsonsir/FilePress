"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FolderOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, password }),
      });
      const data = await res.json();
      if (data.code === 0) {
        router.push("/dashboard");
      } else {
        setError(data.message || "登录失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-sidebar)" }}>
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: "var(--color-sidebar)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--color-sidebar-text)" }}>FilePress</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "white" }}>
            文件驱动型
            <br />
            <span style={{ color: "var(--color-primary)" }}>图库管理系统</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-sidebar-text-muted)" }}>
            多库管理、瀑布流浏览、智能标签分类、AI 辅助标注，
            <br />让文件管理更高效、更直观。
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "多视图模式", desc: "瀑布流 / 网格 / 列表" },
              { label: "标签系统", desc: "多维度文件分类" },
              { label: "收藏夹", desc: "个性化整理方式" },
              { label: "文件分享", desc: "快速生成分享链接" },
            ].map((f) => (
              <div key={f.label} className="rounded-lg p-4" style={{ background: "var(--color-sidebar-item)" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-sidebar-text)" }}>
                  {f.label}
                </div>
                <div className="text-xs" style={{ color: "var(--color-sidebar-text-muted)" }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--color-sidebar-text-muted)" }}>
          &copy; {new Date().getFullYear()} FilePress. 开源协议 AGPL V2
        </p>
      </div>

      {/* 右侧登录区 */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: "var(--color-background)" }}>
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">FilePress</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">欢迎回来</h2>
            <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
              登录以访问您的文件库
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                用户名 / 邮箱
              </label>
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="请输入用户名或邮箱"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--color-foreground-subtle)" }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm px-3.5 py-2.5 rounded-lg" style={{ background: "var(--color-danger-subtle)", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
