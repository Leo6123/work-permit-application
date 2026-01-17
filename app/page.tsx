"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Plus, Activity, Clock, CheckCircle, XCircle, FileText, Search } from "lucide-react";
import type { ApplicationWithLogs } from "@/types/application";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

export default function Home() {
  const [applications, setApplications] = useState<ApplicationWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const statusMap: Record<string, string> = {
        all: "",
        ehs: "pending_ehs",
        manager: "pending_manager",
        approved: "approved",
        rejected: "rejected",
      };
      const status = statusMap[activeTab] || "";
      const url = status ? `/api/applications?status=${status}` : "/api/applications";
      const response = await fetch(url);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 計算統計數據
  // 最新申請：顯示所有申請數量（按創建時間排序，最新的在前）
  const latestApplications = applications.length;

  const ehsPending = applications.filter((app) => app.status === "pending_ehs").length;
  // 批准施工：只統計已通過全部流程的申請（status === "approved"），拒絕的申請不納入
  const approvedApplications = applications.filter((app) => app.status === "approved").length;

  const stats = [
    { label: "最新申請", value: latestApplications, icon: FileText, color: "text-blue-400", border: "border-blue-500/30" },
    { label: "EHS 待審", value: ehsPending, icon: Activity, color: "text-amber-400", border: "border-amber-500/30" },
    { label: "批准施工", value: approvedApplications, icon: Shield, color: "text-emerald-400", border: "border-emerald-500/30" },
  ];

  const tabs = [
    { id: "all", label: "全部案件" },
    { id: "ehs", label: "待 EHS 審核" },
    { id: "manager", label: "待主管審核" },
    { id: "approved", label: "已通過/批准施工" },
    { id: "rejected", label: "已拒絕" },
  ];

  // 過濾申請列表（根據搜尋）
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // 生成工單編號用於搜尋
    const workOrderNumber = app.workOrderNumber || 
      `EHS${new Date(app.createdAt).getFullYear()}${String(new Date(app.createdAt).getMonth() + 1).padStart(2, "0")}${String(new Date(app.createdAt).getDate()).padStart(2, "0")}${String(new Date(app.createdAt).getHours()).padStart(2, "0")}${String(new Date(app.createdAt).getMinutes()).padStart(2, "0")}`;
    return (
      app.id.toLowerCase().includes(query) ||
      workOrderNumber.toLowerCase().includes(query) ||
      app.applicantName.toLowerCase().includes(query) ||
      app.department.toLowerCase().includes(query) ||
      app.workArea.toLowerCase().includes(query) ||
      (app.contractorInfo && typeof app.contractorInfo === "object" && app.contractorInfo.name?.toLowerCase().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      pending_ehs: { label: "待 EHS 審核", icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30" },
      pending_manager: { label: "待主管審核", icon: Activity, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
      approved: { label: "已通過", icon: CheckCircle, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
      rejected: { label: "已拒絕", icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30" },
    };
    return statusMap[status] || { label: status, icon: FileText, color: "text-slate-400", bgColor: "bg-slate-500/10 border-slate-500/30" };
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

  const formatDateShort = (date: string | Date) => {
    return new Date(date).toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* 背景網格裝飾 */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] pointer-events-none"></div>

      {/* 頂部導航欄 */}
      <nav className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
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
              線上施工安全作業許可申請系統
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-mono text-slate-400">SYSTEM ONLINE</span>
          </div>
          <Link
            href="/applications/new"
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">新增申請</span>
          </Link>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto p-6 z-10 space-y-8">
        {/* 儀表板數據卡 (HUD Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`bg-slate-900/50 border ${stat.border} p-4 rounded-lg backdrop-blur-sm flex items-center justify-between group hover:bg-slate-800/80 transition-colors`}
            >
              <div>
                <p className="text-slate-500 text-xs font-mono uppercase mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon
                className={`w-8 h-8 ${stat.color} opacity-80 group-hover:scale-110 transition-transform`}
              />
            </div>
          ))}
        </div>

        {/* 控制區：搜尋與篩選 */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-800 pb-2">
          {/* Tab 切換 */}
          <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`px-4 py-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                  activeTab === tab.id ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-[-9px] left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></span>
                )}
              </button>
            ))}
          </div>

          {/* 搜尋框 */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
            <input
              type="text"
              placeholder="搜尋工單編號 / 廠商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 font-mono transition-all"
            />
          </div>
        </div>

        {/* 內容區域：申請列表 */}
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                <Activity className="w-8 h-8 text-slate-500 animate-pulse" />
              </div>
              <p className="text-slate-400 font-mono">載入中...</p>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-900/30 relative overflow-hidden">
            {/* 裝飾性背景元素 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
              <Shield className="w-64 h-64" />
            </div>

            <div className="z-10 text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700 shadow-inner">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-300">
                  {searchQuery ? "找不到符合的申請記錄" : "目前尚無申請記錄"}
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  {searchQuery
                    ? "請嘗試其他搜尋關鍵字"
                    : "系統待命模式。點擊右上角「新增申請」以建立新的施工許可。"}
                </p>
              </div>

              {/* 偽終端機文字效果 */}
              <div className="mt-6 bg-black/50 rounded p-3 text-left border-l-2 border-cyan-500 font-mono text-xs text-slate-400 w-full max-w-xs mx-auto">
                <p>&gt; System ready...</p>
                <p>&gt; Waiting for user input_</p>
                <p className="animate-pulse text-cyan-500">&gt;</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const status = getStatusBadge(app.status);
              const StatusIcon = status.icon;
              return (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="block bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded border ${status.bgColor} flex items-center gap-1.5`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">
                            {app.workOrderNumber || getWorkOrderNumberFromDate(app.createdAt)}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">
                        {app.workArea}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">{app.workContent}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>申請人: {app.applicantName}</span>
                        <span>部門: {app.department}</span>
                        {app.contractorInfo && typeof app.contractorInfo === "object" && (
                          <span>承攬商: {app.contractorInfo.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                      <div className="mb-1">{formatDateShort(app.createdAt)}</div>
                      <div className="text-slate-600">
                        {formatDateShort(app.workTimeStart)} - {formatDateShort(app.workTimeEnd)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
