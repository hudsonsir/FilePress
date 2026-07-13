import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Library } from "@/types";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  let libraries: Library[] = [];
  try {
    libraries = query<Library>(
      `SELECT a.appid, a.appname, a.dateline, a.uid, a.username, a.disp, a.personal,
              (SELECT COUNT(*) FROM fp_resources r WHERE r.appid = a.appid AND r.isdelete = 0) AS filecount
       FROM fp_vapp a
       WHERE a.uid = ? AND a.isdelete = 0
       ORDER BY a.disp ASC, a.dateline DESC`,
      [user.uid]
    );
  } catch {
    // DB 初始化中，静默降级
  }

  return (
    <DashboardShell user={user} libraries={libraries}>
      {children}
    </DashboardShell>
  );
}
