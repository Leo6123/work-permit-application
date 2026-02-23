import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 未設定 Auth 時不強制登入（方便本地先跑） */
if (!supabaseUrl || !supabaseKey) {
  console.warn("[auth] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 未設定，登入權限已關閉");
}

/** 不需登入即可存取的路徑 */
const publicPaths = ["/login", "/auth"];
function isPublicPath(pathname: string) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      if (pathname.startsWith("/api/auth/") || pathname === "/api/me" || pathname === "/api/health" || pathname === "/api/test-n8n") return response;
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
