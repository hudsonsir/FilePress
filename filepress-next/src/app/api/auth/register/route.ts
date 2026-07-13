import { NextRequest } from "next/server";
import { hashPassword, setSessionCookie, type SessionUser } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body as {
      username: string; email: string; password: string;
    };

    if (!username?.trim()) return apiError("用户名不能为空");
    if (!email?.trim())    return apiError("邮箱不能为空");
    if (!password)         return apiError("密码不能为空");
    if (password.length < 6) return apiError("密码不能少于 6 位");

    const exists = queryOne(
      `SELECT uid FROM fp_user WHERE username = ? OR email = ? LIMIT 1`,
      [username.trim(), email.trim()]
    );
    if (exists) return apiError("用户名或邮箱已被注册", 409, 409);

    const hashed  = await hashPassword(password);
    const now     = Math.floor(Date.now() / 1000);

    // 第一个注册的用户自动成为管理员
    const isFirst = !queryOne(`SELECT uid FROM fp_user LIMIT 1`);
    const adminid = isFirst ? 1 : 0;

    const { insertId } = execute(
      `INSERT INTO fp_user (username, email, password, nickname, adminid, groupid, status, regdate)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [username.trim(), email.trim(), hashed, username.trim(), adminid, isFirst ? 1 : 9, now]
    );

    const sessionUser: SessionUser = {
      uid: Number(insertId),
      username: username.trim(),
      email: email.trim(),
      groupid: isFirst ? 1 : 9,
      avatar: "",
      spacelimit: 0,
      spaceused: 0,
    };

    await setSessionCookie(sessionUser);
    return apiSuccess(sessionUser, isFirst ? "注册成功，已自动设置为管理员" : "注册成功");
  } catch (err) {
    console.error("[register]", err);
    return apiError("注册失败，请稍后重试", 500, 500);
  }
}
