// Email 通知服務 - 使用 Resend 發送真實郵件
import { Resend } from 'resend';

// 初始化 Resend（如果有 API Key）
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// 部署時若未設定 RESEND_API_KEY，只會 console 模擬、不會真的發信
if (!resend && process.env.NODE_ENV === 'production') {
  console.warn('[notifications] RESEND_API_KEY 未設定 - 審核通過時不會發送真實 Email，僅記錄於日誌。請在 Vercel → Project → Settings → Environment Variables 新增 RESEND_API_KEY。');
}

// 發送者 Email（需要在 Resend 驗證的網域，或使用 onboarding@resend.dev 測試）
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || '施工安全作業許可系統';

interface NotificationData {
  to: string;
  subject: string;
  body: string;
  link?: string;
}

/**
 * 發送 Email 通知
 * - 如果有設定 RESEND_API_KEY，會發送真實郵件
 * - 否則使用 console.log 輸出（開發模式）
 */
export async function sendNotification(data: NotificationData): Promise<void> {
  // 建立 HTML 郵件內容
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">施工安全作業許可系統</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="white-space: pre-line; color: #374151; line-height: 1.6;">${data.body}</p>
        ${data.link ? `
          <div style="margin-top: 20px;">
            <a href="${data.link}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              前往審核
            </a>
          </div>
        ` : ''}
      </div>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          此為系統自動發送，請勿直接回覆此郵件。
        </p>
      </div>
    </div>
  `;

  // 如果有 Resend API Key，發送真實郵件
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
        text: data.body, // 純文字版本
      });

      if (result.error) {
        console.error(`❌ Resend API 回傳錯誤 to ${data.to}:`, JSON.stringify(result.error));
        logNotification(data);
      } else {
        console.log(`✅ Email sent to ${data.to}, id:`, (result as { data?: { id?: string } }).data?.id);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      console.error(`❌ Failed to send email to ${data.to}:`, errMsg, errStack || '');
      logNotification(data);
    }
  } else {
    // 沒有 API Key，使用 console.log 模擬（Vercel 上會出現在 Function Logs）
    logNotification(data);
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: areaSupervisorEmail,
    subject: "【施工安全作業許可】動火作業申請待審核",
    body: `您好 ${areaSupervisor}，

有一份包含動火作業的施工安全作業許可申請需要您優先審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊下方按鈕進行審核。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】新申請待審核",
    body: `您好，

有一份新的施工安全作業許可申請需要您審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊下方按鈕進行審核。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: managerEmail,
    subject: "【施工安全作業許可】申請待營運經理最終審核",
    body: `您好，

有一份施工安全作業許可申請已通過 EHS 審核，需要您進行最終審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊下方按鈕進行審核。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: applicantEmail,
    subject: "【施工安全作業許可】申請審核進度更新",
    body: `您好，

您的施工安全作業許可申請目前進度更新：${workOrderInfo}

目前階段：${stage}

請點擊下方按鈕查看詳細資訊。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;

  const statusText = status === "approved" ? "已通過" : "已拒絕";
  const commentText = comment ? `\n\n審核意見：\n${comment}` : "";
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: applicantEmail,
    subject: `【施工安全作業許可】申請${statusText}`,
    body: `您好，

您的施工安全作業許可申請審核結果：${statusText}${workOrderInfo}${commentText}

請點擊下方按鈕查看詳細資訊。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
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

請點擊下方按鈕查看詳情。`,
    link,
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  await sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】申請已完成審查",
    body: `您好，

您之前審核通過的施工安全作業許可申請已完成全部審查流程：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊下方按鈕查看詳情。`,
    link,
  });
}
