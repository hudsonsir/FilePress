import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FilePress - 文件驱动型图库管理系统",
  description: "多库管理、瀑布流浏览、标签分类、AI智能标注的现代文件图库系统",
};

export const viewport: Viewport = {
  themeColor: "#1a1d23",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} h-full bg-background`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
