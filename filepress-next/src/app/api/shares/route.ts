import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const shares = query(
    `SELECT id, title, filepath, appid, dateline, endtime,
            username, status, count, downloads, views, stype, perm
     FROM fp_share WHERE uid = ? ORDER BY dateline DESC`,
    [user.uid]
  );

  return apiSuccess(shares);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json();
  const { title = "", filepath, appid, endtime = 0, password = "", count = 0, perm = 1 } = body as {
    title?: string; filepath: string; appid: string;
    endtime?: number; password?: string; count?: number; perm?: number;
  };

  if (!filepath) return apiError("缺少 filepath 参数");
  if (!appid) return apiError("缺少 appid 参数");

  const now = Math.floor(Date.now() / 1000);
  const { insertId } = execute(
    `INSERT INTO fp_share (title, filepath, appid, dateline, endtime, username, uid, password, status, count, perm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [title, filepath, appid, now, endtime, user.username, user.uid, password, count, perm]
  );

  return apiSuccess({ id: Number(insertId), filepath }, "分享链接已创建");
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("缺少 id 参数");

  const share = queryOne<{ uid: number }>(`SELECT uid FROM fp_share WHERE id = ?`, [id]);
  if (!share) return apiError("分享不存在", 404, 404);
  if (share.uid !== user.uid) return apiError("无权限删除", 403, 403);

  execute(`DELETE FROM fp_share WHERE id = ?`, [id]);
  return apiSuccess(null, "删除成功");
}
