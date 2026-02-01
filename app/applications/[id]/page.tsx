"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, User, Building, Calendar, MapPin, FileText, Users, Hash, Download, Printer } from "lucide-react";
import type { ApplicationWithLogs, ApprovalAction } from "@/types/application";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";
import { useRef } from "react";
import HotWorkPermit from "@/components/HotWorkPermit";
import ConfinedSpacePermit from "@/components/ConfinedSpacePermit";
import WorkAtHeightPermit from "@/components/WorkAtHeightPermit";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationWithLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approverEmail: "",
    action: "approve" as ApprovalAction,
    comment: "",
    fireWatcherName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [pdfTemplateHtml, setPdfTemplateHtml] = useState<string | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/applications/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "請求失敗" }));
        throw new Error(errorData.error || `HTTP ${response.status}: 申請不存在`);
      }
      
      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error("Error fetching application:", error);
      setError(error instanceof Error ? error.message : "載入失敗，請檢查終端機是否有錯誤訊息");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!application) return;

    if (!approvalData.approverEmail) {
      setError("請輸入審核人 Email");
      return;
    }

    // 作業區域主管審核通過時，必須填寫火警巡查員姓名
    if (isAreaSupervisorApproval && approvalData.action === "approve" && !approvalData.fireWatcherName.trim()) {
      setError("請輸入火警巡查員姓名");
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${params.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(approvalData),
      });

      const result = await response.json();

      if (!response.ok) {
        // 顯示詳細的錯誤訊息
        const errorMessage = result.error || "審核失敗";
        const details = result.details ? `\n${JSON.stringify(result.details, null, 2)}` : "";
        setError(errorMessage + details);
        setIsApproving(false);
        return;
      }

      await fetchApplication();
      setApprovalData({ approverEmail: "", action: "approve", comment: "", fireWatcherName: "" });
    } catch (err) {
      setError("審核時發生錯誤，請稍後再試");
      setIsApproving(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadPDF = async () => {
    if (!application || !pdfContentRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // 動態導入 PDF 生成庫
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // 臨時顯示 PDF 內容區域以便截圖
      const element = pdfContentRef.current;
      const originalDisplay = element.style.display;
      element.style.display = "block";
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.width = "210mm"; // A4 寬度

      // 等待內容渲染
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 獲取要轉換的內容
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a", // slate-950
        logging: false,
      });

      // 恢復原始樣式
      element.style.display = originalDisplay;
      element.style.position = "";
      element.style.left = "";
      element.style.width = "";

      // 創建 PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png", 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 如果內容超過一頁，需要分頁
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      // 下載 PDF
      const workOrderNumber = application.workOrderNumber || getWorkOrderNumberFromDate(application.createdAt);
      pdf.save(`施工安全作業許可申請_${workOrderNumber}.pdf`);
    } catch (error) {
      console.error("生成 PDF 失敗:", error);
      setError("生成 PDF 失敗，請稍後再試");
      // 確保恢復原始樣式
      if (pdfContentRef.current) {
        pdfContentRef.current.style.display = "none";
        pdfContentRef.current.style.position = "";
        pdfContentRef.current.style.left = "";
        pdfContentRef.current.style.width = "";
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle }> = {
      pending_area_supervisor: { label: "待作業區域主管審核", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30", icon: Clock },
      pending_ehs: { label: "待 EHS 審核", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", icon: Clock },
      pending_manager: { label: "待主管審核", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", icon: Clock },
      approved: { label: "已通過", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30", icon: CheckCircle },
      rejected: { label: "已拒絕", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30", icon: XCircle },
    };
    return statusMap[status] || { label: status, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/30", icon: Clock };
  };

  // 檢查是否應該顯示熱加工操作許可證（在所有 hooks 之前計算）
  const shouldShowHotWorkPermit = application && 
    (application.status === "pending_manager" || application.status === "approved") &&
    application.hazardousOperations?.hotWork === "yes" &&
    application.hazardousOperations?.hotWorkDetails;
  
  const hotWorkDetails = shouldShowHotWorkPermit ? application?.hazardousOperations?.hotWorkDetails : null;

  // 檢查是否應該顯示局限空間許可證（在所有 hooks 之前計算）
  const shouldShowConfinedSpacePermit = application && 
    application.status === "approved" &&
    application.hazardFactors?.confinedSpace === true;

  // 檢查是否應該顯示高處作業許可證（在所有 hooks 之前計算）
  const shouldShowWorkAtHeightPermit = application && 
    application.status === "approved" &&
    application.hazardFactors?.workAtHeight === true;

  // 載入 PDF 範本（必須在所有條件返回之前）
  useEffect(() => {
    const loadPdfTemplate = async () => {
      if (!shouldShowHotWorkPermit || !hotWorkDetails) return;
      
      setIsLoadingTemplate(true);
      try {
        const response = await fetch('/api/pdf/convert?templatePath=templates/hot-work-permit-template.pdf');
        if (response.ok) {
          const data = await response.json();
          if (data.html) {
            setPdfTemplateHtml(data.html);
          }
        } else {
          console.log('PDF 範本不存在，使用預設 HTML 實現');
          setPdfTemplateHtml(null);
        }
      } catch (error) {
        console.error('載入 PDF 範本失敗:', error);
        setPdfTemplateHtml(null);
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadPdfTemplate();
  }, [shouldShowHotWorkPermit, hotWorkDetails]);
  
  const handlePrintPermit = () => {
    window.print();
  };

  // 條件返回（在所有 hooks 之後）
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const status = getStatusConfig(application.status);
  const StatusIcon = status.icon;
  const canApprove = (application.status === "pending_area_supervisor" || application.status === "pending_ehs" || application.status === "pending_manager") && !isApproving;
  const isAreaSupervisorApproval = application.status === "pending_area_supervisor";
  const isEHSManagerApproval = application.status === "pending_ehs";
  const requireCommentOnReject = isEHSManagerApproval && approvalData.action === "reject";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* 背景網格裝飾 */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] pointer-events-none"></div>

      {/* 頂部導航欄 */}
      <nav className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/50 rounded flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">
                SAFETY<span className="text-cyan-400">.OS</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">
                Construction Work Permit System
              </p>
              <p className="text-xs text-slate-500">
                施工安全作業許可線上申請系統
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </nav>

      <main className="relative max-w-4xl mx-auto p-6 z-10 space-y-6">
        {/* 標題與狀態 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">申請詳情</h2>
            <p className="text-slate-400 text-sm font-mono">APPLICATION DETAILS</p>
            {application && (
              <div className="flex items-center gap-2 mt-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-mono text-cyan-400">
                  {application.workOrderNumber || getWorkOrderNumberFromDate(application.createdAt)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {application && application.status === "approved" && (
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPDF ? "生成中..." : "下載 PDF"}
              </button>
            )}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${status.bgColor} border ${status.borderColor}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* PDF 內容區域（用於生成 PDF） */}
        <div ref={pdfContentRef} className="bg-slate-950 p-8 space-y-6" style={{ display: "none" }}>
          {/* PDF 專用內容 */}
          {application && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">施工安全作業許可申請表</h1>
                <p className="text-slate-400 text-sm font-mono">
                  工單編號：{application.workOrderNumber || getWorkOrderNumberFromDate(application.createdAt)}
                </p>
                <p className="text-slate-400 text-sm font-mono mt-1">
                  申請狀態：已通過 | 申請日期：{formatDate(application.createdAt)}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">申請人資訊</h3>
                  <div className="grid grid-cols-2 gap-4 text-slate-300">
                    <div>
                      <span className="text-slate-500">申請人：</span>
                      <span className="ml-2">{application.applicantName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">部門：</span>
                      <span className="ml-2">{application.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email：</span>
                      <span className="ml-2">{application.applicantEmail || "未提供"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">作業時間</h3>
                  <div className="text-slate-300">
                    <div>
                      <span className="text-slate-500">開始時間：</span>
                      <span className="ml-2">{formatDate(application.workTimeStart)}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-500">結束時間：</span>
                      <span className="ml-2">{formatDate(application.workTimeEnd)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">施工資訊</h3>
                  <div className="text-slate-300 space-y-2">
                    <div>
                      <span className="text-slate-500">施工區域：</span>
                      <span className="ml-2">{application.workArea}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">施工內容：</span>
                      <span className="ml-2">{application.workContent}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">工作環境危害因素</h3>
                  <div className="text-slate-300 space-y-1">
                    {application.hazardFactors.generalWork && <div>✓ 一般作業</div>}
                    {application.hazardFactors.hotWork && <div>✓ 動火作業</div>}
                    {application.hazardFactors.confinedSpace && <div>✓ 局限空間</div>}
                    {application.hazardFactors.workAtHeight && <div>✓ 高處作業及電梯維修保養</div>}
                  </div>
                  {(application.hazardFactors as any)?.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-400 mb-2">一般作業危害因素說明：</p>
                      <p className="text-slate-300 whitespace-pre-line bg-slate-900/50 border border-slate-800 rounded p-3">
                        {(application.hazardFactors as any).description}
                      </p>
                    </div>
                  )}
                  {(application.hazardFactors as any)?.otherDescription && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-400 mb-2">其他作業危害因素說明：</p>
                      <p className="text-slate-300 whitespace-pre-line bg-slate-900/50 border border-slate-800 rounded p-3">
                        {(application.hazardFactors as any).otherDescription}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">入廠作業人員</h3>
                  <div className="text-slate-300 space-y-2">
                    <div>
                      <span className="text-slate-500">承攬商名稱：</span>
                      <span className="ml-2">{application.contractorInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">現場負責人：</span>
                      <span className="ml-2">{application.contractorInfo.siteSupervisor}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">施工人員：</span>
                      <span className="ml-2">
                        {Array.isArray(application.contractorInfo.personnel)
                          ? application.contractorInfo.personnel.join("、")
                          : application.contractorInfo.personnel}
                      </span>
                    </div>
                  </div>
                </div>

                {application.approvalLogs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">審核記錄</h3>
                    <div className="space-y-4">
                      {[...application.approvalLogs].sort((a, b) => {
                        // 定義排序優先級：作業區域主管 > EHS Manager > 營運主管
                        const getPriority = (type: string) => {
                          if (type === "area_supervisor") return 1;
                          if (type === "ehs_manager") return 2;
                          if (type === "department_manager") return 3;
                          return 4;
                        };
                        return getPriority(a.approverType) - getPriority(b.approverType);
                      }).map((log) => (
                        <div key={log.id} className="border-l-4 border-cyan-500 pl-4 py-2">
                          <div className="text-slate-300">
                            <div className="font-medium">
                              {log.approverType === "area_supervisor" ? "作業區域主管" : 
                               log.approverType === "ehs_manager" ? "EHS Manager" : "營運主管"}
                            </div>
                            <div className="text-sm text-slate-500">{log.approverEmail}</div>
                            <div className="mt-1">
                              <span className={`px-2 py-1 rounded text-xs ${
                                log.action === "approve"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}>
                                {log.action === "approve" ? "通過" : "拒絕"}
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">{formatDate(log.approvedAt)}</div>
                            {log.comment && (
                              <div className="mt-2 text-sm text-slate-400 bg-slate-800/50 border border-slate-700 rounded p-2">
                                附註說明：{log.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 審核進度 */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            審核進度
          </h3>
          <div className="flex items-center gap-4">
            {/* 作業區域主管審核（僅有動火作業時顯示） */}
            {application.areaSupervisorEmail && (
              <>
                <div className={`flex-1 p-4 rounded-lg border ${
                  application.status === "pending_area_supervisor" 
                    ? "bg-purple-500/10 border-purple-500/30" 
                    : application.approvalLogs.some(log => log.approverType === "area_supervisor" && log.action === "approve") 
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : application.approvalLogs.some(log => log.approverType === "area_supervisor" && log.action === "reject")
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-slate-800/50 border-slate-700"
                }`}>
                  <div className="font-medium text-white">作業區域主管審核</div>
                  <div className={`text-sm mt-1 ${
                    application.status === "pending_area_supervisor" 
                      ? "text-purple-400" 
                      : application.approvalLogs.some(log => log.approverType === "area_supervisor" && log.action === "approve")
                        ? "text-emerald-400"
                        : application.approvalLogs.some(log => log.approverType === "area_supervisor" && log.action === "reject")
                          ? "text-red-400"
                          : "text-slate-500"
                  }`}>
                    {application.approvalLogs.find(log => log.approverType === "area_supervisor") 
                      ? (application.approvalLogs.find(log => log.approverType === "area_supervisor")?.action === "approve" ? "✓ 已通過" : "✗ 已拒絕")
                      : "● 待審核"}
                  </div>
                </div>

                <div className="text-slate-600 text-2xl">→</div>
              </>
            )}

            {/* EHS Manager 審核 */}
            <div className={`flex-1 p-4 rounded-lg border ${
              application.status === "pending_ehs" 
                ? "bg-amber-500/10 border-amber-500/30" 
                : application.approvalLogs.some(log => log.approverType === "ehs_manager" && log.action === "approve") 
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : application.approvalLogs.some(log => log.approverType === "ehs_manager" && log.action === "reject")
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-slate-800/50 border-slate-700"
            }`}>
              <div className="font-medium text-white">EHS Manager 審核</div>
              <div className={`text-sm mt-1 ${
                application.status === "pending_ehs" 
                  ? "text-amber-400" 
                  : application.approvalLogs.some(log => log.approverType === "ehs_manager" && log.action === "approve")
                    ? "text-emerald-400"
                    : application.approvalLogs.some(log => log.approverType === "ehs_manager" && log.action === "reject")
                      ? "text-red-400"
                      : "text-slate-500"
              }`}>
                {application.approvalLogs.find(log => log.approverType === "ehs_manager") 
                  ? (application.approvalLogs.find(log => log.approverType === "ehs_manager")?.action === "approve" ? "✓ 已通過" : "✗ 已拒絕")
                  : application.status === "pending_area_supervisor" ? "○ 等待中" : "● 待審核"}
              </div>
            </div>

            <div className="text-slate-600 text-2xl">→</div>

            {/* 營運主管審核 */}
            <div className={`flex-1 p-4 rounded-lg border ${
              application.status === "pending_manager" 
                ? "bg-amber-500/10 border-amber-500/30" 
                : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "approve") 
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "reject")
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-slate-800/50 border-slate-700"
            }`}>
              <div className="font-medium text-white">營運主管審核</div>
              <div className={`text-sm mt-1 ${
                application.status === "pending_manager" 
                  ? "text-amber-400" 
                  : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "approve")
                    ? "text-emerald-400"
                    : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "reject")
                      ? "text-red-400"
                      : "text-slate-500"
              }`}>
                {application.approvalLogs.find(log => log.approverType === "department_manager")
                  ? (application.approvalLogs.find(log => log.approverType === "department_manager")?.action === "approve" ? "✓ 已通過" : "✗ 已拒絕")
                  : (application.status === "pending_area_supervisor" || application.status === "pending_ehs") ? "○ 等待中" : "● 待審核"}
              </div>
            </div>

            <div className="text-slate-600 text-2xl">→</div>

            {/* 完成 */}
            <div className={`flex-1 p-4 rounded-lg border ${
              application.status === "approved" 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : application.status === "rejected"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-slate-800/50 border-slate-700"
            }`}>
              <div className="font-medium text-white">完成</div>
              <div className={`text-sm mt-1 ${
                application.status === "approved" 
                  ? "text-emerald-400" 
                  : application.status === "rejected"
                    ? "text-red-400"
                    : "text-slate-500"
              }`}>
                {application.status === "approved" ? "✓ 已通過" : application.status === "rejected" ? "✗ 已拒絕" : "○ 未完成"}
              </div>
            </div>
          </div>
        </div>

        {/* 申請資料 */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg backdrop-blur-sm space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            申請資料
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <User className="w-4 h-4" />
                申請人
              </label>
              <p className="text-white text-lg">{application.applicantName}</p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Building className="w-4 h-4" />
                部門
              </label>
              <p className="text-white text-lg">{application.department}</p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Calendar className="w-4 h-4" />
                作業時間開始
              </label>
              <p className="text-white font-mono">{formatDate(application.workTimeStart)}</p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Calendar className="w-4 h-4" />
                作業時間結束
              </label>
              <p className="text-white font-mono">{formatDate(application.workTimeEnd)}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <MapPin className="w-4 h-4" />
                施工區域
              </label>
              <p className="text-white">{application.workArea}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <FileText className="w-4 h-4" />
                施工內容
              </label>
              <p className="text-white">{application.workContent}</p>
            </div>
          </div>

          {/* 工作環境危害因素 */}
          <div className="border-t border-slate-800 pt-6">
            <label className="block text-sm font-medium text-slate-400 mb-3">一般作業的工作環境危害因素</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {application.hazardFactors.generalWork && (
                <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300">✓ 一般作業</span>
              )}
            </div>
            {(() => {
              // 獲取保存的說明，如果沒有則使用默認值
              const savedDescription = (application.hazardFactors as any)?.description;
              const savedOtherDescription = (application.hazardFactors as any)?.otherDescription;
              
              // 默認的一般作業危害因素說明
              const defaultDescription = "一般安全須知及施工安全須知、跌倒、有害物、墜/滾落、物料掉落、感電、火災、溺水、被夾被捲、熱危害、道路及堆高機等";
              
              // 根據勾選的作業類型生成默認的其他作業危害因素說明
              let defaultOtherDescription = "";
              if (application.hazardFactors.hotWork) {
                defaultOtherDescription = "火災";
              } else if (application.hazardFactors.confinedSpace) {
                defaultOtherDescription = "有害物、墜/滾落、物料掉落、感電、火災、溺水";
              } else if (application.hazardFactors.workAtHeight) {
                defaultOtherDescription = "墜/滾落、物料掉落、感電、吊掛、被夾被捲";
              }
              
              // 決定要顯示的內容
              // 如果勾選了一般作業，或者有任何其他作業類型，都顯示一般作業說明
              const hasAnyWorkType = application.hazardFactors.generalWork || 
                                     application.hazardFactors.hotWork || 
                                     application.hazardFactors.confinedSpace || 
                                     application.hazardFactors.workAtHeight;
              const displayDescription = hasAnyWorkType 
                ? (savedDescription || defaultDescription)
                : savedDescription || "";
              const displayOtherDescription = savedOtherDescription || defaultOtherDescription;
              
              return (
                <>
                  {displayDescription && (
                    <div className="mb-4">
                      <p className="text-slate-300 whitespace-pre-line bg-slate-800/50 border border-slate-700 rounded p-3 text-sm">
                        {displayDescription}
                      </p>
                    </div>
                  )}
                  {displayOtherDescription && (
                    <div className={displayDescription ? "mt-4" : ""}>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {application.hazardFactors.hotWork && (
                          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm text-amber-400">✓ 動火作業</span>
                        )}
                        {application.hazardFactors.confinedSpace && (
                          <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400">✓ 局限空間</span>
                        )}
                        {application.hazardFactors.workAtHeight && (
                          <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm text-red-400">✓ 高處作業及電梯維修保養</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-400 mb-2">工作環境危害因素</p>
                      <p className="text-slate-300 whitespace-pre-line bg-slate-800/50 border border-slate-700 rounded p-3 text-sm">
                        {displayOtherDescription}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* 入廠作業人員 */}
          <div className="border-t border-slate-800 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-3">
              <Users className="w-4 h-4" />
              入廠作業人員
            </label>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="font-medium text-cyan-400 mb-2">{application.contractorInfo.name}</div>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="text-slate-500">現場負責人：</span>{application.contractorInfo.siteSupervisor}</p>
                <p>
                  <span className="text-slate-500">施工人員：</span>
                  {Array.isArray(application.contractorInfo.personnel) 
                    ? application.contractorInfo.personnel.join("、")
                    : application.contractorInfo.personnel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 審核記錄 */}
        {application.approvalLogs.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              審核記錄
            </h3>
            <div className="space-y-4">
              {[...application.approvalLogs].sort((a, b) => {
                // 定義排序優先級：作業區域主管 > EHS Manager > 營運主管
                const getPriority = (type: string) => {
                  if (type === "area_supervisor") return 1;
                  if (type === "ehs_manager") return 2;
                  if (type === "department_manager") return 3;
                  return 4;
                };
                return getPriority(a.approverType) - getPriority(b.approverType);
              }).map((log) => (
                <div key={log.id} className={`border-l-4 pl-4 py-2 ${
                  log.action === "approve" ? "border-emerald-500" : "border-red-500"
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">
                        {log.approverType === "area_supervisor" ? "作業區域主管" : 
                         log.approverType === "ehs_manager" ? "EHS Manager" : "營運主管"}
                      </div>
                      <div className="text-sm text-slate-500 font-mono">{log.approverEmail}</div>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action === "approve" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}>
                          {log.action === "approve" ? "通過" : "拒絕"}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 font-mono">{formatDate(log.approvedAt)}</div>
                  </div>
                  {log.comment && (
                    <div className="mt-3 text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded p-3">
                      <span className="text-slate-500">附註說明：</span>{log.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 共同作業擔任指揮、監督及協調之負責人員 */}
        <div className="border-t border-slate-800 pt-6" id="joint-operations-form">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const formContent = document.getElementById('joint-operations-form-content')?.innerHTML || '';
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>共同作業擔任指揮、監督及協調之負責人員</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; }
                          table { width: 100%; border-collapse: collapse; font-size: 12px; }
                          th, td { border: 1px solid #000; padding: 4px; }
                          th { background-color: #f0f0f0; }
                          .signature-area { margin-bottom: 16px; }
                          .signature-line { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; }
                        </style>
                      </head>
                      <body>
                        ${formContent}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              此頁列印表單
            </button>
          </div>
          <div id="joint-operations-form-content" className="bg-white text-black p-4 rounded border-2 border-slate-300 shadow-lg">
            {/* 標題 */}
            <h2 className="text-xl font-bold text-center mb-4">共同作業擔任指揮、監督及協調之負責人員</h2>

            {/* 簽名區域 */}
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-48">廠內承攬作業負責人(監工)簽名:</span>
                <div className="border-b border-black flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-32">承攬商名稱:</span>
                  <div className="border-b border-black flex-1">{application.contractorInfo.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-40">承攬商施工現場負責人簽名:</span>
                  <div className="border-b border-black flex-1">{application.contractorInfo.siteSupervisor}</div>
                </div>
              </div>
              {application.personnelInfo.subcontractors && application.personnelInfo.subcontractors.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-32">再承攬商名稱:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors[0].name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-40">再承攬商施工現場負責人簽名:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors[0].siteSupervisor}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 表格 */}
            <div className="border-2 border-black">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1" colSpan={2}>入廠人員簽署<br/>(以中文正楷簽名)</th>
                    <th className="border border-black p-1" rowSpan={2}>合格證</th>
                    <th className="border border-black p-1" colSpan={2}>廠內承攬作業負責人(監工)確認</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1">類別</th>
                    <th className="border border-black p-1">已接受協議組織須知、安全守則(現場危害告知及防範措施)及承攬商教育訓練</th>
                    <th className="border border-black p-1">合格證過期或無合格證者有效保險證明 (至少三擇一), 未提供者不得入廠 (註:意外險須含意外體傷、意外死亡及失能)</th>
                    <th className="border border-black p-1">確認者簽名</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <tr key={row}>
                      <td className="border border-black p-1 align-top">
                        <div className="flex gap-2">
                          <span>☐ 承攬</span>
                          <span>☐ 再承攬</span>
                        </div>
                      </td>
                      <td className="border border-black p-1 align-top">
                        <div className="border-b border-black mb-1 h-6"></div>
                        <div className="text-center text-[10px]">年 <span className="border-b border-black inline-block w-12"></span> 月 <span className="border-b border-black inline-block w-12"></span> 日</div>
                      </td>
                      <td className="border border-black p-1 align-top">
                        <div className="flex gap-2 flex-wrap">
                          <span>☐ 效期內</span>
                          <span>☐ 已過期</span>
                          <span>☐ 無合格證</span>
                        </div>
                      </td>
                      <td className="border border-black p-1 align-top">
                        <div className="space-y-1 text-[10px]">
                          <div>☐ 勞工職災保險+雇主補償責任險</div>
                          <div>☐ 勞工職災保險+職災團險或意外險</div>
                          <div>☐ 職災團險或意外險保額≥300萬元</div>
                        </div>
                      </td>
                      <td className="border border-black p-1 align-top">
                        <div className="border-b border-black h-8"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 審核表單 */}
        {canApprove && (
          <div className="bg-slate-900/50 border border-cyan-500/30 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              {isAreaSupervisorApproval ? "作業區域主管審核" : isEHSManagerApproval ? "EHS Manager 審核" : "營運主管審核"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  審核人 Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={approvalData.approverEmail}
                  onChange={(e) => setApprovalData({ ...approvalData, approverEmail: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                  placeholder="輸入您的 Email"
                />
              </div>
              {isAreaSupervisorApproval && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    火警巡查員姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={approvalData.fireWatcherName}
                    onChange={(e) => setApprovalData({ ...approvalData, fireWatcherName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                    placeholder="請輸入火警巡查員姓名"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">審核結果</label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="approve"
                      checked={approvalData.action === "approve"}
                      onChange={(e) => setApprovalData({ ...approvalData, action: e.target.value as ApprovalAction })}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all ${
                      approvalData.action === "approve" 
                        ? "border-emerald-500 bg-emerald-500" 
                        : "border-slate-600 group-hover:border-slate-500"
                    }`}>
                      {approvalData.action === "approve" && <span className="w-2 h-2 bg-white rounded-full"></span>}
                    </span>
                    <span className={`${approvalData.action === "approve" ? "text-emerald-400" : "text-slate-400"}`}>通過</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="reject"
                      checked={approvalData.action === "reject"}
                      onChange={(e) => setApprovalData({ ...approvalData, action: e.target.value as ApprovalAction })}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all ${
                      approvalData.action === "reject" 
                        ? "border-red-500 bg-red-500" 
                        : "border-slate-600 group-hover:border-slate-500"
                    }`}>
                      {approvalData.action === "reject" && <span className="w-2 h-2 bg-white rounded-full"></span>}
                    </span>
                    <span className={`${approvalData.action === "reject" ? "text-red-400" : "text-slate-400"}`}>拒絕</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  附註說明 {requireCommentOnReject && <span className="text-red-400">*（至少 10 個字元）</span>}
                </label>
                <textarea
                  value={approvalData.comment}
                  onChange={(e) => setApprovalData({ ...approvalData, comment: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600 resize-none"
                  placeholder={requireCommentOnReject ? "拒絕時必須填寫附註說明" : "選填"}
                />
                {requireCommentOnReject && approvalData.comment.length > 0 && approvalData.comment.length < 10 && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    附註說明至少需要 10 個字元（目前 {approvalData.comment.length} 個字元）
                  </p>
                )}
              </div>
              <button
                onClick={handleApprove}
                disabled={isApproving || !approvalData.approverEmail || (requireCommentOnReject && (!approvalData.comment || approvalData.comment.trim().length < 10))}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded font-medium shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isApproving ? "提交中..." : "提交審核"}
              </button>
            </div>
          </div>
        )}

        {/* 熱加工操作許可證 */}
        {shouldShowHotWorkPermit && hotWorkDetails && (
          <div id="hot-work-permit" className="bg-white text-black print:block">
            {/* 如果 PDF 範本載入成功，顯示轉換後的 HTML */}
            {isLoadingTemplate && (
              <div className="p-8 text-center">
                <p className="text-slate-400">載入 PDF 範本中...</p>
              </div>
            )}
            {!isLoadingTemplate && pdfTemplateHtml && (
              <>
                <div className="print:hidden mb-4 flex justify-end">
                  <button
                    onClick={handlePrintPermit}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    此頁列印許可證
                  </button>
                </div>
                <div 
                  className="pdf-template-container"
                  dangerouslySetInnerHTML={{ __html: pdfTemplateHtml }}
                />
              </>
            )}
            {!isLoadingTemplate && !pdfTemplateHtml && (
              <HotWorkPermit 
                hotWorkDetails={hotWorkDetails}
                workTimeStart={application.workTimeStart}
                workTimeEnd={application.workTimeEnd}
              />
            )}
          </div>
        )}

        {/* 局限空間許可證 */}
        {shouldShowConfinedSpacePermit && application && (
          <div id="confined-space-permit" className="bg-white text-black print:block">
            <ConfinedSpacePermit application={application} />
          </div>
        )}

        {/* 高處作業許可證 */}
        {shouldShowWorkAtHeightPermit && application && (
          <div id="work-at-height-permit" className="bg-white text-black print:block">
            <WorkAtHeightPermit application={application} />
          </div>
        )}
      </main>
      
      {/* 列印樣式已移至 HotWorkPermit 組件 */}
    </div>
  );
}