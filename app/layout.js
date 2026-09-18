import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Prof. Yang",
  description: "上傳題目圖片，取得AI詳細解題過程",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prof. Yang",
  },
};

export const viewport = {
  themeColor: "#2b2b2b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
