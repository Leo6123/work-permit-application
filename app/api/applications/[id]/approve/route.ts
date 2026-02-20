import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ehsApprovalRequestSchema, approvalRequestSchema } from "@/lib/validation";
import { notifyDepartmentManager, notifyApplicant, notifyApplicantProgress, notifyEHSManagerRejection, notifyEHSManagerApproval, notifyEHSManager } from "@/lib/notifications";
import { EHS_MANAGER_EMAIL, getDepartmentManagerEmail, canAreaSupervisorApprove, isEHSPermission, isOperationsManagerPermission } from "@/lib/config";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";
import { createClient } from "@/lib/supabase/server";

// POST: 處理審核操作（須登入，且審核人 Email 須為登入者且具該角色權限）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user?.email) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    if (body.approverEmail?.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "審核人 Email 必須與登入帳號一致" },
        { status: 403 }
      );
    }

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

    // 依「權限」判斷審核人員類型（與 Resend 通知用信箱分開）
    const isAreaSupervisor = canAreaSupervisorApprove(body.approverEmail, application.areaSupervisorEmail);
    const isEHSManager = isEHSPermission(body.approverEmail);

    // 根據審核人員類型選擇驗證 schema
    let validationResult;
    if (isEHSManager && application.status === "pending_ehs") {
      // EHS Manager 審核：拒絕時必須填寫附註說明
      validationResult = ehsApprovalRequestSchema.safeParse(body);
    } else {
      // 作業區域主管或營運經理審核：使用一般驗證
      validationResult = approvalRequestSchema.safeParse(body);
    }

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "審核資料驗證失敗", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 驗證作業區域主管審核時，通過時必須提供火警巡查員姓名
    if (isAreaSupervisor && data.action === "approve" && application.status === "pending_area_supervisor") {
      if (!body.fireWatcherName || typeof body.fireWatcherName !== "string" || body.fireWatcherName.trim() === "") {
        return NextResponse.json(
          { error: "作業區域主管審核通過時，必須填寫火警巡查員姓名" },
          { status: 400 }
        );
      }
    }

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
      // 應該由營運經理審核（權限列表：OPERATIONS_MANAGER_PERMISSION_EMAILS 或預設）
      if (!isOperationsManagerPermission(body.approverEmail)) {
        return NextResponse.json(
          { error: "無權限。僅具營運經理權限的帳號可審核此階段。" },
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

    // 記錄審核記錄（department_manager 實際代表營運經理）
    // 根據當前申請狀態判斷審核人類型，而不是根據 Email
    let approverType: string;
    if (application.status === "pending_area_supervisor") {
      approverType = "area_supervisor";
    } else if (application.status === "pending_ehs") {
      approverType = "ehs_manager";
    } else if (application.status === "pending_manager") {
      approverType = "department_manager";
    } else {
      approverType = "unknown";
    }
    
    const approvalLog = await prisma.approvalLog.create({
      data: {
        applicationId: params.id,
        approverType,
        approverEmail: data.approverEmail,
        action: data.action,
        comment: data.comment || null,
      },
    });

    // 更新申請狀態（根據審核人類型，而不是 Email）
    let newStatus: string;
    if (data.action === "reject") {
      newStatus = "rejected";
    } else if (approverType === "area_supervisor") {
      newStatus = "pending_ehs";
    } else if (approverType === "ehs_manager") {
      newStatus = "pending_manager";
    } else if (approverType === "department_manager") {
      newStatus = "approved";
    } else {
      newStatus = "approved";
    }

    // 如果作業區域主管審核通過，更新火警巡查員姓名
    const updateData: any = { status: newStatus };
    if (isAreaSupervisor && data.action === "approve" && body.fireWatcherName) {
      const hazardousOperations = JSON.parse(application.hazardousOperations);
      if (hazardousOperations.hotWorkDetails) {
        hazardousOperations.hotWorkDetails.fireWatcherName = body.fireWatcherName;
        updateData.hazardousOperations = JSON.stringify(hazardousOperations);
      }
    }

    const updatedApplication = await prisma.workPermitApplication.update({
      where: { id: params.id },
      data: updateData,
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
    // 6. EHS Manager 通過 → 通知營運經理
    // 7. 營運經理拒絕 → 通知 EHS Manager + 申請人
    // 8. 營運經理通過 → 通知申請人（完成審查）
    
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
        // 營運經理拒絕：通知 EHS Manager + 申請人
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
    } else if (approverType === "area_supervisor") {
      // 作業區域主管通過（動火作業）：通知 EHS Manager + 通知申請人進度更新
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
      // 同時通知申請人：作業區域主管已審核通過，進入 EHS Manager 審核
      if (application.applicantEmail) {
        await notifyApplicantProgress(
          application.applicantEmail,
          params.id,
          "作業區域主管已審核通過，正在等待 EHS Manager 審核",
          workOrderNumber
        );
      }
    } else if (approverType === "ehs_manager") {
      // EHS Manager 通過：通知營運經理 + 通知申請人進度更新
      console.log("[approve] EHS Manager 通過，準備發送通知：營運經理 + 申請人進度");
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
      // 同時通知申請人：EHS 審核已通過，進入營運經理審核
      if (application.applicantEmail) {
        await notifyApplicantProgress(
          application.applicantEmail,
          params.id,
          "EHS Manager 已審核通過，正在等待營運經理最終審核",
          workOrderNumber
        );
      }
    } else {
      // 營運經理通過：完成審查，通知 EHS Manager + 申請人
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
