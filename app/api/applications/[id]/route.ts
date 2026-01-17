import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

// GET: 查詢單筆申請詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.workPermitApplication.findUnique({
      where: { id: params.id },
      include: {
        approvalLogs: {
          orderBy: {
            approvedAt: "desc",
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申請不存在" },
        { status: 404 }
      );
    }

    // 解析 JSON 字段並添加工單編號
    let formattedApplication;
    try {
      formattedApplication = {
        ...application,
        contractorInfo: JSON.parse(application.contractorInfo),
        hazardFactors: JSON.parse(application.hazardFactors),
        hazardousOperations: JSON.parse(application.hazardousOperations),
        personnelInfo: JSON.parse(application.personnelInfo),
        workOrderNumber: getWorkOrderNumberFromDate(application.createdAt),
      };
    } catch (parseError) {
      console.error("Error parsing JSON fields:", parseError);
      // 如果 JSON 解析失敗，返回原始資料
      formattedApplication = {
        ...application,
        contractorInfo: application.contractorInfo,
        hazardFactors: application.hazardFactors,
        hazardousOperations: application.hazardousOperations,
        personnelInfo: application.personnelInfo,
        workOrderNumber: getWorkOrderNumberFromDate(application.createdAt),
      };
    }

    return NextResponse.json(formattedApplication);
  } catch (error) {
    console.error("Error fetching application:", error);
    const errorMessage = error instanceof Error ? error.message : "查詢申請詳情失敗";
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

// PATCH: 更新申請狀態
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    const application = await prisma.workPermitApplication.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "更新申請狀態失敗" },
      { status: 500 }
    );
  }
}
