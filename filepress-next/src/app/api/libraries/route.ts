import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, TABLE_PREFIX } from "@/lib/db";
import { apiSuccess, apiError, generateId } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

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

  return apiSuccess(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json();
  const { appname, appdesc = "", appico = "" } = body as {
    appname: string;
    appdesc?: string;
    appico?: string;
  };

  if (!appname?.trim()) return apiError("库名称不能为空");

  const appid = generateId().slice(0, 6);
  const now = Math.floor(Date.now() / 1000);

  await query(
     `INSERT INTO \`${TABLE_PREFIX}pichome_vapp\`
     (appid, appname, appdesc, appico, uid, username, dateline, isopen, isdelete, disp)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
    [appid, appname.trim(), appdesc.trim(), appico, user.uid, user.username, now]
  );

  const created = await queryOne(
    `SELECT * FROM \`${TABLE_PREFIX}pichome_vapp\` WHERE appid = ?`,
    [appid]
  );

  return apiSuccess(created, "创建成功");
}
