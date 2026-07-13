import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{ rid: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;

  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const attr = queryOne<{ file_path: string; smallthumb: number; largethumb: number }>(
      `SELECT file_path, smallthumb, largethumb FROM fp_resources_attr WHERE rid = ?`,
      [rid]
    );

    if (!attr?.file_path) {
      return servePlaceholder();
    }

    const filePath = attr.file_path.trim();
    const { searchParams } = new URL(req.url);
    const size = searchParams.get("size") === "large" ? "large" : "small";

    // 尝试从本地文件系统读取缩略图
    const thumbBase = process.env.THUMB_DIR || "./public/thumbs";
    const thumbName = size === "large" ? `${rid}_large.jpg` : `${rid}_small.jpg`;
    const thumbPath = path.resolve(thumbBase, thumbName);

    if (fs.existsSync(thumbPath)) {
      const buf = fs.readFileSync(thumbPath);
      return new Response(buf, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 尝试原始文件（图片直接返回）
    const uploadBase = process.env.UPLOAD_DIR || "./public/uploads";
    const originalPath = path.resolve(uploadBase, filePath);
    if (fs.existsSync(originalPath)) {
      const buf = fs.readFileSync(originalPath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      };
      return new Response(buf, {
        headers: {
          "Content-Type": mimeMap[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return servePlaceholder();
  } catch {
    return servePlaceholder();
  }
}

function servePlaceholder() {
  // 返回简单的 SVG 占位图
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f1f3f7"/>
    <rect x="70" y="60" width="60" height="80" rx="4" fill="#e2e6ed"/>
    <rect x="80" y="75" width="40" height="4" rx="2" fill="#c9cdd6"/>
    <rect x="80" y="87" width="30" height="4" rx="2" fill="#c9cdd6"/>
    <rect x="80" y="99" width="35" height="4" rx="2" fill="#c9cdd6"/>
  </svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60" },
  });
}
