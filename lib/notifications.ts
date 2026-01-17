// Email 通知模擬服務

interface NotificationData {
  to: string;
  subject: string;
  body: string;
  link?: string;
}

/**
 * 模擬發送 Email 通知（使用 console.log 輸出）
 */
export function sendNotification(data: NotificationData): void {
  console.log("\n" + "=".repeat(60));
  console.log("📧 EMAIL NOTIFICATION");
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
 * 通知 EHS Manager 有新申請需要審核
 */
export function notifyEHSManager(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】新申請待審核",
    body: `您好，

有一份新的施工安全作業許可申請需要您審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊以下連結進行審核：
${link}

此為系統自動發送，請勿直接回覆此郵件。`,
    link,
  });
}

/**
 * 通知部門主管需要審核
 */
export function notifyDepartmentManager(
  managerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  sendNotification({
    to: managerEmail,
    subject: "【施工安全作業許可】申請待最終審核",
    body: `您好，

有一份施工安全作業許可申請已通過 EHS 審核，需要您進行最終審核：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊以下連結進行審核：
${link}

此為系統自動發送，請勿直接回覆此郵件。`,
    link,
  });
}

/**
 * 通知申請人審核結果
 */
export function notifyApplicant(
  applicantEmail: string,
  applicationId: string,
  status: "approved" | "rejected",
  comment?: string,
  workOrderNumber?: string
): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;

  const statusText = status === "approved" ? "已通過" : "已拒絕";
  const commentText = comment ? `\n\n審核意見：\n${comment}` : "";
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  sendNotification({
    to: applicantEmail,
    subject: `【施工安全作業許可】申請${statusText}`,
    body: `您好，

您的施工安全作業許可申請審核結果：${statusText}${workOrderInfo}${commentText}

請點擊以下連結查看詳細資訊：
${link}

此為系統自動發送，請勿直接回覆此郵件。`,
    link,
  });
}

/**
 * 通知 EHS Manager：部門主管拒絕申請
 */
export function notifyEHSManagerRejection(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  rejectionComment?: string,
  workOrderNumber?: string
): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";
  const commentInfo = rejectionComment ? `\n\n拒絕原因：${rejectionComment}` : "";

  sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】申請被部門主管拒絕",
    body: `您好，

您之前審核通過的施工安全作業許可申請已被部門主管拒絕：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}${commentInfo}

請點擊以下連結查看詳情：
${link}

此為系統自動發送，請勿直接回覆此郵件。`,
    link,
  });
}

/**
 * 通知 EHS Manager：申請已完成審查（部門主管通過）
 */
export function notifyEHSManagerApproval(
  ehsManagerEmail: string,
  applicationId: string,
  applicantName: string,
  department: string,
  workArea: string,
  workOrderNumber?: string
): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/applications/${applicationId}`;
  const workOrderInfo = workOrderNumber ? `\n工單編號：${workOrderNumber}` : "";

  sendNotification({
    to: ehsManagerEmail,
    subject: "【施工安全作業許可】申請已完成審查",
    body: `您好，

您之前審核通過的施工安全作業許可申請已完成全部審查流程：${workOrderInfo}

申請人：${applicantName}
部門：${department}
施工區域：${workArea}

請點擊以下連結查看詳情：
${link}

此為系統自動發送，請勿直接回覆此郵件。`,
    link,
  });
}
