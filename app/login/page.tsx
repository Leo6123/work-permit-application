"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message === "Invalid login credentials" ? "帳號或密碼錯誤" : err.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("登入時發生錯誤");
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/50 rounded flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">
              SAFETY<span className="text-cyan-400">.OS</span>
            </h1>
            <p className="text-xs text-slate-500">施工安全作業許可線上申請系統</p>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 py-16">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-cyan-400" />
            登入
          </h2>
          <p className="text-slate-400 text-sm mb-6">請使用您的帳號與密碼登入系統</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium py-2.5 rounded transition-colors"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>

          <p className="mt-6 text-slate-500 text-xs">
            帳號由管理員於 Supabase Dashboard → Authentication → Users 建立。
          </p>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans bg-[linear-gradient(rgba(15,23,42,0.9),rgba(15,23,42,0.95)),repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(30,41,59,0.08)_2px,rgba(30,41,59,0.08)_4px)]">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400">載入中...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
