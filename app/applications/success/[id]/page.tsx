"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle, FileText, ArrowRight, Copy } from "lucide-react";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

export default function ApplicationSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [workOrderNumber, setWorkOrderNumber] = useState<string>("");
  const [isHotWork, setIsHotWork] = useState(false);

  useEffect(() => {
    // 從申請 ID 獲取申請資料以取得創建時間與作業類型
    fetch(`/api/applications/${applicationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.createdAt) {
          setWorkOrderNumber(getWorkOrderNumberFromDate(data.createdAt));
        }
        if (data.hazardFactors?.hotWork) {
          setIsHotWork(true);
        }
      })
      .catch(() => {
        setWorkOrderNumber(getWorkOrderNumberFromDate(new Date()));
      });
  }, [applicationId]);

  const copyWorkOrderNumber = () => {
    navigator.clipboard.writeText(workOrderNumber || applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        </div>
      </nav>

      <main className="relative max-w-2xl mx-auto p-6 z-10">
        {/* 成功訊息卡片 */}
        <div className="bg-slate-900/50 border border-emerald-500/30 p-8 rounded-lg backdrop-blur-sm text-center space-y-6">
          {/* 成功圖示 */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
          </div>

          {/* 標題 */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">申請提交成功！</h2>
            <p className="text-slate-400">您的施工安全作業許可申請已成功提交</p>
          </div>

          {/* 工單編號 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">工單編號</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-mono font-bold text-cyan-400 bg-slate-900 px-4 py-2 rounded border border-cyan-500/30">
                {workOrderNumber || "載入中..."}
              </code>
              <button
                onClick={copyWorkOrderNumber}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors group"
                title="複製工單編號"
              >
                <Copy className={`w-5 h-5 ${copied ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}`} />
              </button>
            </div>
            {copied && (
              <p className="text-sm text-emerald-400">已複製到剪貼簿</p>
            )}
          </div>

          {/* 後續步驟 */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left space-y-3">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">後續流程</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono">1.</span>
                <p>{isHotWork ? "作業區域主管" : "EHS Manager"} 已收到審核通知（Email 已發送至終端機）</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono">2.</span>
                <p>您可以在申請詳情頁查看審核進度</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono">3.</span>
                <p>審核完成後，系統會通知您（如果填寫了 Email）</p>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href={`/applications/${applicationId}`}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all active:scale-95 font-medium"
            >
              <FileText className="w-5 h-5" />
              查看申請詳情
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded border border-slate-700 transition-all active:scale-95 font-medium"
            >
              返回首頁
            </Link>
          </div>

          {/* 提示訊息 */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 font-mono">
              💡 提示：請記住您的工單編號，以便後續查詢申請狀態
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
