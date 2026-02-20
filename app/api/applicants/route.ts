import { NextResponse } from "next/server";
import { getApplicantList } from "@/lib/config";

/** GET /api/applicants：回傳可填單的申請人清單（姓名 + Email），供表單下拉使用 */
export async function GET() {
  const list = getApplicantList();
  return NextResponse.json(list);
}
