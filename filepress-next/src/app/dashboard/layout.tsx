import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query, TABLE_PREFIX } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import type { RowDataPacket } from "mysql2";
import type { Library } from "@/types";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  let libraries: Library[] = [];
  try {
    const rows = await query<RowDataPacket[]>(
      `SELECT a.appid, a.appname, a.appdesc, a.appico, a.dateline,
              a.uid, a.username, a.isopen, a.disp,
              (SELECT COUNT(*) FROM \`${TABLE_PREFIX}pichome_resources\` r
               WHERE r.appid = a.appid AND r.isdelete = 0) AS filecount
       FROM \`${TABLE_PREFIX}pichome_vapp\` a
       WHERE a.uid = ? AND a.isdelete = 0
       ORDER BY a.disp ASC, a.dateline DESC`,
      [user.uid]
    );
    libraries = rows as Library[];
  } catch {
    // 数据库未连接时静默处理，显示空库列表
  }

  return (
    <DashboardShell user={user} libraries={libraries}>
      {children}
    </DashboardShell>
  );
}
