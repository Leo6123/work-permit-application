import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

// GET: 查詢單個申請詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    const application = await prisma.workPermitApplication.findUnique({
      where: { id: applicationId },
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
    const formattedApplication = {
      ...application,
      contractorInfo: JSON.parse(application.contractorInfo),
      hazardFactors: JSON.parse(application.hazardFactors),
      hazardousOperations: JSON.parse(application.hazardousOperations),
      personnelInfo: JSON.parse(application.personnelInfo),
      workOrderNumber: getWorkOrderNumberFromDate(application.createdAt),
    };

    return NextResponse.json(formattedApplication);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "查詢申請詳情失敗" },
      { status: 500 }
    );
  }
}

// DELETE: 刪除申請
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    // 檢查申請是否存在
    const application = await prisma.workPermitApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申請記錄不存在" },
        { status: 404 }
      );
    }

    // 刪除相關的審核記錄
    await prisma.approvalLog.deleteMany({
      where: { applicationId: applicationId },
    });

    // 刪除申請記錄
    await prisma.workPermitApplication.delete({
      where: { id: applicationId },
    });

    return NextResponse.json(
      { message: "申請已成功刪除" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "刪除申請失敗" },
      { status: 500 }
    );
  }
}
