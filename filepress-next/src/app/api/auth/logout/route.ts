import { clearSessionCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/utils";

export async function POST() {
  await clearSessionCookie();
  return apiSuccess(null, "已退出登录");
}
