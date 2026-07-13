import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许外部图片域名（可按需追加）
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // 服务端可用 Node.js 原生模块（better-sqlite3 是 native addon，必须排除打包）
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
  // 关闭 Strict Mode 以减少开发时双重调用
  reactStrictMode: false,
};

export default nextConfig;
