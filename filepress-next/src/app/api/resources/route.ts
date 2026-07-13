import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { apiSuccess, apiError, parseIntParam } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const appid = searchParams.get("appid");
  const page  = parseIntParam(searchParams.get("page"), 1);
  const pageSize = parseIntParam(searchParams.get("pageSize"), 60);
  const sort  = searchParams.get("sort") || "btime";
  const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";
  const keyword = searchParams.get("keyword") || "";
  const ext   = searchParams.get("ext") || "";
  const fid   = searchParams.get("fid") || "";
  const tagId = searchParams.get("tagId") || "";
  const type  = searchParams.get("type") || "";

  if (!appid) return apiError("缺少 appid 参数");

  const allowedSort: Record<string, string> = {
    btime: "r.btime", mtime: "r.mtime", dateline: "r.dateline",
    name: "r.name",  size: "r.size",
  };
  const sortCol = allowedSort[sort] ?? "r.btime";

  const conditions: string[] = ["r.appid = ?", "r.isdelete = 0"];
  const vals: unknown[] = [appid];

  if (keyword) {
    conditions.push(`(r.name LIKE ? OR ra.searchval LIKE ? OR ra.desc_text LIKE ?)`);
    const kw = `%${keyword}%`;
    vals.push(kw, kw, kw);
  }
  if (ext) { conditions.push(`r.ext = ?`); vals.push(ext.toLowerCase()); }
  if (type) {
    const extMap: Record<string, string[]> = {
      image:    ["jpg","jpeg","png","gif","webp","svg","bmp","heic","tif","tiff","psd","ai","eps","raw"],
      video:    ["mp4","avi","mov","wmv","flv","mkv","webm","m4v","ts"],
      audio:    ["mp3","wav","ogg","m4a","flac","aac","ape"],
      document: ["pdf","doc","docx","xls","xlsx","ppt","pptx","txt","csv","md"],
    };
    const exts = extMap[type];
    if (exts) {
      conditions.push(`r.ext IN (${exts.map(() => "?").join(",")})`);
      vals.push(...exts);
    }
  }

  let joins = `LEFT JOIN fp_resources_attr ra ON ra.rid = r.rid`;
  if (fid) {
    joins += ` INNER JOIN fp_folderresources fr ON fr.rid = r.rid AND fr.fid = ?`;
    vals.push(fid);
  }
  if (tagId) {
    joins += ` INNER JOIN fp_resourcestag rt ON rt.rid = r.rid AND rt.tid = ?`;
    vals.push(tagId);
  }

  const where = conditions.join(" AND ");

  const countRow = queryOne<{ total: number }>(
    `SELECT COUNT(DISTINCT r.rid) AS total FROM fp_resources r ${joins} WHERE ${where}`,
    vals
  );
  const total = countRow?.total ?? 0;

  const offset = (page - 1) * pageSize;
  const rows = query(
    `SELECT r.rid, r.name, r.ext, r.type, r.size, r.width, r.height,
            r.btime, r.mtime, r.dateline, r.hasthumb, r.grade, r.appid,
            ra.desc_text AS desc, ra.duration, ra.colors, ra.shape, ra.link
     FROM fp_resources r
     ${joins}
     WHERE ${where}
     GROUP BY r.rid
     ORDER BY ${sortCol} ${order}
     LIMIT ? OFFSET ?`,
    [...vals, pageSize, offset]
  );

  return apiSuccess({ list: rows, total, page, pageSize });
}
