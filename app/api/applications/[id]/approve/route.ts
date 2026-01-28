import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ehsApprovalRequestSchema, approvalRequestSchema } from "@/lib/validation";
import { notifyDepartmentManager, notifyApplicant, notifyEHSManagerRejection, notifyEHSManagerApproval, notifyEHSManager } from "@/lib/notifications";
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
    const isAreaSupervisor = application.areaSupervisorEmail && 
                              body.approverEmail === application.areaSupervisorEmail;
    const isEHSManager = body.approverEmail === application.ehsManagerEmail ||
                         body.approverEmail === EHS_MANAGER_EMAIL;

    // 根據審核人員類型選擇驗證 schema
    let validationResult;
    if (isEHSManager && application.status === "pending_ehs") {
      // EHS Manager 審核：拒絕時必須填寫附註說明
      validationResult = ehsApprovalRequestSchema.safeParse(body);
    } else {
      // 作業區域主管或部門主管審核：使用一般驗證
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
    // 先檢查當前狀態應該由誰審核
    if (application.status === "pending_area_supervisor") {
      // 應該由作業區域主管審核
      if (!isAreaSupervisor) {
        if (application.areaSupervisorEmail) {
          return NextResponse.json(
            { error: `此申請目前等待作業區域主管審核。請使用作業區域主管的 Email：${application.areaSupervisorEmail}` },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            { error: "此申請目前等待作業區域主管審核，但找不到作業區域主管的 Email 配置" },
            { status: 403 }
          );
        }
      }
    } else if (application.status === "pending_ehs") {
      // 應該由 EHS Manager 審核
      if (!isEHSManager) {
        const ehsEmail = application.ehsManagerEmail || EHS_MANAGER_EMAIL;
        return NextResponse.json(
          { error: `此申請目前等待 EHS Manager 審核。請使用 EHS Manager 的 Email：${ehsEmail}` },
          { status: 403 }
        );
      }
    } else if (application.status === "pending_manager") {
      // 應該由部門主管審核
      if (isAreaSupervisor || isEHSManager) {
        // 優先使用配置中的部門主管 Email，如果沒有則使用資料庫中保存的值
        const deptManagerEmail = getDepartmentManagerEmail(application.department) || 
                                 application.departmentManagerEmail;
        if (deptManagerEmail) {
          return NextResponse.json(
            { error: `此申請目前等待部門主管審核。請使用部門主管的 Email：${deptManagerEmail}` },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            { error: "此申請目前等待部門主管審核，但找不到部門主管的 Email 配置" },
            { status: 403 }
          );
        }
      }
      
      // 驗證部門主管 Email
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
    } else {
      // 申請已完成或已拒絕
      return NextResponse.json(
        { error: `此申請狀態為「${application.status}」，無法進行審核` },
        { status: 403 }
      );
    }

    // 記錄審核記錄
    const approverType = isAreaSupervisor ? "area_supervisor" : 
                         isEHSManager ? "ehs_manager" : "department_manager";
    
    const approvalLog = await prisma.approvalLog.create({
      data: {
        applicationId: params.id,
        approverType,
        approverEmail: data.approverEmail,
        action: data.action,
        comment: data.comment || null,
      },
    });

    // 更新申請狀態
    let newStatus: string;
    if (data.action === "reject") {
      newStatus = "rejected";
    } else if (isAreaSupervisor) {
      newStatus = "pending_ehs";
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
    // 1. 提交申請（有動火作業）→ 通知作業區域主管（已在 POST /api/applications 中處理）
    // 2. 提交申請（無動火作業）→ 通知 EHS Manager（已在 POST /api/applications 中處理）
    // 3. 作業區域主管拒絕 → 通知申請人
    // 4. 作業區域主管通過 → 通知 EHS Manager
    // 5. EHS Manager 拒絕 → 通知申請人
    // 6. EHS Manager 通過 → 通知部門主管
    // 7. 部門主管拒絕 → 通知 EHS Manager + 申請人
    // 8. 部門主管通過 → 通知 EHS Manager + 申請人（完成審查）
    
    if (data.action === "reject") {
      if (isAreaSupervisor) {
        // 作業區域主管拒絕：通知申請人
        if (application.applicantEmail) {
          await notifyApplicant(
            application.applicantEmail,
            params.id,
            "rejected",
            data.comment || undefined,
            workOrderNumber
          );
        }
      } else if (isEHSManager) {
        // EHS Manager 拒絕：通知申請人
        if (application.applicantEmail) {
          await notifyApplicant(
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
          await notifyEHSManagerRejection(
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
          await notifyApplicant(
            application.applicantEmail,
            params.id,
            "rejected",
            data.comment || undefined,
            workOrderNumber
          );
        }
      }
    } else if (isAreaSupervisor) {
      // 作業區域主管通過：通知 EHS Manager
      const ehsManagerEmail = application.ehsManagerEmail || EHS_MANAGER_EMAIL;
      if (ehsManagerEmail) {
        await notifyEHSManager(
          ehsManagerEmail,
          params.id,
          application.applicantName,
          application.department,
          application.workArea,
          workOrderNumber
        );
      }
    } else if (isEHSManager) {
      // EHS Manager 通過：通知部門主管
      const deptManagerEmail = application.departmentManagerEmail || 
                               getDepartmentManagerEmail(application.department);
      if (deptManagerEmail) {
        await notifyDepartmentManager(
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
        await notifyEHSManagerApproval(
          ehsManagerEmail,
          params.id,
          application.applicantName,
          application.department,
          application.workArea,
          workOrderNumber
        );
      }
      if (application.applicantEmail) {
        await notifyApplicant(
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
