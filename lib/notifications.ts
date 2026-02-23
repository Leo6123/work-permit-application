// Email 通知服務 - 支援 n8n Webhook 或 Resend 發送真實郵件
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// n8n Webhook URL（優先使用）
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || null;

// 初始化 Resend（如果有 API Key，且未設定 n8n）
const resend = !N8N_WEBHOOK_URL && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// 部署時若兩者皆未設定，只會 console 模擬、不會真的發信
if (!N8N_WEBHOOK_URL && !resend && process.env.NODE_ENV === 'production') {
  console.warn('[notifications] N8N_WEBHOOK_URL 與 RESEND_API_KEY 皆未設定 - 審核通過時不會發送真實 Email，僅記錄於日誌。');
}

// 發送者 Email（使用 Resend 時需要在 Resend 驗證的網域）
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || '施工安全作業許可系統';

interface NotificationData {
  to: string;
  subject: string;
  body: string;
  link?: string;
  applicationId?: string;
  emailType?: string; // 供後台紀錄：area_supervisor_new, ehs_new, department_manager_new, applicant_progress, applicant_approved, applicant_rejected, ehs_rejection, ehs_approval
}

/**
 * 發送 Email 通知
 * - 如果有設定 RESEND_API_KEY，會發送真實郵件
 * - 否則使用 console.log 輸出（開發模式）
 */
export async function sendNotification(data: NotificationData): Promise<void> {
  // 建立 HTML 郵件內容
  const htmlBody = data.body.replace(/\n/g, '<br>');
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">施工安全作業許可系統</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; line-height: 1.6;">${htmlBody}</p>
        ${data.link ? `
          <div style="margin-top: 20px;">
            <a href="${data.link}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              前往審核
            </a>
          </div>
        ` : ""}
      </div>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          此為系統自動發送，請勿直接回覆此郵件。
        </p>
      </div>
    </div>
  `;

  let success = false;
  let errorMessage: string | null = null;

  if (N8N_WEBHOOK_URL) {
    // 優先使用 n8n Webhook 發信
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          html: htmlContent,
          text: data.body,
          fromName: FROM_NAME,
          fromEmail: FROM_EMAIL,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        errorMessage = `n8n webhook 回傳錯誤 ${response.status}: ${errText}`;
        console.error(`❌ n8n webhook 失敗 to ${data.to}:`, errorMessage);
        logNotification(data);
      } else {
        success = true;
        console.log(`✅ Email 透過 n8n 發送至 ${data.to}`);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ n8n webhook 呼叫失敗 to ${data.to}:`, errorMessage);
      logNotification(data);
    }
  } else if (resend) {
    // 使用 Resend 發信
    try {
      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
        text: data.body,
      });

      if (result.error) {
        errorMessage = JSON.stringify(result.error);
        console.error(`❌ Resend API 回傳錯誤 to ${data.to}:`, errorMessage);
        logNotification(data);
      } else {
        success = true;
        console.log(`✅ Email sent to ${data.to}, id:`, (result as { data?: { id?: string } }).data?.id);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to send email to ${data.to}:`, errorMessage);
      logNotification(data);
    }
  } else {
    logNotification(data);
    errorMessage = "未設定 N8N_WEBHOOK_URL 或 RESEND_API_KEY，未實際發送";
  }

  if (data.applicationId && data.emailType) {
    try {
      await prisma.emailLog.create({
        data: {
          applicationId: data.applicationId,
          to: data.to,
          subject: data.subject,
          emailType: data.emailType,
          success,
          errorMessage,
        },
      });
    } catch (e) {
      console.error("[notifications] 寫入 EmailLog 失敗:", e);
    }
  }
}

/**
 * 使用 console.log 輸出通知（開發模式）
 */
function logNotification(data: NotificationData): void {
  console.log("\n" + "=".repeat(60));
  console.log("📧 EMAIL NOTIFICATION (未發送 - 請設定 Vercel 的 RESEND_API_KEY 以啟用真實發信)");
  console.log("=".repeat(60));
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log("-".repeat(60));
  console.log(data.body);
  if (data.link) {
    console.log(`\nLink: ${data.link}`);
  }
  console.log("=".repeat(60) + "\n");
}

/**
 * 通知作業區域主管有新申請需要審核
 */
export async function notifyAreaSupervisor(
  areaSupervisorEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  areaSupervisor: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: areaSupervisorEmail,
    subject: "【施工安全作業許可】動火作業申請待審核",
    body: `您好 ${areaSupervisor}，

有一份包含動火作業的施工安全作業許可申請需要您優先審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請到網頁內進行審核。`,
    applicationId,
    emailType: "area_supervisor_new",
  });
}

/**
 * 通知 EHS Manager 有新申請需要審核
 */
export async function notifyEHSManager(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】新申請待審核",
    body: `您好，

有一份新的施工安全作業許可申請需要您審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請到網頁內進行審核。`,
    applicationId,
    emailType: "ehs_new",
  });
}

/**
 * 通知營運經理需要審核
 */
export async function notifyDepartmentManager(
  managerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: managerEmail,
    subject: "【施工安全作業許可】申請待營運經理最終審核",
    body: `您好，

有一份施工安全作業許可申請已通過 EHS 審核，需要您進行最終審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請到網頁內進行審核。`,
    applicationId,
    emailType: "department_manager_new",
  });
}

/**
 * 通知申請人：申請進入下一審核階段
 */
export async function notifyApplicantProgress(
  applicantEmail: string,
  applicationId: string,
  stage: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: applicantEmail,
    subject: "【施工安全作業許可】申請審核進度更新",
    body: `您好，

您的施工安全作業許可申請目前進度更新：${workOrderInfo}

目前階段：${stage}

請到網頁內查看詳細資訊。`,
    applicationId,
    emailType: "applicant_progress",
  });
}

/**
 * 通知申請人審核結果
 */
export async function notifyApplicant(
  applicantEmail: string,
  applicationId: string,
  status: "approved" | "rejected",
  comment?: string,
  workOrderNumber?: string
): Promise<void> {
  const statusText = status === "approved" ? "已通過" : "已拒絕";
  const commentText = comment ? `\n\n審核意見：\n${comment}` : "";
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: applicantEmail,
    subject: `【施工安全作業許可】申請${statusText}`,
    body: `您好，

您的施工安全作業許可申請審核結果：${statusText}${workOrderInfo}${commentText}

請到網頁內查看詳細資訊。`,
    applicationId,
    emailType: status === "approved" ? "applicant_approved" : "applicant_rejected",
  });
}

/**
 * 通知 EHS Manager：營運經理拒絕申請
 */
export async function notifyEHSManagerRejection(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  rejectionComment?: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";
  const commentInfo = rejectionComment ? `\n\n拒絕原因：${rejectionComment}` : "";

  await sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】申請被營運經理拒絕",
    body: `您好，

您之前審核通過的施工安全作業許可申請已被營運經理拒絕：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}${commentInfo}

請到網頁內查看詳情。`,
    applicationId,
    emailType: "ehs_rejection",
  });
}

/**
 * 通知 EHS Manager：申請已完成審查（部門主管通過）
 */
export async function notifyEHSManagerApproval(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): Promise<void> {
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】申請已完成審查",
    body: `您好，

您之前審核通過的施工安全作業許可申請已完成全部審查流程：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請到網頁內查看詳情。`,
    applicationId,
    emailType: "ehs_approval",
  });
}
