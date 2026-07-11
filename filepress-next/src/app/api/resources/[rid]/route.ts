import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, query, TABLE_PREFIX } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

interface RouteParams {
  params: Promise<{ rid: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const resource = await queryOne<RowDataPacket>(
    `SELECT r.rid, r.name, r.ext, r.type, r.size, r.width, r.height,
            r.btime, r.mtime, r.dateline, r.hasthumb, r.grade, r.appid,
            ra.desc, ra.duration, ra.colors, ra.shape, ra.link,
            ra.smallthumb, ra.largethumb
     FROM \`${TABLE_PREFIX}pichome_resources\` r
     LEFT JOIN \`${TABLE_PREFIX}pichome_resources_attr\` ra ON ra.rid = r.rid
     WHERE r.rid = ? AND r.isdelete = 0`,
    [rid]
  );

  if (!resource) return apiError("文件不存在", 404, 404);

  // 获取文件标签
  const tags = await query<RowDataPacket[]>(
    `SELECT t.tid, t.tagname
     FROM \`${TABLE_PREFIX}pichome_tag\` t
     INNER JOIN \`${TABLE_PREFIX}pichome_resourcestag\` rt ON rt.tid = t.tid
     WHERE rt.rid = ? AND rt.appid = ?`,
    [rid, resource.appid]
  );

  // 获取文件目录
  const folders = await query<RowDataPacket[]>(
    `SELECT f.fid, f.fname
     FROM \`${TABLE_PREFIX}pichome_folder\` f
     INNER JOIN \`${TABLE_PREFIX}pichome_folderresources\` fr ON fr.fid = f.fid
     WHERE fr.rid = ?`,
    [rid]
  );

  return apiSuccess({ ...resource, tags, folders });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json();

  // 更新 grade (评分)
  if (body.grade !== undefined) {
    await query(
      `UPDATE \`${TABLE_PREFIX}pichome_resources\` SET grade = ? WHERE rid = ?`,
      [Math.min(5, Math.max(0, Number(body.grade))), rid]
    );
  }

  // 更新 desc / link
  if (body.desc !== undefined || body.link !== undefined) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.desc !== undefined) { sets.push("`desc` = ?"); vals.push(String(body.desc)); }
    if (body.link !== undefined) { sets.push("`link` = ?"); vals.push(String(body.link)); }
    vals.push(rid);
    await query(
      `UPDATE \`${TABLE_PREFIX}pichome_resources_attr\` SET ${sets.join(", ")} WHERE rid = ?`,
      vals
    );
  }

  return apiSuccess(null, "更新成功");
}
