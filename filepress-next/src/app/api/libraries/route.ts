import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError, generateId } from "@/lib/utils";

export async function GET() {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const rows = query(
    `SELECT a.appid, a.appname, a.dateline, a.uid, a.username, a.disp, a.personal, a.filenum,
            (SELECT COUNT(*) FROM fp_resources r WHERE r.appid = a.appid AND r.isdelete = 0) AS filecount
     FROM fp_vapp a
     WHERE a.uid = ? AND a.isdelete = 0
     ORDER BY a.disp ASC, a.dateline DESC`,
    [user.uid]
  );

  return apiSuccess(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json();
  const { appname } = body as { appname: string };
  if (!appname?.trim()) return apiError("库名称不能为空");

  const appid = generateId().slice(0, 6);
  const now = Math.floor(Date.now() / 1000);

  execute(
    `INSERT INTO fp_vapp (appid, appname, uid, username, dateline, isdelete, disp)
     VALUES (?, ?, ?, ?, ?, 0, 0)`,
    [appid, appname.trim(), user.uid, user.username, now]
  );

  const created = queryOne(`SELECT * FROM fp_vapp WHERE appid = ?`, [appid]);
  return apiSuccess(created, "创建成功");
}
