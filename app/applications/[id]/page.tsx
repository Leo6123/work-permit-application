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
  const [currentUser, setCurrentUser] = useState<{ email: string; roles: { ehs: boolean; areaSupervisor: boolean; operationsManager: boolean; isAdmin: boolean } } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.email && data.roles) {
          setCurrentUser({ email: data.user.email, roles: data.roles });
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (currentUser?.email && application?.status?.startsWith("pending_")) {
      const isArea = application.status === "pending_area_supervisor";
      const isEhs = application.status === "pending_ehs";
      const isOps = application.status === "pending_manager";
      const can =
        (isArea && (currentUser.roles.isAdmin || (currentUser.roles.areaSupervisor && currentUser.email.toLowerCase() === (application.areaSupervisorEmail || "").toLowerCase()))) ||
        (isEhs && currentUser.roles.ehs) ||
        (isOps && currentUser.roles.operationsManager);
      if (can) {
        setApprovalData((prev) => (prev.approverEmail === currentUser.email ? prev : { ...prev, approverEmail: currentUser.email }));
      }
    }
  }, [currentUser?.email, application?.status]);

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
      timeZone: "Asia/Taipei",
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
      pending_manager: { label: "待營運經理審核", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", icon: Clock },
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

  const handlePrintAll = () => {
    if (!application) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 獲取許可證表單的 HTML
    let permitHtml = '';
    if (shouldShowHotWorkPermit && hotWorkDetails) {
      const permitElement = document.getElementById('hot-work-permit');
      if (permitElement) {
        permitHtml = permitElement.innerHTML;
      }
    } else if (shouldShowConfinedSpacePermit) {
      const permitElement = document.getElementById('confined-space-permit');
      if (permitElement) {
        permitHtml = permitElement.innerHTML;
      }
    } else if (shouldShowWorkAtHeightPermit) {
      const permitElement = document.getElementById('work-at-height-permit');
      if (permitElement) {
        permitHtml = permitElement.innerHTML;
      }
    }

    // 獲取共同作業表單的 HTML
    const jointOperationsElement = document.getElementById('joint-operations-form-content');
    const jointOperationsHtml = jointOperationsElement ? jointOperationsElement.innerHTML : '';

    // 生成申請詳情的 HTML（白底黑字）
    const applicationDetailHtml = `
      <div style="background: white; color: black; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: black;">施工安全作業許可申請表</h1>
          <p style="font-size: 14px; color: #333; margin: 5px 0;">
            工單編號：${application.workOrderNumber || getWorkOrderNumberFromDate(application.createdAt)}
          </p>
          <p style="font-size: 14px; color: #333; margin: 5px 0;">
            申請狀態：已通過 | 申請日期：${formatDate(application.createdAt)}
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">申請人資訊</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #333;">
            <div>
              <span style="color: #666;">申請人：</span>
              <span style="margin-left: 10px;">${application.applicantName}</span>
            </div>
            <div>
              <span style="color: #666;">部門：</span>
              <span style="margin-left: 10px;">${application.department}</span>
            </div>
            <div>
              <span style="color: #666;">Email：</span>
              <span style="margin-left: 10px;">${application.applicantEmail || "未提供"}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">作業時間</h3>
          <div style="color: #333;">
            <div style="margin-bottom: 10px;">
              <span style="color: #666;">開始時間：</span>
              <span style="margin-left: 10px;">${formatDate(application.workTimeStart)}</span>
            </div>
            <div>
              <span style="color: #666;">結束時間：</span>
              <span style="margin-left: 10px;">${formatDate(application.workTimeEnd)}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">施工資訊</h3>
          <div style="color: #333;">
            <div style="margin-bottom: 10px;">
              <span style="color: #666;">施工區域：</span>
              <span style="margin-left: 10px;">${application.workArea}</span>
            </div>
            <div>
              <span style="color: #666;">施工內容：</span>
              <span style="margin-left: 10px;">${application.workContent}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">一般作業的工作環境危害因素</h3>
          <div style="margin-bottom: 15px;">
            ${application.hazardFactors.generalWork ? '<span style="display: inline-block; padding: 5px 15px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; color: #333;">✓ 一般作業</span>' : ''}
            ${application.hazardFactors.hotWork ? '<span style="display: inline-block; padding: 5px 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; color: #856404;">✓ 動火作業</span>' : ''}
            ${application.hazardFactors.confinedSpace ? '<span style="display: inline-block; padding: 5px 15px; background: #fff3cd; border: 1px solid #fd7e14; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; color: #856404;">✓ 局限空間</span>' : ''}
            ${application.hazardFactors.workAtHeight ? '<span style="display: inline-block; padding: 5px 15px; background: #f8d7da; border: 1px solid #dc3545; border-radius: 20px; margin-right: 10px; margin-bottom: 10px; color: #721c24;">✓ 高處作業及電梯維修保養</span>' : ''}
          </div>
          ${(application.hazardFactors as any)?.description ? `
            <div style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; color: #333;">
              ${(application.hazardFactors as any).description}
            </div>
          ` : ''}
          ${(application.hazardFactors as any)?.otherDescription ? `
            <div style="margin-top: 15px;">
              <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">工作環境危害因素</p>
              <div style="padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; color: #333;">
                ${(application.hazardFactors as any).otherDescription}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">入廠作業人員</h3>
          <div style="color: #333;">
            <div style="margin-bottom: 10px;">
              <span style="color: #666;">承攬商名稱：</span>
              <span style="margin-left: 10px;">${application.contractorInfo.name}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <span style="color: #666;">現場負責人：</span>
              <span style="margin-left: 10px;">${application.contractorInfo.siteSupervisor}</span>
            </div>
            <div>
              <span style="color: #666;">施工人員：</span>
              <span style="margin-left: 10px;">
                ${Array.isArray(application.contractorInfo.personnel)
                  ? application.contractorInfo.personnel.join("、")
                  : application.contractorInfo.personnel}
              </span>
            </div>
          </div>
        </div>

        ${application.approvalLogs.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: black;">審核記錄</h3>
            <div>
              ${[...application.approvalLogs].sort((a, b) => {
                const getPriority = (type: string) => {
                  if (type === "area_supervisor") return 1;
                  if (type === "ehs_manager") return 2;
                  if (type === "department_manager") return 3;
                  return 4;
                };
                return getPriority(a.approverType) - getPriority(b.approverType);
              }).map((log) => `
                <div style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border-left: 4px solid ${log.action === "approve" ? "#28a745" : "#dc3545"}; border-radius: 5px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                      <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                        ${log.approverType === "area_supervisor" ? "作業區域主管" : 
                          log.approverType === "ehs_manager" ? "EHS Manager" : "營運經理"}
                      </div>
                      <div style="font-size: 12px; color: #666; font-family: monospace;">${log.approverEmail}</div>
                      <div style="margin-top: 5px;">
                        <span style="display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; 
                          background: ${log.action === "approve" ? "#d4edda" : "#f8d7da"}; 
                          color: ${log.action === "approve" ? "#155724" : "#721c24"}; 
                          border: 1px solid ${log.action === "approve" ? "#c3e6cb" : "#f5c6cb"};">
                          ${log.action === "approve" ? "通過" : "拒絕"}
                        </span>
                      </div>
                    </div>
                    <div style="font-size: 12px; color: #666; font-family: monospace;">${formatDate(log.approvedAt)}</div>
                  </div>
                  ${log.comment ? `
                    <div style="margin-top: 10px; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; color: #333;">
                      <span style="color: #666;">附註說明：</span>${log.comment}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // 組合所有內容
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>施工安全作業許可申請 - 完整列印</title>
          <style>
            body { margin: 0; padding: 0; }
            .page-break { page-break-after: always; }
            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body style="background: white; color: black;">
          ${applicationDetailHtml}
          ${jointOperationsHtml ? `<div class="page-break" style="padding: 20px;">${jointOperationsHtml}</div>` : ''}
          ${permitHtml ? `<div class="page-break" style="padding: 20px;">${permitHtml}</div>` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
    
    // 等待內容載入後列印
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
  const isAreaSupervisorApproval = application.status === "pending_area_supervisor";
  const isEHSManagerApproval = application.status === "pending_ehs";
  const isOperationsManagerApproval = application.status === "pending_manager";
  const hasPermissionForThisStep =
    currentUser &&
    ((isAreaSupervisorApproval && (currentUser.roles.isAdmin || (currentUser.roles.areaSupervisor && currentUser.email.toLowerCase() === (application.areaSupervisorEmail || "").toLowerCase()))) ||
     (isEHSManagerApproval && currentUser.roles.ehs) ||
     (isOperationsManagerApproval && currentUser.roles.operationsManager));
  const canApprove =
    (application.status === "pending_area_supervisor" || application.status === "pending_ehs" || application.status === "pending_manager") &&
    !!hasPermissionForThisStep &&
    !isApproving;
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
              <>
                <button
                  onClick={handlePrintAll}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  列印全部
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? "生成中..." : "下載 PDF"}
                </button>
              </>
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
                // 定義排序優先級：作業區域主管 > EHS Manager > 營運經理
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
                       log.approverType === "ehs_manager" ? "EHS Manager" : "營運經理"}
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

            {/* 營運經理審核 */}
            <div className={`flex-1 p-4 rounded-lg border ${
              application.status === "pending_manager" 
                ? "bg-amber-500/10 border-amber-500/30" 
                : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "approve") 
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : application.approvalLogs.some(log => log.approverType === "department_manager" && log.action === "reject")
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-slate-800/50 border-slate-700"
            }`}>
              <div className="font-medium text-white">營運經理審核</div>
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
                // 定義排序優先級：作業區域主管 > EHS Manager > 營運經理
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
                         log.approverType === "ehs_manager" ? "EHS Manager" : "營運經理"}
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

        {/* 審核表單（僅具該角色權限的登入者可見） */}
        {(application.status === "pending_area_supervisor" || application.status === "pending_ehs" || application.status === "pending_manager") && !canApprove && currentUser && (
          <div className="bg-slate-900/30 border border-slate-600 p-4 rounded-lg text-slate-400 text-sm">
            此階段僅限對應角色審核。您目前登入為 {currentUser.email}，若需審核請使用具「{isAreaSupervisorApproval ? "作業區域主管" : isEHSManagerApproval ? "EHS" : "營運經理"}」權限的帳號。
          </div>
        )}
        {canApprove && (
          <div className="bg-slate-900/50 border border-cyan-500/30 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              {isAreaSupervisorApproval ? "作業區域主管審核" : isEHSManagerApproval ? "EHS Manager 審核" : "營運經理審核"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  審核人 <span className="text-slate-500 font-normal">（以登入帳號審核）</span>
                </label>
                <input
                  type="email"
                  value={approvalData.approverEmail}
                  readOnly
                  className="w-full bg-slate-800 border border-slate-600 text-slate-300 rounded px-3 py-2 cursor-not-allowed"
                  placeholder="登入後自動帶入"
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
              <div 
                className="pdf-template-container"
                dangerouslySetInnerHTML={{ __html: pdfTemplateHtml }}
              />
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

        {/* 安全守則（現場危害告知及防範措施） */}
        <div className="border-t border-slate-800 pt-6" id="joint-operations-form">
          <div id="joint-operations-form-content" className="bg-white text-black p-6 rounded border-2 border-slate-300 shadow-lg">
            <h2 className="text-xl font-bold text-center mb-2">安全守則（現場危害告知及防範措施）</h2>
            <p className="text-center text-sm text-gray-600 mb-6">AVIENT · Page 1/2</p>

            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">一、一般安全須知</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>廠區道路應與堆高機保持 1 公尺以上距離，行走於人行通道，車輛限速 10 公里/小時。</li>
                  <li>未經許可不得觸碰機械設備或攜帶危險物品。</li>
                  <li>飲食僅限於指定區域。</li>
                  <li>依安全標示佩戴防護具（安全鞋、耳塞、口罩、安全帽、護目鏡、防割手套等）。</li>
                  <li>樓梯請握扶手。</li>
                  <li>吸菸僅限於指定吸菸區。</li>
                  <li>發生事故立即通報；火災、地震等緊急狀況請配合疏散。</li>
                  <li>其他未列事項依現場公告及主管指示辦理。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">二、施工安全須知</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li><strong>施工前：</strong>申請作業許可、落實人員與環境安全措施、確認資格與機具、保持通道暢通。</li>
                  <li><strong>施工中：</strong>持續監控狀況、加強安全防護、保護地面與設備。</li>
                  <li><strong>施工後：</strong>清理工作環境、清除廢棄物。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">三、跌倒</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>每日整理環境，避免雜物堆放。</li>
                  <li>物料堆放整齊，不得妨礙通道。</li>
                  <li>工作平面保持平整；無法避免之高低差應設警示或防護。</li>
                  <li>樓梯間、地下室等陰暗處應有足夠照明。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">四、有害物</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>有機溶劑、特定化學品、粉塵作業應依相關預防規則辦理。</li>
                  <li>佩戴適當防塵或防毒面具，並配合局部或整體換氣。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">五、墜/滾落</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>高處作業應符合勞工安全衛生相關規定。</li>
                  <li>開口處（距地面 2 公尺以上）應設護欄或護蓋。</li>
                  <li>無工作台之高處作業應監督佩戴安全帶、使用安全網。</li>
                  <li>梯具應具荷重標示、FRP 材質、防滑等要求。</li>
                  <li>酒後、體弱、懼高、情緒不穩、身體不適或經主管認定不適者，不得從事高處作業。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">六、物料掉落</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>防止高處作業導致物料掉落傷及下方人員。</li>
                  <li>指定區域應佩戴安全帽並扣好帽扣。</li>
                  <li>有物料掉落之虞處應設擋板、踢腳板、斜屏或安全網。</li>
                  <li>嚴禁自高處向下拋擲物品。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">七、感電</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>電氣作業應告知相關人員並指定監護人。</li>
                  <li>切斷電源並上鎖/掛牌後再作業。</li>
                  <li>設備應有漏電斷路器及絕緣；自備設備應使用公司提供之漏電保護插座。</li>
                  <li>手工具絕緣應完整；依電壓佩戴適當防護具。</li>
                  <li>復電依公司程序辦理。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">八、吊掛</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                  <li>劃設作業區，禁止人員通過吊掛物下方。</li>
                  <li>吊鉤應有防滑舌片。</li>
                  <li>不得超過額定荷重。</li>
                </ol>
              </section>
            </div>

            {/* 安全守則第二頁：列印時從新頁開始 */}
            <div className="mt-8 pt-6 border-t border-gray-300 print:border-t-0 print:pt-0 print:mt-0" style={{ pageBreakBefore: "always" }}>
              <h2 className="text-xl font-bold text-center mb-2 print:block">安全守則（現場危害告知及防範措施）</h2>
              <p className="text-center text-sm text-gray-600 mb-6">AVIENT · Page 2/2</p>
              <div className="space-y-6 text-sm">
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">九、火災</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                    <li>嚴禁於易燃物品堆放處使用明火。</li>
                    <li>焊接作業附近如有易燃物應移開或鋪蓋防火毯。</li>
                    <li>乙炔、氧氣鋼瓶應豎立固定；戶外放置須有防曬防雨措施。</li>
                    <li>秤重區、混料區、集塵系統等粉塵區域嚴禁吸菸與未經許可之動火；電氣設備應接地；清掃防止粉塵飛揚；清除粉塵嚴禁使用氣槍，應使用集塵設備。</li>
                  </ol>
                </section>
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">十、缺氧及中毒</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                    <li>缺氧危險場所應依「缺氧症預防規則」辦理。</li>
                    <li>作業前測定氧氣濃度，未介於 19.5%~23.5% 禁止進入。</li>
                    <li>進入桶槽、儲槽、人孔、管道等應先通風換氣，作業中持續通風；有害物濃度低於容許濃度；指定監視人員不得離開。</li>
                  </ol>
                </section>
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">十一、溺水</h3>
                  <p className="text-gray-800">地下室、儲水槽及廢水槽入內作業前應將積水抽乾，避免人員不慎掉落溺斃。</p>
                </section>
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">十二、被夾被捲</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                    <li>原動機、轉軸、齒輪、帶輪、傳動帶等有危害之虞部分應有護罩護圍。</li>
                    <li>動力機械具顯著危險者應於適當位置設置明顯標誌之緊急制動裝置。</li>
                    <li>輸送帶捲入作業有被捲被夾之虞者應設置護圍。</li>
                  </ol>
                </section>
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">十三、熱危害</h3>
                  <p className="text-gray-800">接近 40°C 以上高溫灼熱物體工作時，應穿著熱防護設備，並充分補充飲用水及鹽分。</p>
                </section>
                <section>
                  <h3 className="font-bold text-base border-b border-gray-300 pb-1 mb-2">十四、道路及堆高機</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                    <li>入廠人員及車輛應遵守廠區道路交通安全規則及交通標示、警衛管制、警示設備。</li>
                    <li>廠區內車輛限速 10 公里/小時；卸貨及工具停放於指定區域；路口禮讓行人與車輛。</li>
                    <li>借用廠內堆高機須持有效合格證向警衛室或管理單位借用；操作時佩戴安全帽並扣好帽扣；堆高機禁止載人或以貨叉托高人員。</li>
                    <li>廠區全域為堆高機作業區，外部車輛入廠請保持警戒；接近堆高機時鳴喇叭並保持安全距離。</li>
                  </ol>
                </section>
              </div>
            </div>

            {/* 承攬作業擔任指揮、監督及協調之負責人員（接續在安全守則之後，列印時新頁） */}
            <div className="mt-8 pt-6 border-t-2 border-gray-400" style={{ pageBreakBefore: "always" }}>
              <h2 className="text-xl font-bold text-center mb-4">承攬作業擔任指揮、監督及協調之負責人員</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap">台灣埃萬特監工簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">承攬商公司名稱:</span>
                    <div className="border-b border-black flex-1">{application.contractorInfo.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">承攬商施工現場負責人簽名:</span>
                    <div className="border-b border-black flex-1">{application.contractorInfo.siteSupervisor}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商1公司名稱:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[0]?.name ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商1施工現場負責人簽名:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[0]?.siteSupervisor ?? ""}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商2公司名稱:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[1]?.name ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商2施工現場負責人簽名:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[1]?.siteSupervisor ?? ""}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商3公司名稱:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[2]?.name ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">再承攬商3施工現場負責人簽名:</span>
                    <div className="border-b border-black flex-1">{application.personnelInfo.subcontractors?.[2]?.siteSupervisor ?? ""}</div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 text-center" colSpan={2}>承攬/再承攬入廠人員確認</th>
                      <th className="border border-black p-1 text-center" colSpan={2}>台灣埃萬特監工審核</th>
                    </tr>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 w-16">類別</th>
                      <th className="border border-black p-1">本人已提供保險證明(職災保險及意外險)、接受貴司承攬商教育訓練(含協議組織須知、現場危害告知及防範措施)並熟知安全相關規範</th>
                      <th className="border border-black p-1">
                        <div>保險證明(職災保險及意外險)</div>
                        <div className="font-normal text-[10px]">註1：職保屬職業工會保險需提供在職證明</div>
                        <div className="font-normal text-[10px]">註2：意外險含意外體傷、意外死亡及失能</div>
                      </th>
                      <th className="border border-black p-1 w-16">簽名及日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                      <tr key={row}>
                        <td className="border border-black p-1 align-top">
                          <div className="flex flex-col gap-1">
                            <span>☐ 承攬</span>
                            <span>☐ 再承攬</span>
                          </div>
                        </td>
                        <td className="border border-black p-1 align-top">
                          <div className="text-[10px] mb-1">簽名及日期：</div>
                          <div className="border-b border-black h-5 mb-1"></div>
                          <div className="text-center text-[10px]">年 <span className="border-b border-black inline-block w-8"></span> 月 <span className="border-b border-black inline-block w-8"></span> 日</div>
                        </td>
                        <td className="border border-black p-1 align-top">
                          <div className="space-y-1 text-[10px]">
                            <div>☐ 以承攬/再承攬公司名稱投保職災保險(職業工會保險需提供在職證明)</div>
                            <div>☐ 以承攬/再承攬公司名稱投保金額300萬元</div>
                            <div>☐ 以上之意外險(保單內容要有人員名單)</div>
                          </div>
                          <div className="text-[10px] mt-1">簽名及日期：</div>
                          <div className="border-b border-black h-5 mb-1"></div>
                          <div className="text-center text-[10px]">年 <span className="border-b border-black inline-block w-8"></span> 月 <span className="border-b border-black inline-block w-8"></span> 日</div>
                        </td>
                        <td className="border border-black p-1 align-middle"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 text-xs">
                <span className="font-bold">注意事項：</span>
                施工期間應將施工許可申請表、本表單、機械設備器具檢查表、危險性許可作業申請表(動火、高處、局限空間)放至工作現場以備查核；施工完畢後將表單交回環安備查。
              </div>
            </div>

            {/* 機械設備器具檢查表 第1頁/共3頁（接續，列印時新頁） */}
            <div className="mt-8 pt-6 border-t-2 border-gray-400" style={{ pageBreakBefore: "always" }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono">7.0.T.F02</span>
                <span className="text-xs">第1頁/共3頁</span>
              </div>
              <h2 className="text-xl font-bold text-center mb-4">機械設備器具檢查表</h2>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap">檢查人員:</span>
                  <div className="border-b border-black flex-1 max-w-xs"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap">檢查日期:</span>
                  <span className="border-b border-black inline-block w-12 text-center"></span> 年
                  <span className="border-b border-black inline-block w-10 text-center mx-1"></span> 月
                  <span className="border-b border-black inline-block w-10 text-center mx-1"></span> 日
                </div>
              </div>
              <div className="text-sm mb-4 text-gray-700">
                <span className="font-bold">檢查方式：</span>
                1.攜入前由工程部檢查並核發檢查合格證(有效期限6個月)供張貼；2.入廠後由工廠不定時檢查是否張貼檢查合格證。
              </div>
              <div className="border-2 border-black">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 w-32">機具名稱</th>
                      <th className="border border-black p-2">檢查結果</th>
                      <th className="border border-black p-2 w-24">備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                      <tr key={row}>
                        <td className="border border-black p-1 align-top"></td>
                        <td className="border border-black p-1 align-top">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span>☐ 正常</span>
                            <span>☐ 異常，異常狀況說明：</span>
                            <div className="border-b border-black flex-1 min-w-[120px] inline-block"></div>
                          </div>
                        </td>
                        <td className="border border-black p-1 align-top"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 機械設備器具檢查表 第2頁/共3頁（判定標準） */}
            <div className="mt-8 pt-6 border-t-2 border-gray-400" style={{ pageBreakBefore: "always" }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono">7.0.T.F02</span>
                <span className="text-xs">第2頁/共3頁</span>
              </div>
              <h2 className="text-xl font-bold text-center mb-4">機械設備器具檢查表</h2>
              <div className="border-2 border-black text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 w-40">機具名稱</th>
                      <th className="border border-black p-2">判定標準</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">動力堆高機</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-2">
                          <div><strong>一、制動裝置、離合器及方向裝置：</strong>(1)堆高機應於左右兩側設有方向指示器。(2)堆高機應設有警報裝置。</div>
                          <div><strong>二、積載裝置及液壓裝置：</strong>(1)堆高機之液壓系統應設有防止液壓過大之安全閥。(2)貨叉應以鋼料製成且無顯著之損傷、變形及腐蝕。</div>
                          <div><strong>三、頂蓬及桅桿：</strong>(1)堆高機應依規定設有頂蓬。(2)堆高機應設有靠背。但堆高機於桅桿後傾時無貨物掉落危害之虞而明確指定使用場所者，不在此限。(3)升降式駕駛座堆高機，駕駛座應設有防止墜落之扶手等。(4)坐式堆高機駕駛座應使用能緩和駕駛員身體振動之襯墊。(5)平衡重式及側載式堆高機駕駛座應設有安全帶、護欄等防止翻倒時駕駛員被堆高機壓傷之裝置。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">移動式起重機</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、伸臂、旋轉裝置(含螺栓、螺帽等)、外伸撐座、動力傳動裝置及其他結構部分應無損傷。</div>
                          <div>二、過捲預防裝置、警報裝置、制動裝置、離合器及其他安全裝置應無異常。</div>
                          <div>三、鋼索、吊鏈、吊具等應無損傷。</div>
                          <div>四、配線、集電裝置、配電盤、開關及其他電氣、機械組件應無異常。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">金屬/塑膠等加工用之圓盤鋸</td>
                      <td className="border border-black p-2 align-top">應設有鋸片接觸預防裝置。</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">合梯</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、應具有堅固之構造。</div>
                          <div>二、其材質應無顯著之損傷、腐蝕等。</div>
                          <div>三、兩梯腳與地面之夾角應在七十五度以內，且兩梯腳間應有堅固之金屬硬質繫材，底部應有防滑絕緣腳座套。</div>
                          <div>四、應有堅固之防滑梯面。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">移動梯</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、應具有堅固之構造。</div>
                          <div>二、其材質應無顯著之損傷、腐蝕等。</div>
                          <div>三、寬度應在三十公分以上。</div>
                          <div>四、應採取防止滑動或其他意外移動之必要措施。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">移動電線之攜帶型電燈</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、燈座之帶電部分應有防止手指意外觸及之構造。</div>
                          <div>二、應使用不易變形或損壞之材料。</div>
                          <div>三、於導電性機械設備內部檢查用攜帶型電燈，使用電壓應不超過二十四伏特，且電線應具耐磨損及良好絕緣，並不得有接頭。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">吊籠</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、過捲預防裝置、制動裝置、控制裝置及其他安全裝置應無異常。</div>
                          <div>二、吊臂、伸臂及工作台應無損傷。</div>
                          <div>三、升降裝置、配線及配電盤應無異常。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">電焊機</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、操作使用之焊接把手應具有充分之絕緣及耐熱性能。</div>
                          <div>二、於導電性機械設備內之局限空間或鋼架等有觸及高導電性接地物之虞場所使用交流電焊機時，應設自動電擊防止裝置。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">鑽孔機、截角機</td>
                      <td className="border border-black p-2 align-top">應明確告知勞工不得佩戴手套，並確實遵守。</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 機械設備器具檢查表 第3頁/共3頁（判定標準） */}
            <div className="mt-8 pt-6 border-t-2 border-gray-400" style={{ pageBreakBefore: "always" }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono">7.0.T.F02</span>
                <span className="text-xs">第3頁/共3頁</span>
              </div>
              <h2 className="text-xl font-bold text-center mb-4">機械設備器具檢查表</h2>
              <div className="border-2 border-black text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 w-48">機具名稱</th>
                      <th className="border border-black p-2">判定標準</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">捲揚機</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、安裝前須核對並確認設計資料及強度計算書。</div>
                          <div>二、吊掛之重量不得超過該設備所能承受之最高負荷，並應設有防止超過負荷裝置。但設置有困難者，得以標示代替之。</div>
                          <div>三、不得供人員搭乘、吊升或降落。但臨時或緊急處理作業經採取足以防止人員墜落，且採專人監督等安全措施者，不在此限。</div>
                          <div>四、吊鉤或吊具應有防止吊舉中所吊物體脫落之裝置。</div>
                          <div>五、錨錠及吊掛用之吊鏈、鋼索、掛鉤、纖維索等吊具有異狀時應即修換。</div>
                          <div>六、吊運作業中應嚴禁人員進入吊掛物下方及吊鏈、鋼索等內側角。</div>
                          <div>七、捲揚吊索通路有與人員碰觸之虞之場所，應加防護或有其他安全設施。</div>
                          <div>八、操作處應有適當防護設施，以防物體飛落傷害操作人員，採坐姿操作者應設坐位。</div>
                          <div>九、應設有防止過捲裝置，設置有困難者，得以標示代替之。</div>
                          <div>十、吊運作業時，應設置信號指揮聯絡人員，並規定統一之指揮信號。</div>
                          <div>十一、應避免鄰近電力線作業。</div>
                          <div>十二、電源開關箱之設置，應有防護裝置。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">高空工作車</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、壓縮壓力、閥間隙及其他原動機有無異常。</div>
                          <div>二、離合器、變速箱、差速齒輪、傳動軸及其他動力傳動裝置有無異常。</div>
                          <div>三、主動輪、從動輪、上下轉輪、履帶、輪胎、車輪軸承及其他走行裝置有無異常。</div>
                          <div>四、轉向器之左右回轉角度、肘節、軸、臂及其他操作裝置有無異常。</div>
                          <div>五、制動能力、制動鼓、制動塊及其他制動裝置有無異常。</div>
                          <div>六、伸臂、升降裝置、屈折裝置、平衡裝置、工作台及其他作業裝置有無異常。</div>
                          <div>七、油壓泵、油壓馬達、汽缸、安全閥及其他油壓裝置有無異常。</div>
                          <div>八、電壓、電流及其他電氣系統有無異常。</div>
                          <div>九、車體、操作裝置、安全裝置、連鎖裝置、警報裝置、方向指示器、燈號裝置及儀表有無異常。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">乙炔/氧乙炔熔接裝置及氣體集合熔接裝置</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>一、就裝置之損傷、變形、腐蝕等及其性能檢查。</div>
                          <div>二、為防止氧氣背壓過高、氧氣逆流及回火造成危險，應於每一吹管分別設置安全器，但主管及最近吹管之分岐管分別設有安全器者，不在此限。</div>
                          <div>三、凸緣、旋塞、閥等之接合部分，應使用墊圈使接合面密接。</div>
                          <div>四、為防止乙炔等氣體用與氧氣用導管或管線之混用，應採用專用色別區分，以資識別。</div>
                          <div>五、乙炔熔接裝置或氧乙炔熔接裝置從事金屬之熔接、熔斷或加熱作業時，應規定其產生之乙炔壓力不得超過表壓力每平方公分一點三公斤以上。</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 align-top font-medium">其他安全事項</td>
                      <td className="border border-black p-2 align-top">
                        <div className="space-y-1">
                          <div>為避免漏電而發生感電危害，應依下列狀況，於各該電動機具設備之連接電路上設置適合其規格，具有高敏感度、高速型，能確實動作之防止感電用漏電斷路器：</div>
                          <div>一、使用對地電壓在一百五十伏特以上移動式或攜帶式電動機具。</div>
                          <div>二、於含水或被其他導電度高之液體濕潤之潮濕場所、金屬板上或鋼架上等導電性良好場所使用移動式或攜帶式電動機具。</div>
                          <div>三、於建築或工程作業使用之臨時用電設備。</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

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