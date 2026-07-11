import { getSession } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET() {
  const user = await getSession();
  if (!user) return apiError("未登录", 401, 401);
  return apiSuccess(user);
}
