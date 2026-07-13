import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams { params: Promise<{ appid: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = queryOne<{ appid: string; appname: string; uid: number; username: string; disp: number; personal: number; filenum: number; dateline: number }>(
    `SELECT a.appid, a.appname, a.dateline, a.uid, a.username, a.disp, a.personal,
            (SELECT COUNT(*) FROM fp_resources r WHERE r.appid = a.appid AND r.isdelete = 0) AS filenum
     FROM fp_vapp a WHERE a.appid = ? AND a.isdelete = 0`,
    [appid]
  );
  if (!lib) return apiError("文件库不存在", 404, 404);

  if (lib.uid !== user.uid) {
    const member = queryOne(`SELECT id FROM fp_vappmember WHERE appid = ? AND uid = ?`, [appid, user.uid]);
    if (!member) return apiError("无权限访问该库", 403, 403);
  }

  return apiSuccess(lib);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = queryOne<{ uid: number }>(`SELECT uid FROM fp_vapp WHERE appid = ? AND isdelete = 0`, [appid]);
  if (!lib) return apiError("文件库不存在", 404, 404);
  if (lib.uid !== user.uid) return apiError("无权限", 403, 403);

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.appname !== undefined) updates.appname = String(body.appname).trim().slice(0, 60);

  if (Object.keys(updates).length === 0) return apiError("无可更新字段");

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
  execute(`UPDATE fp_vapp SET ${setClauses} WHERE appid = ?`, [...Object.values(updates), appid]);

  return apiSuccess(null, "更新成功");
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { appid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const lib = queryOne<{ uid: number }>(`SELECT uid FROM fp_vapp WHERE appid = ? AND isdelete = 0`, [appid]);
  if (!lib) return apiError("文件库不存在", 404, 404);
  if (lib.uid !== user.uid) return apiError("无权限删除", 403, 403);

  execute(`UPDATE fp_vapp SET isdelete = 1 WHERE appid = ?`, [appid]);
  return apiSuccess(null, "删除成功");
}
