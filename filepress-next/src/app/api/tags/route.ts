import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, TABLE_PREFIX } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const appid = searchParams.get("appid");
  if (!appid) return apiError("缺少 appid 参数");

  // 获取标签分组及其标签
  const groups = await query<RowDataPacket[]>(
    `SELECT tg.cid, tg.catname, tg.pcid, tg.disp
     FROM \`${TABLE_PREFIX}pichome_taggroup\` tg
     WHERE tg.appid = ?
     ORDER BY tg.disp ASC`,
    [appid]
  );

  const tags = await query<RowDataPacket[]>(
    `SELECT t.tid, t.tagname, t.hots, t.initial,
            tr.cid AS groupid
     FROM \`${TABLE_PREFIX}pichome_tag\` t
     LEFT JOIN \`${TABLE_PREFIX}pichome_tagrelation\` tr ON tr.tid = t.tid AND tr.appid = ?
     WHERE EXISTS (
       SELECT 1 FROM \`${TABLE_PREFIX}pichome_resourcestag\` rt
       WHERE rt.tid = t.tid AND rt.appid = ?
     )
     ORDER BY t.hots DESC, t.tagname ASC`,
    [appid, appid]
  );

  return apiSuccess({ groups, tags });
}
