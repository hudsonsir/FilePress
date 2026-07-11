import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, TABLE_PREFIX } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export async function GET(_req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const shares = await query<RowDataPacket[]>(
    `SELECT id, title, filepath, appid, dateline, endtime,
            username, status, count, downloads, views, stype, perm
     FROM \`${TABLE_PREFIX}pichome_share\`
     WHERE uid = ?
     ORDER BY dateline DESC`,
    [user.uid]
  );

  return apiSuccess(shares);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json();
  const { title = "", filepath, appid, endtime = 0, password = "", count = 0, perm = 1 } = body as {
    title?: string;
    filepath: string;
    appid: string;
    endtime?: number;
    password?: string;
    count?: number;
    perm?: number;
  };

  if (!filepath) return apiError("缺少 filepath 参数");
  if (!appid) return apiError("缺少 appid 参数");

  const now = Math.floor(Date.now() / 1000);

  await query(
    `INSERT INTO \`${TABLE_PREFIX}pichome_share\`
     (title, filepath, appid, dateline, endtime, username, uid, password, status, count, perm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [title, filepath, appid, now, endtime, user.username, user.uid, password, count, perm]
  );

  const [[row]] = await (await import("@/lib/db")).default.execute<RowDataPacket[]>(
    `SELECT LAST_INSERT_ID() AS id`
  );
  const id = (row as RowDataPacket).id;

  return apiSuccess({ id, filepath }, "分享链接已创建");
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("缺少 id 参数");

  const share = await queryOne<RowDataPacket>(
    `SELECT uid FROM \`${TABLE_PREFIX}pichome_share\` WHERE id = ?`,
    [id]
  );
  if (!share) return apiError("分享不存在", 404, 404);
  if (share.uid !== user.uid) return apiError("无权限删除", 403, 403);

  await query(`DELETE FROM \`${TABLE_PREFIX}pichome_share\` WHERE id = ?`, [id]);

  return apiSuccess(null, "删除成功");
}
