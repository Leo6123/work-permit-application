import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRolesForEmail } from "@/lib/auth-roles";
import { isAdmin } from "@/lib/config";

/** GET /api/me：回傳當前登入者 email 與權限（可填單 / EHS / 區域經理 / 營運經理 / 管理者） */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user?.email) {
      return NextResponse.json({ user: null, roles: null });
    }
    const roles = getRolesForEmail(user.email);
    return NextResponse.json({
      user: { email: user.email, id: user.id },
      roles: {
        email: roles.email,
        applicant: roles.applicant,
        canSubmitApplication: roles.canSubmitApplication,
        ehs: roles.ehs,
        areaSupervisor: roles.areaSupervisor,
        operationsManager: roles.operationsManager,
        isAdmin: isAdmin(user.email),
      },
    });
  } catch {
    return NextResponse.json({ user: null, roles: null });
  }
}
