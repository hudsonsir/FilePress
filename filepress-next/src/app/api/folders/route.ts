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

  const pfid = searchParams.get("pfid") ?? "";

  const folders = query(
    `SELECT fid, pfid, fname, desc_text AS desc, appid, pathkey, filenum, disp, dateline, cover
     FROM fp_folder
     WHERE appid = ? AND pfid = ?
     ORDER BY disp ASC, dateline DESC`,
    [appid, pfid]
  );

  return apiSuccess(folders);
}
