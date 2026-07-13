import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, query, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams { params: Promise<{ rid: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const resource = queryOne(
    `SELECT r.rid, r.name, r.ext, r.type, r.size, r.width, r.height,
            r.btime, r.mtime, r.dateline, r.hasthumb, r.grade, r.appid,
            ra.desc_text AS desc, ra.duration, ra.colors, ra.shape, ra.link,
            ra.smallthumb, ra.largethumb
     FROM fp_resources r
     LEFT JOIN fp_resources_attr ra ON ra.rid = r.rid
     WHERE r.rid = ? AND r.isdelete = 0`,
    [rid]
  ) as Record<string, unknown> | null;

  if (!resource) return apiError("文件不存在", 404, 404);

  const tags = query(
    `SELECT t.tid, t.tagname FROM fp_tag t
     INNER JOIN fp_resourcestag rt ON rt.tid = t.tid
     WHERE rt.rid = ? AND rt.appid = ?`,
    [rid, resource.appid]
  );

  const folders = query(
    `SELECT f.fid, f.fname FROM fp_folder f
     INNER JOIN fp_folderresources fr ON fr.fid = f.fid
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

  if (body.grade !== undefined) {
    execute(`UPDATE fp_resources SET grade = ? WHERE rid = ?`,
      [Math.min(5, Math.max(0, Number(body.grade))), rid]);
  }

  if (body.desc !== undefined || body.link !== undefined) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (body.desc !== undefined) { sets.push("desc_text = ?"); vals.push(String(body.desc)); }
    if (body.link !== undefined) { sets.push("link = ?"); vals.push(String(body.link)); }
    vals.push(rid);
    execute(`UPDATE fp_resources_attr SET ${sets.join(", ")} WHERE rid = ?`, vals);
  }

  return apiSuccess(null, "更新成功");
}
