import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * 檢查 Supabase（PostgreSQL）連線與存檔是否正常。
 * 部署後可開啟：https://你的網域.vercel.app/api/health
 */
export async function GET() {
  try {
    // 測試 DB 連線：執行簡單查詢
    await prisma.$queryRaw`SELECT 1`;
    // 可選：讀取一筆申請數量，確認表存在且可讀
    const count = await prisma.workPermitApplication.count();
    return NextResponse.json({
      ok: true,
      db: "connected",
      message: "Supabase 連線正常，存檔功能可用",
      applicationsCount: count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[health] DB check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        message: "資料庫連線失敗",
        error: message,
      },
      { status: 503 }
    );
  }
}
