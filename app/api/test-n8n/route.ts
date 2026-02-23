import { NextResponse } from "next/server";

/**
 * GET /api/test-n8n
 * 診斷用：確認 N8N_WEBHOOK_URL 是否設定，並測試呼叫 n8n webhook
 * 部署後開啟：https://你的網域.vercel.app/api/test-n8n
 */
export async function GET() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || null;

  if (!webhookUrl) {
    return NextResponse.json({
      ok: false,
      problem: "N8N_WEBHOOK_URL 未設定（env var 不存在或為空）",
      hint: "請確認 Vercel 環境變數已設定，且已重新部署",
    });
  }

  // 遮蔽 URL 中間部分，避免外洩完整設定
  const maskedUrl =
    webhookUrl.length > 20
      ? webhookUrl.slice(0, 30) + "..." + webhookUrl.slice(-10)
      : webhookUrl;

  let httpStatus: number | null = null;
  let responseBody = "";
  let callOk = false;
  let errorMsg = "";

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "test@example.com",
        subject: "【測試】n8n webhook 連線測試",
        html: "<p>這是一封測試郵件，確認 n8n webhook 正常運作。</p>",
        text: "這是一封測試郵件，確認 n8n webhook 正常運作。",
        fromName: "施工安全作業許可系統",
        fromEmail: "test@example.com",
      }),
    });

    httpStatus = res.status;
    responseBody = await res.text();
    callOk = res.ok;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: callOk,
    webhookUrl: maskedUrl,
    httpStatus,
    responseBody,
    errorMsg: errorMsg || null,
    hint: callOk
      ? "n8n webhook 呼叫成功！若收不到信，請檢查 n8n workflow 內部設定（SMTP/Gmail node）"
      : httpStatus === 404
        ? "404：webhook path 不存在，請確認 n8n workflow 的 webhook path 是否正確"
        : httpStatus === 403
          ? "403：n8n 拒絕請求，可能是 workflow 未啟用（Published）或 plan 限制"
          : httpStatus === null
            ? "fetch 呼叫失敗，可能是網路問題或 URL 格式錯誤"
            : `HTTP ${httpStatus}，請查看 responseBody 了解原因`,
  });
}
