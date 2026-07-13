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
    const resource = queryOne<{ name: string; ext: string; file_path: string | null }>(
      `SELECT r.name, r.ext, ra.file_path
       FROM fp_resources r
       LEFT JOIN fp_resources_attr ra ON ra.rid = r.rid
       WHERE r.rid = ? AND r.isdelete = 0`,
      [rid]
    );

    if (!resource) return new Response("Not found", { status: 404 });

    const filePath = resource.file_path?.trim() ?? null;

    if (!filePath) return new Response("File path not found", { status: 404 });

    const uploadBase = process.env.UPLOAD_DIR || "./public/uploads";
    const fullPath = path.resolve(uploadBase, filePath);

    if (!fs.existsSync(fullPath)) {
      return new Response("File not found on disk", { status: 404 });
    }

    const buf = fs.readFileSync(fullPath);
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";

    const extMimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      mp4: "video/mp4", webm: "video/webm",
      mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
      pdf: "application/pdf",
    };
    const mime = extMimeMap[resource.ext.toLowerCase()] || "application/octet-stream";

    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Content-Length": String(buf.length),
    };

    if (isDownload) {
      const filename = encodeURIComponent(resource.name);
      headers["Content-Disposition"] = `attachment; filename*=UTF-8''${filename}`;
    }

    return new Response(buf, { headers });
  } catch {
    return new Response("Server error", { status: 500 });
  }
}
