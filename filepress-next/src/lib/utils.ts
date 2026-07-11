import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number | bigint): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** 格式化时间戳（毫秒或秒） */
export function formatDate(timestamp: number | bigint, mode: "date" | "datetime" = "datetime"): string {
  const n = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const ms = n > 1e12 ? n : n * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "-";
  const pad = (v: number) => String(v).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (mode === "date") return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 相对时间 */
export function timeAgo(timestamp: number | bigint): string {
  const n = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const ms = n > 1e12 ? n : n * 1000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return formatDate(timestamp, "date");
}

/** 获取文件类型大类 */
export function getFileCategory(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "");
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|tif|tiff|raw|psd|ai|eps|cr2|nef|arw)$/.test(e)) return "image";
  if (/^(mp4|avi|mov|wmv|flv|mkv|webm|m4v|ts|rmvb|ogv)$/.test(e)) return "video";
  if (/^(mp3|wav|ogg|m4a|flac|aac|ape|aiff|amr)$/.test(e)) return "audio";
  if (/^(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|md|html|htm)$/.test(e)) return "document";
  if (/^(zip|rar|7z|tar|gz|bz2)$/.test(e)) return "archive";
  return "other";
}

/** 获取文件类型图标颜色 */
export function getFileCategoryColor(category: string): string {
  const map: Record<string, string> = {
    image: "#10b981",
    video: "#8b5cf6",
    audio: "#f59e0b",
    document: "#3b82f6",
    archive: "#f97316",
    other: "#6b7280",
  };
  return map[category] ?? map.other;
}

/** 判断文件是否可预览为图片 */
export function isPreviewableImage(ext: string): boolean {
  return /^(jpg|jpeg|png|gif|webp|svg|bmp|heic|ico)$/i.test(ext.replace(/^\./, ""));
}

/** 判断文件是否为视频 */
export function isVideo(ext: string): boolean {
  return /^(mp4|webm|ogv|m3u8|flv|avi|mov|mkv)$/i.test(ext.replace(/^\./, ""));
}

/** 判断文件是否为音频 */
export function isAudio(ext: string): boolean {
  return /^(mp3|wav|ogg|m4a|flac|aac)$/i.test(ext.replace(/^\./, ""));
}

/** 生成随机 ID（兼容 PHP 的 19 位数字 ID） */
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8).padEnd(6, "0");
}

/** API 响应封装 */
export function apiSuccess<T>(data: T, message = "success") {
  return Response.json({ code: 0, message, data });
}

export function apiError(message: string, code = 400, status = 400) {
  return Response.json({ code, message, data: null }, { status });
}

/** 解析查询参数 */
export function parseIntParam(v: string | null, defaultVal = 1): number {
  const n = parseInt(v ?? "");
  return isNaN(n) ? defaultVal : n;
}
