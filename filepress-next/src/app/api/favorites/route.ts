/**
 * 收藏夹 API
 * 使用 fp_resourcestab 表 (gid=0 代表系统收藏夹)
 * GET    /api/favorites?appid=xxx          — 获取收藏列表
 * POST   /api/favorites                    — 收藏文件 { rid, appid }
 * DELETE /api/favorites?rid=xxx&appid=xxx  — 取消收藏
 */
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const appid = searchParams.get("appid");
  if (!appid) return apiError("缺少 appid");

  const rows = query(
    `SELECT r.rid, r.name, r.ext, r.type, r.size, r.width, r.height, r.btime, r.hasthumb
     FROM fp_resources r
     INNER JOIN fp_resourcestab tab ON tab.rid = r.rid AND tab.gid = 0 AND tab.appid = ?
     WHERE r.isdelete = 0
     ORDER BY tab.id DESC`,
    [appid]
  );
  return apiSuccess(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json() as { rid: string; appid: string };
  const { rid, appid } = body;
  if (!rid || !appid) return apiError("缺少 rid 或 appid");

  const already = queryOne(
    `SELECT id FROM fp_resourcestab WHERE rid = ? AND gid = 0 AND appid = ?`,
    [rid, appid]
  );
  if (already) return apiSuccess(null, "已在收藏中");

  execute(
    `INSERT INTO fp_resourcestab (rid, tid, gid, appid) VALUES (?, 0, 0, ?)`,
    [rid, appid]
  );
  return apiSuccess(null, "收藏成功");
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const rid   = searchParams.get("rid");
  const appid = searchParams.get("appid");
  if (!rid || !appid) return apiError("缺少参数");

  execute(
    `DELETE FROM fp_resourcestab WHERE rid = ? AND gid = 0 AND appid = ?`,
    [rid, appid]
  );
  return apiSuccess(null, "已取消收藏");
}
