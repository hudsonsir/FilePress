import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const appid = searchParams.get("appid");
  if (!appid) return apiError("缺少 appid 参数");

  const groups = query(
    `SELECT cid, catname, pcid, disp FROM fp_taggroup WHERE appid = ? ORDER BY disp ASC`,
    [appid]
  );

  const tags = query(
    `SELECT t.tid, t.tagname, t.hots, t.initial, tr.cid AS groupid
     FROM fp_tag t
     LEFT JOIN fp_tagrelation tr ON tr.tid = t.tid AND tr.appid = ?
     WHERE EXISTS (SELECT 1 FROM fp_resourcestag rt WHERE rt.tid = t.tid AND rt.appid = ?)
     ORDER BY t.hots DESC, t.tagname ASC`,
    [appid, appid]
  );

  return apiSuccess({ groups, tags });
}
