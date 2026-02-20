"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Shield } from "lucide-react";
import { useState, useEffect } from "react";

type Props = { userEmail: string | null };

type Roles = {
  canSubmitApplication?: boolean;
  ehs?: boolean;
  areaSupervisor?: boolean;
  operationsManager?: boolean;
  isAdmin?: boolean;
} | null;

export function AuthHeader({ userEmail }: Props) {
  const router = useRouter();
  const [roles, setRoles] = useState<Roles>(null);

  useEffect(() => {
    if (!userEmail) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setRoles(data.roles || null))
      .catch(() => setRoles(null));
  }, [userEmail]);

  if (!userEmail) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const labels: { key: keyof NonNullable<Roles>; label: string }[] = [
    { key: "isAdmin", label: "管理者" },
    { key: "canSubmitApplication", label: "可填單" },
    { key: "ehs", label: "EHS審核" },
    { key: "areaSupervisor", label: "區域經理" },
    { key: "operationsManager", label: "營運經理" },
  ];
  const activeRoles = roles ? labels.filter(({ key }) => roles[key]).map(({ label }) => label) : [];

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2">
      <span className="text-slate-400 text-sm truncate max-w-[200px] md:max-w-xs" title={userEmail}>
        {userEmail}
      </span>
      {activeRoles.length > 0 && (
        <span className="flex items-center gap-1.5 text-slate-500 text-xs" title="目前權限">
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">權限：</span>
          <span className="text-cyan-400/90">{activeRoles.join("、")}</span>
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition-colors ml-auto"
      >
        <LogOut className="w-4 h-4" />
        登出
      </button>
    </div>
  );
}
