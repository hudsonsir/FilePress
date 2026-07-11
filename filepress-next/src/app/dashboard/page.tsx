import { getSession } from "@/lib/auth";
import { query, TABLE_PREFIX } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatFileSize, timeAgo } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { LayoutGrid, Clock, HardDrive, Files } from "lucide-react";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let stats = { libraries: 0, totalFiles: 0, totalSize: BigInt(0) };
  let recentLibraries: RowDataPacket[] = [];
  let recentFiles: RowDataPacket[] = [];

  try {
    const [[statsRow]] = await (await import("@/lib/db")).default.execute<RowDataPacket[]>(
      `SELECT
        COUNT(DISTINCT a.appid) AS libraries,
        COUNT(r.rid) AS totalFiles,
        COALESCE(SUM(r.size), 0) AS totalSize
       FROM \`${TABLE_PREFIX}pichome_vapp\` a
       LEFT JOIN \`${TABLE_PREFIX}pichome_resources\` r ON r.appid = a.appid AND r.isdelete = 0
       WHERE a.uid = ? AND a.isdelete = 0`,
      [user.uid]
    );
    stats = statsRow as typeof stats;

    recentLibraries = await query<RowDataPacket[]>(
      `SELECT appid, appname, appdesc,
              (SELECT COUNT(*) FROM \`${TABLE_PREFIX}pichome_resources\` r WHERE r.appid = a.appid AND r.isdelete = 0) AS filecount,
              dateline
       FROM \`${TABLE_PREFIX}pichome_vapp\` a
       WHERE uid = ? AND isdelete = 0
       ORDER BY dateline DESC LIMIT 6`,
      [user.uid]
    );

    recentFiles = await query<RowDataPacket[]>(
      `SELECT r.rid, r.name, r.ext, r.size, r.btime, r.appid
       FROM \`${TABLE_PREFIX}pichome_resources\` r
       INNER JOIN \`${TABLE_PREFIX}pichome_vapp\` a ON a.appid = r.appid AND a.uid = ?
       WHERE r.isdelete = 0
       ORDER BY r.btime DESC LIMIT 8`,
      [user.uid]
    );
  } catch {
    // 数据库未连接，显示空状态
  }

  const statCards = [
    { label: "文件库", value: String(stats.libraries), icon: LayoutGrid, color: "var(--color-primary)" },
    { label: "文件总数", value: String(stats.totalFiles), icon: Files, color: "var(--color-success)" },
    { label: "已用空间", value: formatFileSize(Number(stats.totalSize)), icon: HardDrive, color: "var(--color-accent)" },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 欢迎语 */}
        <div>
          <h1 className="text-xl font-bold mb-1">你好，{user.username}</h1>
          <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
            欢迎回到 FilePress 文件管理系统
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5 flex items-center gap-4"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-foreground-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 我的文件库 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">我的文件库</h2>
          </div>
          {recentLibraries.length === 0 ? (
            <div className="rounded-xl p-8 text-center"
              style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)" }}>
              <p className="text-sm mb-2" style={{ color: "var(--color-foreground-muted)" }}>
                还没有文件库
              </p>
              <p className="text-xs" style={{ color: "var(--color-foreground-subtle)" }}>
                点击左侧侧边栏的 + 号新建一个文件库
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recentLibraries.map((lib) => (
                <Link
                  key={lib.appid}
                  href={`/dashboard/library/${lib.appid}`}
                  className="rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-primary-subtle)" }}>
                      <LayoutGrid className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-foreground-subtle)" }}>
                      {lib.filecount} 个文件
                    </span>
                  </div>
                  <p className="text-sm font-semibold truncate">{lib.appname}</p>
                  {lib.appdesc && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-foreground-muted)" }}>
                      {lib.appdesc}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "var(--color-foreground-subtle)" }}>
                    {timeAgo(lib.dateline)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 最近文件 */}
        {recentFiles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: "var(--color-foreground-muted)" }} />
              <h2 className="text-sm font-semibold">最近添加</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {recentFiles.map((f) => (
                <Link
                  key={f.rid}
                  href={`/dashboard/library/${f.appid}`}
                  className="rounded-lg overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div className="h-24 overflow-hidden" style={{ background: "var(--color-surface-2)" }}>
                    <img
                      src={`/api/thumb/${f.rid}`}
                      alt={f.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs truncate font-medium">{f.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-foreground-subtle)" }}>
                      {timeAgo(f.btime)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
