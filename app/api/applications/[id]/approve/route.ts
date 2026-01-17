import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ehsApprovalRequestSchema, approvalRequestSchema } from "@/lib/validation";
import { notifyDepartmentManager, notifyApplicant, notifyEHSManagerRejection, notifyEHSManagerApproval } from "@/lib/notifications";
import { EHS_MANAGER_EMAIL, getDepartmentManagerEmail } from "@/lib/config";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

// POST: 處理審核操作
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 查詢申請記錄
    const application = await prisma.workPermitApplication.findUnique({
      where: { id: params.id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申請不存在" },
        { status: 404 }
      );
    }

    // 判斷審核人員類型
    const isEHSManager = body.approverEmail === application.ehsManagerEmail ||
                         body.approverEmail === EHS_MANAGER_EMAIL;

    // 根據審核人員類型選擇驗證 schema
    let validationResult;
    if (isEHSManager && application.status === "pending_ehs") {
      // EHS Manager 審核：拒絕時必須填寫附註說明
      validationResult = ehsApprovalRequestSchema.safeParse(body);
    } else {
      // 部門主管審核：使用一般驗證
      validationResult = approvalRequestSchema.safeParse(body);
    }

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "審核資料驗證失敗", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 驗證審核人員權限
    if (isEHSManager && application.status !== "pending_ehs") {
      return NextResponse.json(
        { error: "此申請不在等待 EHS Manager 審核階段" },
        { status: 403 }
      );
    }

    if (!isEHSManager) {
      if (application.status !== "pending_manager") {
        return NextResponse.json(
          { error: "此申請不在等待部門主管審核階段" },
          { status: 403 }
        );
      }

      // 優先使用配置中的部門主管 Email，如果沒有則使用資料庫中保存的值
      const deptManagerEmail = getDepartmentManagerEmail(application.department) || 
                               application.departmentManagerEmail;
      if (!deptManagerEmail) {
        return NextResponse.json(
          { error: "找不到該部門的主管 Email 配置" },
          { status: 500 }
        );
      }
      if (body.approverEmail !== deptManagerEmail) {
        return NextResponse.json(
          { error: `無權限審核此申請。此申請的部門主管 Email 應為：${deptManagerEmail}` },
          { status: 403 }
        );
      }
    }

    // 記錄審核記錄
    const approvalLog = await prisma.approvalLog.create({
      data: {
        applicationId: params.id,
        approverType: isEHSManager ? "ehs_manager" : "department_manager",
        approverEmail: data.approverEmail,
        action: data.action,
        comment: data.comment || null,
      },
    });

    // 更新申請狀態
    let newStatus: string;
    if (data.action === "reject") {
      newStatus = "rejected";
    } else if (isEHSManager) {
      newStatus = "pending_manager";
    } else {
      newStatus = "approved";
    }

    const updatedApplication = await prisma.workPermitApplication.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    // 生成工單編號
    const workOrderNumber = getWorkOrderNumberFromDate(application.createdAt);

    // 根據狀態觸發下一階段通知
    // 通知流程：
    // 1. 提交申請 → 通知 EHS Manager（已在 POST /api/applications 中處理）
    // 2. EHS Manager 拒絕 → 通知申請人
    // 3. EHS Manager 通過 → 通知部門主管
    // 4. 部門主管拒絕 → 通知 EHS Manager + 申請人
    // 5. 部門主管通過 → 通知 EHS Manager + 申請人（完成審查）
    
    if (data.action === "reject") {
      if (isEHSManager) {
        // EHS Manager 拒絕：通知申請人
        if (application.applicantEmail) {
          notifyApplicant(
            application.applicantEmail,
            params.id,
            "rejected",
            data.comment || undefined,
            workOrderNumber
          );
        }
      } else {
        // 部門主管拒絕：通知 EHS Manager + 申請人
        const ehsManagerEmail = application.ehsManagerEmail || EHS_MANAGER_EMAIL;
        if (ehsManagerEmail) {
          notifyEHSManagerRejection(
            ehsManagerEmail,
            params.id,
            application.applicantName,
            application.department,
            application.workArea,
            data.comment || undefined,
            workOrderNumber
          );
        }
        if (application.applicantEmail) {
          notifyApplicant(
            application.applicantEmail,
            params.id,
            "rejected",
            data.comment || undefined,
            workOrderNumber
          );
        }
      }
    } else if (isEHSManager) {
      // EHS Manager 通過：通知部門主管
      const deptManagerEmail = application.departmentManagerEmail || 
                               getDepartmentManagerEmail(application.department);
      if (deptManagerEmail) {
        notifyDepartmentManager(
          deptManagerEmail,
          params.id,
          application.applicantName,
          application.department,
          application.workArea,
          workOrderNumber
        );
      }
    } else {
      // 部門主管通過：完成審查，通知 EHS Manager + 申請人
      const ehsManagerEmail = application.ehsManagerEmail || EHS_MANAGER_EMAIL;
      if (ehsManagerEmail) {
        notifyEHSManagerApproval(
          ehsManagerEmail,
          params.id,
          application.applicantName,
          application.department,
          application.workArea,
          workOrderNumber
        );
      }
      if (application.applicantEmail) {
        notifyApplicant(
          application.applicantEmail,
          params.id,
          "approved",
          undefined,
          workOrderNumber
        );
      }
    }

    return NextResponse.json({
      message: "審核完成",
      application: updatedApplication,
      approvalLog,
    });
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: "審核處理失敗", details: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}
