import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { queryOne, TABLE_PREFIX } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "filepress-secret-key-change-in-production"
);
const COOKIE_NAME = "fp_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7天

export interface SessionUser {
  uid: number;
  username: string;
  email: string;
  groupid: number;
  avatar?: string;
  spacelimit: number;
  spaceused: number;
}

export interface Session {
  user: SessionUser;
  iat: number;
  exp: number;
}

/** 生成 JWT Token */
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/** 验证 Token */
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** 设置登录 Cookie */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/** 清除登录 Cookie */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** 获取当前登录用户 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  return session?.user ?? null;
}

/** 密码哈希（兼容 PHP MD5 哈希模式，新密码用 bcrypt） */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** 验证密码（支持 bcrypt 和 MD5 两种模式） */
export async function verifyPassword(
  plain: string,
  hashed: string,
  salt?: string
): Promise<boolean> {
  // bcrypt 模式
  if (hashed.startsWith("$2")) {
    return bcrypt.compare(plain, hashed);
  }
  // PHP 兼容模式：md5(md5(password) + salt)
  if (salt) {
    const crypto = await import("crypto");
    const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");
    return md5(md5(plain) + salt) === hashed;
  }
  return false;
}

/** 通过用户名或邮箱查找用户 */
export async function findUserByCredential(credential: string) {
  return queryOne<{
    uid: number;
    username: string;
    email: string;
    password: string;
    salt: string;
    groupid: number;
    spacelimit: bigint;
    spaceused: bigint;
    status: number;
  }>(
    `SELECT uid, username, email, password, salt, groupid, spacelimit, spaceused, status
     FROM \`${TABLE_PREFIX}ucenter_members\`
     WHERE username = ? OR email = ?
     LIMIT 1`,
    [credential, credential]
  );
}
