import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  area_supervisor_new: "通知區域主管（新申請）",
  ehs_new: "通知 EHS（新申請）",
  department_manager_new: "通知營運經理（待審）",
  applicant_progress: "通知申請人（進度）",
  applicant_approved: "通知申請人（通過）",
  applicant_rejected: "通知申請人（拒絕）",
  ehs_rejection: "通知 EHS（營運經理拒絕）",
  ehs_approval: "通知 EHS（審查完成）",
};

/** GET /api/admin/dashboard：僅管理者可存取，回傳申請一覽、審核簽署、Email 發送紀錄 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user?.email) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "僅管理者可存取後台" }, { status: 403 });
    }

    const [applications, approvalLogs, emailLogs] = await Promise.all([
      prisma.workPermitApplication.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          applicantName: true,
          applicantEmail: true,
          department: true,
          workArea: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.approvalLog.findMany({
        orderBy: { approvedAt: "desc" },
        include: {
          application: {
            select: { id: true, applicantName: true, workArea: true },
          },
        },
      }),
      prisma.emailLog.findMany({
        orderBy: { sentAt: "desc" },
      }),
    ]);

    const applicationsWithWorkOrder = applications.map((app) => ({
      ...app,
      workOrderNumber: getWorkOrderNumberFromDate(app.createdAt),
    }));

    const approvalLogsWithLabel = approvalLogs.map((log) => ({
      ...log,
      approverTypeLabel:
        log.approverType === "area_supervisor"
          ? "作業區域主管"
          : log.approverType === "ehs_manager"
            ? "EHS Manager"
            : log.approverType === "department_manager"
              ? "營運經理"
              : log.approverType,
    }));

    const emailLogsWithLabel = emailLogs.map((log) => ({
      ...log,
      emailTypeLabel: EMAIL_TYPE_LABELS[log.emailType] || log.emailType,
    }));

    return NextResponse.json({
      applications: applicationsWithWorkOrder,
      approvalLogs: approvalLogsWithLabel,
      emailLogs: emailLogsWithLabel,
    });
  } catch (error) {
    console.error("[admin/dashboard]", error);
    return NextResponse.json(
      { error: "取得後台資料失敗" },
      { status: 500 }
    );
  }
}
