import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, query, TABLE_PREFIX } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

interface RouteParams {
  params: Promise<{ appid: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = await queryOne<RowDataPacket>(
    `SELECT a.appid, a.appname, a.appdesc, a.appico, a.dateline,
            a.uid, a.username, a.isopen, a.disp,
            (SELECT COUNT(*) FROM \`${TABLE_PREFIX}pichome_resources\` r
             WHERE r.appid = a.appid AND r.isdelete = 0) AS filecount
     FROM \`${TABLE_PREFIX}pichome_vapp\` a
     WHERE a.appid = ? AND a.isdelete = 0`,
    [appid]
  );

  if (!lib) return apiError("文件库不存在", 404, 404);

  // 权限检查：仅库主或协作成员可访问
  if (lib.uid !== user.uid) {
    const member = await queryOne<RowDataPacket>(
      `SELECT id FROM \`${TABLE_PREFIX}pichome_vappmember\` WHERE appid = ? AND uid = ?`,

      [appid, user.uid]
    );
    if (!member) return apiError("无权限访问该库", 403, 403);
  }

  return apiSuccess(lib);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = await queryOne<RowDataPacket>(
    `SELECT uid FROM \`${TABLE_PREFIX}pichome_vapp\` WHERE appid = ? AND isdelete = 0`,
    [appid]
  );
  if (!lib) return apiError("文件库不存在", 404, 404);
  if (lib.uid !== user.uid) return apiError("无权限", 403, 403);

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.appname !== undefined) updates.appname = String(body.appname).trim().slice(0, 60);
  if (body.appdesc !== undefined) updates.appdesc = String(body.appdesc).trim().slice(0, 200);

  if (Object.keys(updates).length === 0) return apiError("无可更新字段");

  const setClauses = Object.keys(updates).map((k) => `\`${k}\` = ?`).join(", ");
  await query(
    `UPDATE \`${TABLE_PREFIX}pichome_vapp\` SET ${setClauses} WHERE appid = ?`,
    [...Object.values(updates), appid]
  );

  return apiSuccess(null, "更新成功");
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = await queryOne<RowDataPacket>(
    `SELECT uid FROM \`${TABLE_PREFIX}pichome_vapp\` WHERE appid = ? AND isdelete = 0`,
    [appid]
  );
  if (!lib) return apiError("文件库不存在", 404, 404);
  if (lib.uid !== user.uid) return apiError("无权限删除", 403, 403);

  await query(
    `UPDATE \`${TABLE_PREFIX}pichome_vapp\` SET isdelete = 1 WHERE appid = ?`,
    [appid]
  );

  return apiSuccess(null, "删除成功");
}
