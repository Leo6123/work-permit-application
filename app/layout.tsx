import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Work Permit Application",
  description: "Work Permit Application System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
