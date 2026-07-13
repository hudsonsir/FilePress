import { NextRequest } from "next/server";
import {
  findUserByCredential,
  verifyPassword,
  setSessionCookie,
  type SessionUser,
} from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, password } = body as { credential: string; password: string };

    if (!credential?.trim() || !password?.trim()) {
      return apiError("用户名/邮箱和密码不能为空", 400);
    }

    // findUserByCredential 现在是同步函数
    const user = findUserByCredential(credential.trim());
    if (!user) return apiError("用户名或密码错误", 401, 401);
    if (user.status !== 0) return apiError("该账户已被禁用，请联系管理员", 403, 403);

    const valid = await verifyPassword(password, user.password);
    if (!valid) return apiError("用户名或密码错误", 401, 401);

    const sessionUser: SessionUser = {
      uid: user.uid,
      username: user.username,
      email: user.email,
      groupid: user.groupid,
      avatar: user.avatar ?? "",
      spacelimit: 0,
      spaceused: 0,
    };

    await setSessionCookie(sessionUser);

    return apiSuccess(
      {
        uid: sessionUser.uid,
        username: sessionUser.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      "登录成功"
    );
  } catch (err) {
    console.error("[auth/login]", err);
    return apiError("服务器错误，请稍后重试", 500, 500);
  }
}
