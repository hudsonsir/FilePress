import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function md5(buf: Buffer): string {
  return crypto.createHash("md5").update(buf).digest("hex");
}
function generateRid(): string {
  return crypto.randomBytes(16).toString("hex");
}
function getType(ext: string): string {
  const e = ext.toLowerCase();
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|heic|tif|tiff|psd|ai|eps|raw|cr2|nef)$/.test(e)) return "image";
  if (/^(mp4|avi|mov|wmv|flv|mkv|webm|m4v|ts)$/.test(e)) return "video";
  if (/^(mp3|wav|ogg|m4a|flac|aac)$/.test(e)) return "audio";
  if (/^(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|csv)$/.test(e)) return "document";
  return "file";
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  try {
    const formData = await req.formData();
    const file  = formData.get("file") as File | null;
    const appid = formData.get("appid") as string | null;
    const fid   = (formData.get("fid") as string | null) ?? "";

    if (!file)  return apiError("未选择文件");
    if (!appid) return apiError("缺少 appid");

    const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "public/uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const buf      = Buffer.from(await file.arrayBuffer());
    const fileMd5  = md5(buf);
    const ext      = path.extname(file.name).slice(1).toLowerCase();
    const rid      = generateRid();
    const now      = Date.now();
    const nowSec   = Math.floor(now / 1000);

    // 按日期分目录存储
    const dateDir  = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const relPath  = `${dateDir}/${rid}.${ext}`;
    const fullPath = path.resolve(uploadDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buf);

    // 写入 resources
    execute(
      `INSERT INTO fp_resources
       (rid, uid, username, appid, name, type, ext, size, btime, mtime, dateline, hasthumb, grade, isdelete, md5)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
      [rid, user.uid, user.username, appid, file.name, getType(ext), ext, buf.length, now, now, nowSec, fileMd5]
    );

    // 写入 resources_attr（INSERT OR IGNORE 避免重复）
    execute(
      `INSERT OR IGNORE INTO fp_resources_attr (rid, appid, file_path, desc_text, link, tag)
       VALUES (?, ?, ?, '', '', '')`,
      [rid, appid, relPath]
    );

    // 如果指定目录，写入 folderresources 并更新 filenum
    if (fid) {
      const folder = queryOne<{ pathkey: string }>(
        `SELECT pathkey FROM fp_folder WHERE fid = ?`, [fid]
      );
      if (folder) {
        execute(
          `INSERT INTO fp_folderresources (rid, fid, appid, pathkey) VALUES (?, ?, ?, ?)`,
          [rid, fid, appid, folder.pathkey]
        );
        execute(`UPDATE fp_folder SET filenum = filenum + 1 WHERE fid = ?`, [fid]);
      }
    }

    // 更新库的文件数
    execute(`UPDATE fp_vapp SET filenum = filenum + 1 WHERE appid = ?`, [appid]);

    return apiSuccess({ rid, name: file.name, ext, size: buf.length, btime: now }, "上传成功");
  } catch (err) {
    console.error("[upload]", err);
    return apiError("上传失败，请稍后重试", 500, 500);
  }
}
