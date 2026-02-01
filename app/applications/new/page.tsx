"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationFormSchema } from "@/lib/validation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, AlertCircle } from "lucide-react";
import type { ApplicationFormInput } from "@/lib/validation";

const APPLICANT_OPTIONS = [
  "Jack Chen",
  "Charlie Lin",
  "David Yeh",
] as const;

export default function NewApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得今天的日期時間字串（格式：YYYY-MM-DDTHH:mm）
  const getTodayDateTimeString = (hours: number = 8, minutes: number = 0): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    return `${year}-${month}-${day}T${hoursStr}:${minutesStr}`;
  };

  const defaultStartTime = getTodayDateTimeString(8, 0); // 預設今天 08:00
  const defaultEndTime = getTodayDateTimeString(17, 0);   // 預設今天 17:00

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      applicantName: "",
      department: "",
      workTimeStart: defaultStartTime,
      workTimeEnd: defaultEndTime,
      hazardFactors: {
        generalWork: true, // 一般作業固定打勾
      },
      hazardFactorsDescription: "一般安全須知及施工安全須知、跌倒、有害物、墜/滾落、物料掉落、感電、火災、溺水、被夾被捲、熱危害、道路及堆高機等", // 一般作業危害因素說明
      otherHazardFactorsDescription: "", // 其他作業危害因素說明
      hazardousOperations: {
        hotWorkDetails: undefined,
      },
      personnelInfo: {
        contractor: {
          name: "",
          siteSupervisor: "",
          personnel: [""],
        },
        subcontractors: [],
      },
    },
  });

  const hotWorkChecked = watch("hazardFactors.hotWork");
  const hotWorkOperation = watch("hazardousOperations.hotWork");
  const hotWorkPersonnelType = watch("hazardousOperations.hotWorkDetails.personnelType");
  const applicantNameValue = watch("applicantName");
  const [customApplicantName, setCustomApplicantName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // 更新其他作業危害因素說明的函數
  const updateOtherHazardFactors = () => {
    const factorSet = new Set<string>();
    
    if (getValues("hazardFactors.hotWork")) {
      factorSet.add("火災");
    }
    
    if (getValues("hazardFactors.confinedSpace")) {
      const confinedSpaceFactors = ["有害物", "墜/滾落", "物料掉落", "感電", "火災", "溺水"];
      confinedSpaceFactors.forEach(factor => factorSet.add(factor));
    }
    
    if (getValues("hazardFactors.workAtHeight")) {
      const workAtHeightFactors = ["墜/滾落", "物料掉落", "感電", "吊掛", "被夾被捲"];
      workAtHeightFactors.forEach(factor => factorSet.add(factor));
    }
    
    // 將 Set 轉換為陣列並用頓號連接
    const uniqueFactors = Array.from(factorSet).join("、");
    
    setValue("otherHazardFactorsDescription", uniqueFactors, { shouldValidate: false });
  };

  // 防止 hydration 錯誤
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showCustomApplicant = isMounted && applicantNameValue === "其他";
  const showHotWorkOperations = isMounted && hotWorkChecked;
  const showHotWorkDetails = isMounted && hotWorkChecked && hotWorkOperation === "yes";
  const showContractorName = showHotWorkDetails && hotWorkPersonnelType === "contractor";

  const onSubmit = async (data: ApplicationFormInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 處理申請人姓名：如果是"其他"，使用自定義輸入
      if (data.applicantName === "其他") {
        if (customApplicantName.trim()) {
          data.applicantName = customApplicantName.trim();
        } else {
          setError("請輸入申請人姓名");
          setIsSubmitting(false);
          return;
        }
      }

      // 驗證動火作業邏輯
      if (data.hazardFactors.hotWork && !data.hazardousOperations.hotWork) {
        setError("若勾選動火作業，危險性作業的「動火」必須選擇「是」或「否」");
        setIsSubmitting(false);
        return;
      }

      console.log("提交申請資料:", data);
      
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("API 回應狀態:", response.status, response.statusText);

      const result = await response.json();
      console.log("API 回應內容:", result);

      if (!response.ok) {
        const errorMsg = result.error || result.message || "提交失敗";
        const errorDetails = result.details ? `\n詳細：${JSON.stringify(result.details)}` : "";
        setError(errorMsg + errorDetails);
        setIsSubmitting(false);
        return;
      }

      // 檢查返回的 ID
      const applicationId = result.id || result.application?.id;
      if (!applicationId) {
        console.error("API 返回格式錯誤:", result);
        setError("提交成功，但無法取得申請編號，請檢查終端機");
        setIsSubmitting(false);
        return;
      }

      console.log("準備跳轉到成功頁面，申請 ID:", applicationId);
      console.log("工單編號:", result.workOrderNumber);
      
      // 提交成功，跳轉到申請成功頁面
      router.push(`/applications/success/${applicationId}`);
    } catch (err) {
      console.error("提交錯誤:", err);
      setError(`提交時發生錯誤：${err instanceof Error ? err.message : "請稍後再試"}`);
      setIsSubmitting(false);
    }
  };

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
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </Link>
        </div>
      </nav>

      <main className="relative max-w-4xl mx-auto p-6 z-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">施工安全作業許可申請表</h2>
          <p className="text-slate-400 text-sm font-mono">CREATE NEW APPLICATION</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg backdrop-blur-sm space-y-8">
          {/* 申請人資訊 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
              申請人資訊
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  廠內申請人(承攬作業監工) <span className="text-red-400">*</span>
                </label>
                {isMounted ? (
                  <select
                    {...register("applicantName", {
                      onChange: (e) => {
                        if (e.target.value !== "其他") {
                          setCustomApplicantName("");
                        }
                      },
                    })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    defaultValue=""
                  >
                    <option value="">請選擇申請人</option>
                    <option value="Jack Chen">Jack Chen</option>
                    <option value="Charlie Lin">Charlie Lin</option>
                    <option value="David Yeh">David Yeh</option>
                    <option value="其他">其他(自行填入)</option>
                  </select>
                ) : (
                  <select
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2"
                    defaultValue=""
                    disabled
                  >
                    <option value="">請選擇申請人</option>
                  </select>
                )}
                {isMounted && showCustomApplicant && (
                  <input
                    type="text"
                    value={customApplicantName}
                    onChange={(e) => setCustomApplicantName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 mt-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    placeholder="請輸入申請人姓名"
                  />
                )}
                {errors.applicantName && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.applicantName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  部門 <span className="text-red-400">*</span>
                </label>
                {isMounted ? (
                  <select
                    {...register("department")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    defaultValue=""
                  >
                    <option value="">請選擇部門</option>
                    <option value="維修部">維修部</option>
                    <option value="生產部">生產部</option>
                    <option value="實驗室">實驗室</option>
                    <option value="R&D">R&D</option>
                    <option value="QC">QC</option>
                  </select>
                ) : (
                  <select
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2"
                    defaultValue=""
                    disabled
                  >
                    <option value="">請選擇部門</option>
                  </select>
                )}
                {errors.department && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.department.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  {...register("applicantEmail")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                  placeholder="example@company.com"
                />
              </div>
            </div>
          </section>

          {/* 施工申請資料 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
              施工申請資料
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    作業時間開始 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register("workTimeStart", {
                      onChange: (e) => {
                        const startValue = e.target.value;
                        if (startValue) {
                          const startDate = new Date(startValue);
                          const endValue = getValues("workTimeEnd");
                          
                          if (endValue) {
                            const endDate = new Date(endValue);
                            // 取得開始日期的年月日
                            const startYear = startDate.getFullYear();
                            const startMonth = startDate.getMonth();
                            const startDay = startDate.getDate();
                            
                            // 取得結束日期的時間部分
                            const endHours = endDate.getHours();
                            const endMinutes = endDate.getMinutes();
                            
                            // 將結束日期設為與開始日期同一天，保留原來的時間
                            const newEndDate = new Date(startYear, startMonth, startDay, endHours, endMinutes);
                            
                            // 格式化為 datetime-local 格式
                            const year = newEndDate.getFullYear();
                            const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
                            const day = String(newEndDate.getDate()).padStart(2, '0');
                            const hours = String(newEndDate.getHours()).padStart(2, '0');
                            const minutes = String(newEndDate.getMinutes()).padStart(2, '0');
                            const newEndDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
                            
                            setValue("workTimeEnd", newEndDateTimeString, { shouldValidate: true });
                          }
                        }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  {errors.workTimeStart && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.workTimeStart.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    作業時間結束 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register("workTimeEnd", {
                      onChange: (e) => {
                        const endValue = e.target.value;
                        const startValue = getValues("workTimeStart");
                        
                        if (endValue && startValue) {
                          const startDate = new Date(startValue);
                          const endDate = new Date(endValue);
                          
                          // 檢查是否為同一天
                          const startYear = startDate.getFullYear();
                          const startMonth = startDate.getMonth();
                          const startDay = startDate.getDate();
                          
                          const endYear = endDate.getFullYear();
                          const endMonth = endDate.getMonth();
                          const endDay = endDate.getDate();
                          
                          // 如果不是同一天，自動調整為與開始日期同一天
                          if (startYear !== endYear || startMonth !== endMonth || startDay !== endDay) {
                            const endHours = endDate.getHours();
                            const endMinutes = endDate.getMinutes();
                            
                            const newEndDate = new Date(startYear, startMonth, startDay, endHours, endMinutes);
                            
                            const year = newEndDate.getFullYear();
                            const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
                            const day = String(newEndDate.getDate()).padStart(2, '0');
                            const hours = String(newEndDate.getHours()).padStart(2, '0');
                            const minutes = String(newEndDate.getMinutes()).padStart(2, '0');
                            const newEndDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
                            
                            setValue("workTimeEnd", newEndDateTimeString, { shouldValidate: true });
                          }
                        }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  {errors.workTimeEnd && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.workTimeEnd.message}
                    </p>
                  )}
                  {errors.workTimeEnd?.type === "sameDay" && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      結束日期必須與開始日期為同一天
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono bg-slate-900/50 border border-slate-800 px-3 py-2 rounded">
                ⚠ 作業許可限當日有效，每日須重新申請
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  施工區域 <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("workArea")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                  placeholder="例如：黑線2F室內與1F室"
                />
                {errors.workArea && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.workArea.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  施工內容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  {...register("workContent")}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all resize-none"
                  placeholder="例如：集塵防爆隔離閱安裝"
                />
                {errors.workContent && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.workContent.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 工作環境危害因素 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
              工作環境危害因素
            </h3>
            <div className="space-y-3 bg-slate-900/50 border border-slate-800 rounded p-4">
              <label className="flex items-center group">
                <input
                  type="checkbox"
                  {...register("hazardFactors.generalWork")}
                  checked={true}
                  disabled={true}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-not-allowed opacity-60"
                />
                <span className="ml-3 text-slate-300">一般作業</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("hazardFactors.hotWork", {
                    onChange: () => {
                      updateOtherHazardFactors();
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-3 text-slate-300 group-hover:text-white transition-colors">動火作業</span>
                <span className="ml-2 text-xs text-slate-500">（選填）</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("hazardFactors.confinedSpace", {
                    onChange: () => {
                      updateOtherHazardFactors();
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-3 text-slate-300 group-hover:text-white transition-colors">局限空間</span>
                <span className="ml-2 text-xs text-slate-500">（選填）</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("hazardFactors.workAtHeight", {
                    onChange: () => {
                      updateOtherHazardFactors();
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-3 text-slate-300 group-hover:text-white transition-colors">高處作業及電梯維修保養</span>
                <span className="ml-2 text-xs text-slate-500">（選填）</span>
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                一般作業危害因素說明
              </label>
              <textarea
                {...register("hazardFactorsDescription")}
                defaultValue="一般安全須知及施工安全須知、跌倒、有害物、墜/滾落、物料掉落、感電、火災、溺水、被夾被捲、熱危害、道路及堆高機等"
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                其他作業危害因素說明
              </label>
              <textarea
                {...register("otherHazardFactorsDescription")}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                placeholder="請描述其他作業相關的危害因素"
              />
            </div>
          </section>

          {/* 危險性作業 */}
          {showHotWorkOperations && (
            <section className="space-y-4 bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
                危險性作業（若有須另提出許可申請）
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">動火</label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        value="yes"
                        {...register("hazardousOperations.hotWork")}
                        className="w-4 h-4 border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-2 text-slate-300 group-hover:text-white transition-colors">是</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        value="no"
                        {...register("hazardousOperations.hotWork")}
                        className="w-4 h-4 border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-2 text-slate-300 group-hover:text-white transition-colors">否</span>
                    </label>
                  </div>
                  {errors.hazardousOperations?.hotWork && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWork.message}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 動火作業詳細資訊表格 */}
          {showHotWorkDetails && (
            <section className="space-y-4 bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
                熱加工操作申請
              </h3>
              <div className="space-y-4">
                {/* 熱加工操作人員類型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    熱加工操作人員 <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        value="employee"
                        {...register("hazardousOperations.hotWorkDetails.personnelType")}
                        className="w-4 h-4 border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-2 text-slate-300 group-hover:text-white transition-colors">員工</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        value="contractor"
                        {...register("hazardousOperations.hotWorkDetails.personnelType")}
                        className="w-4 h-4 border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="ml-2 text-slate-300 group-hover:text-white transition-colors">承包商</span>
                    </label>
                  </div>
                  {errors.hazardousOperations?.hotWorkDetails?.personnelType && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.personnelType.message}
                    </p>
                  )}
                </div>

                {/* 承包商名稱（條件顯示） */}
                {showContractorName && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      承包商名稱 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("hazardousOperations.hotWorkDetails.contractorName")}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                      placeholder="請輸入承包商名稱"
                    />
                    {errors.hazardousOperations?.hotWorkDetails?.contractorName && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.hazardousOperations.hotWorkDetails.contractorName.message}
                      </p>
                    )}
                  </div>
                )}

                {/* 日期 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    日期 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("hazardousOperations.hotWorkDetails.date")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  {errors.hazardousOperations?.hotWorkDetails?.date && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.date.message}
                    </p>
                  )}
                </div>

                {/* 操作地點 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    操作地點(建築/樓層/物體) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("hazardousOperations.hotWorkDetails.operationLocation")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    placeholder="例如：A棟2F機房"
                  />
                  {errors.hazardousOperations?.hotWorkDetails?.operationLocation && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.operationLocation.message}
                    </p>
                  )}
                </div>

                {/* 待進行的作業 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    待進行的作業 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("hazardousOperations.hotWorkDetails.workToBePerformed")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    placeholder="請描述待進行的作業內容"
                  />
                  {errors.hazardousOperations?.hotWorkDetails?.workToBePerformed && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.workToBePerformed.message}
                    </p>
                  )}
                </div>

                {/* 熱加工操作人員姓名 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    熱加工操作人員的姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("hazardousOperations.hotWorkDetails.operatorName")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    placeholder="請輸入操作人員姓名"
                  />
                  {errors.hazardousOperations?.hotWorkDetails?.operatorName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.operatorName.message}
                    </p>
                  )}
                </div>

                {/* 火警巡查員姓名 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    火警巡查員姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("hazardousOperations.hotWorkDetails.fireWatcherName")}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                    placeholder="請輸入火警巡查員姓名"
                  />
                  {errors.hazardousOperations?.hotWorkDetails?.fireWatcherName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.fireWatcherName.message}
                    </p>
                  )}
                </div>

                {/* 作業區域主管 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    作業區域主管 <span className="text-red-400">*</span>
                  </label>
                  {isMounted ? (
                    <select
                      {...register("hazardousOperations.hotWorkDetails.areaSupervisor")}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      defaultValue=""
                    >
                      <option value="">請選擇作業區域主管</option>
                      <option value="生產經理">生產經理</option>
                      <option value="倉庫經理">倉庫經理</option>
                      <option value="技術部經理">技術部經理</option>
                      <option value="研發部經理">研發部經理</option>
                      <option value="維修部經理">維修部經理</option>
                    </select>
                  ) : (
                    <select
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2"
                      defaultValue=""
                      disabled
                    >
                      <option value="">請選擇作業區域主管</option>
                    </select>
                  )}
                  {errors.hazardousOperations?.hotWorkDetails?.areaSupervisor && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.hazardousOperations.hotWorkDetails.areaSupervisor.message}
                    </p>
                  )}
                </div>
              </div>
              {errors.hazardousOperations?.hotWorkDetails && typeof errors.hazardousOperations.hotWorkDetails === "object" && "_errors" in errors.hazardousOperations.hotWorkDetails && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {(errors.hazardousOperations.hotWorkDetails as { _errors?: string[] })._errors?.[0] || "請填寫所有必填欄位"}
                </p>
              )}
            </section>
          )}

          {/* 入廠作業人員 */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">
              入廠作業人員
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  承攬商名稱 <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("personnelInfo.contractor.name")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                />
                {errors.personnelInfo?.contractor?.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.personnelInfo.contractor.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  承攬商施工現場負責人 <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("personnelInfo.contractor.siteSupervisor")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                />
                {errors.personnelInfo?.contractor?.siteSupervisor && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.personnelInfo.contractor.siteSupervisor.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  承攬商施工人員 <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("personnelInfo.contractor.personnel", {
                    setValueAs: (value) => {
                      // 將字串轉換為陣列
                      if (typeof value === "string") {
                        return value.split(/[,，]/).map(p => p.trim()).filter(p => p);
                      }
                      return value;
                    },
                  })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 transition-all"
                  placeholder="以逗號分隔多人姓名，例如：彭瑞泉、林友濃"
                />
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  → 系統會自動將逗號分隔的姓名轉換為陣列
                </p>
                {errors.personnelInfo?.contractor?.personnel && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.personnelInfo.contractor.personnel.message}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-900/50 border border-slate-800 px-3 py-2 rounded font-mono">
              ℹ 必填(若有),可自行增加「再承攬」廠家
            </p>
          </section>

          {/* 提交按鈕 */}
          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  提交中...
                </span>
              ) : (
                "提交申請"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded border border-slate-700 transition-all active:scale-95 font-medium"
            >
              取消
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
