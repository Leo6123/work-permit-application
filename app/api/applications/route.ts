import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applicationFormSchema } from "@/lib/validation";
import { notifyEHSManager, notifyAreaSupervisor } from "@/lib/notifications";
import { EHS_MANAGER_EMAIL, getDepartmentManagerEmail, getAreaSupervisorEmail } from "@/lib/config";
import { generateWorkOrderNumber, getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

// GET: 查詢申請列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const applications = await prisma.workPermitApplication.findMany({
      where,
      include: {
        approvalLogs: {
          orderBy: {
            approvedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 解析 JSON 字段並添加工單編號
    const formattedApplications = applications.map((app) => ({
      ...app,
      contractorInfo: JSON.parse(app.contractorInfo),
      hazardFactors: JSON.parse(app.hazardFactors),
      hazardousOperations: JSON.parse(app.hazardousOperations),
      personnelInfo: JSON.parse(app.personnelInfo),
      workOrderNumber: getWorkOrderNumberFromDate(app.createdAt),
    }));

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "查詢申請列表失敗" },
      { status: 500 }
    );
  }
}

// POST: 提交申請
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 驗證表單資料
    const validationResult = applicationFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "表單驗證失敗", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 驗證動火作業邏輯：若勾選動火作業，危險性作業的「動火」必須選擇
    if (data.hazardFactors.hotWork && !data.hazardousOperations.hotWork) {
      return NextResponse.json(
        { error: "若勾選動火作業，危險性作業的「動火」必須選擇「是」或「否」" },
        { status: 400 }
      );
    }

    // 驗證動火作業詳細資訊：當選擇「是」時，必須填寫詳細資訊
    if (data.hazardFactors.hotWork && data.hazardousOperations.hotWork === "yes") {
      if (!data.hazardousOperations.hotWorkDetails) {
        return NextResponse.json(
          { error: "當選擇動火作業「是」時，必須填寫動火作業詳細資訊" },
          { status: 400 }
        );
      }
      // 當選擇承包商時，承包商名稱為必填
      if (data.hazardousOperations.hotWorkDetails.personnelType === "contractor") {
        if (!data.hazardousOperations.hotWorkDetails.contractorName || 
            data.hazardousOperations.hotWorkDetails.contractorName.trim() === "") {
          return NextResponse.json(
            { error: "當選擇承包商時，承包商名稱為必填欄位" },
            { status: 400 }
          );
        }
      }
    }

    // 獲取 EHS Manager 和部門主管 Email
    const ehsManagerEmail = data.ehsManagerEmail || process.env.EHS_MANAGER_EMAIL || "ehs.manager@company.com";
    const departmentManagerEmail = data.departmentManagerEmail || getDepartmentManagerEmail(data.department);

    // 檢查是否有動火作業且選擇「是」
    const hasHotWork = data.hazardFactors.hotWork && data.hazardousOperations.hotWork === "yes";
    let areaSupervisorEmail: string | null = null;
    let initialStatus = "pending_ehs";

    // 如果有動火作業，需要先由作業區域主管審核
    if (hasHotWork && data.hazardousOperations.hotWorkDetails) {
      const areaSupervisor = data.hazardousOperations.hotWorkDetails.areaSupervisor;
      areaSupervisorEmail = getAreaSupervisorEmail(areaSupervisor);
      
      if (!areaSupervisorEmail) {
        return NextResponse.json(
          { error: `找不到作業區域主管「${areaSupervisor}」的 Email 配置` },
          { status: 400 }
        );
      }
      
      initialStatus = "pending_area_supervisor";
    }

    // 處理施工人員：已經在 validation 中轉換為陣列
    const contractorInfo = {
      ...data.personnelInfo.contractor,
    };

    // 生成工單編號
    const workOrderNumber = generateWorkOrderNumber();

    // 儲存到資料庫
    const application = await prisma.workPermitApplication.create({
      data: {
        applicantName: data.applicantName,
        department: data.department,
        workTimeStart: new Date(data.workTimeStart),
        workTimeEnd: new Date(data.workTimeEnd),
        workArea: data.workArea,
        workContent: data.workContent,
        contractorInfo: JSON.stringify(contractorInfo),
        hazardFactors: JSON.stringify(data.hazardFactors),
        hazardousOperations: JSON.stringify({
          ...data.hazardousOperations,
          // hotWorkDetails 已包含在 hazardousOperations 中，會一起被 JSON.stringify
        }),
        personnelInfo: JSON.stringify(data.personnelInfo),
        status: initialStatus,
        ehsManagerEmail,
        departmentManagerEmail,
        areaSupervisorEmail,
        applicantEmail: data.applicantEmail || null,
      },
    });

    // 根據是否有動火作業決定通知對象（使用 await 發送郵件）
    if (hasHotWork && areaSupervisorEmail && data.hazardousOperations.hotWorkDetails) {
      // 通知作業區域主管
      await notifyAreaSupervisor(
        areaSupervisorEmail,
        application.id,
        data.applicantName,
        data.department,
        data.workArea,
        data.hazardousOperations.hotWorkDetails.areaSupervisor,
        workOrderNumber
      );
    } else {
      // 通知 EHS Manager（原有流程）
      await notifyEHSManager(
        ehsManagerEmail,
        application.id,
        data.applicantName,
        data.department,
        data.workArea,
        workOrderNumber
      );
    }

    return NextResponse.json(
      { 
        message: "申請提交成功", 
        id: application.id,
        workOrderNumber: workOrderNumber,
        application: {
          id: application.id,
          status: application.status,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "申請提交失敗", details: error instanceof Error ? error.message : "未知錯誤" },
      { status: 500 }
    );
  }
}
