import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { query, queryOne, execute, transaction } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams { params: Promise<{ rid: string }> }

/** GET /api/resources/[rid]/tags — 获取文件已有标签 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const tags = query(
    `SELECT t.tid, t.tagname FROM fp_tag t
     INNER JOIN fp_resourcestag rt ON rt.tid = t.tid
     WHERE rt.rid = ?`,
    [rid]
  );
  return apiSuccess(tags);
}

/** POST /api/resources/[rid]/tags — 为文件添加标签（tagname 或 tid） */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const body = await req.json() as { tagname?: string; tid?: number; appid: string };
  const { appid } = body;
  if (!appid) return apiError("缺少 appid");

  let tid: number | null = null;

  if (body.tid) {
    tid = body.tid;
  } else if (body.tagname?.trim()) {
    const name = body.tagname.trim().slice(0, 60);
    // 查找或创建 tag
    const existing = queryOne<{ tid: number }>(`SELECT tid FROM fp_tag WHERE tagname = ?`, [name]);
    if (existing) {
      tid = existing.tid;
    } else {
      const { insertId } = execute(
        `INSERT INTO fp_tag (tagname, hots, initial, lang) VALUES (?, 0, '', 'zh-CN')`,
        [name]
      );
      tid = Number(insertId);
    }
  } else {
    return apiError("tagname 或 tid 不能为空");
  }

  // 已存在则不重复插入
  const exists = queryOne(
    `SELECT id FROM fp_resourcestag WHERE rid = ? AND tid = ?`,
    [rid, tid]
  );
  if (!exists) {
    transaction(() => {
      execute(`INSERT INTO fp_resourcestag (tid, rid, appid) VALUES (?, ?, ?)`, [tid, rid, appid]);
      execute(`UPDATE fp_tag SET hots = hots + 1 WHERE tid = ?`, [tid]);
    });
  }

  return apiSuccess({ tid }, "标签添加成功");
}

/** DELETE /api/resources/[rid]/tags?tid=xxx — 移除文件标签 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { rid } = await params;
  const user = await getSession();
  if (!user) return apiError("请先登录", 401, 401);

  const { searchParams } = new URL(req.url);
  const tid = searchParams.get("tid");
  if (!tid) return apiError("缺少 tid 参数");

  execute(`DELETE FROM fp_resourcestag WHERE rid = ? AND tid = ?`, [rid, Number(tid)]);
  execute(`UPDATE fp_tag SET hots = MAX(0, hots - 1) WHERE tid = ?`, [Number(tid)]);

  return apiSuccess(null, "标签已移除");
}
