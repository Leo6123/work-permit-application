import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { AuthHeader } from "@/components/AuthHeader";

const iconHref = `/icon?v=${process.env.VERCEL_GIT_COMMIT_SHA ?? "1"}`;

export const metadata: Metadata = {
  title: "Work Permit Application",
  description: "Work Permit Application System",
  icons: { icon: [{ url: iconHref, type: "image/png", sizes: "32x32" }] },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      userEmail = user?.email ?? null;
    } catch {
      // Supabase Auth 未設定或連線失敗時不顯示登入列
    }
  }

  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" href={iconHref} type="image/png" sizes="32x32" />
      </head>
      <body className="antialiased">
        <AuthHeader userEmail={userEmail} />
        {children}
      </body>
    </html>
  );
}
