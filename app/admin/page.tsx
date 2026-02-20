"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, FileText, UserCheck, Mail, ArrowLeft } from "lucide-react";

type ApplicationRow = {
  id: string;
  applicantName: string;
  applicantEmail: string | null;
  department: string;
  workArea: string;
  status: string;
  createdAt: string;
  workOrderNumber: string;
};

type ApprovalLogRow = {
  id: string;
  applicationId: string;
  approverType: string;
  approverEmail: string;
  action: string;
  comment: string | null;
  approvedAt: string;
  approverTypeLabel: string;
  application: { id: string; applicantName: string; workArea: string };
};

type EmailLogRow = {
  id: string;
  applicationId: string | null;
  to: string;
  subject: string;
  emailType: string;
  emailTypeLabel: string;
  success: boolean;
  errorMessage: string | null;
  sentAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending_area_supervisor: "待區域主管",
  pending_ehs: "待 EHS",
  pending_manager: "待營運經理",
  approved: "已通過",
  rejected: "已拒絕",
};

export default function AdminPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLogRow[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => {
        if (res.status === 403) {
          window.location.replace("/");
          return null;
        }
        if (!res.ok) throw new Error("無法載入後台資料");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setApplications(data.applications || []);
          setApprovalLogs(data.approvalLogs || []);
          setEmailLogs(data.emailLogs || []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">載入後台資料...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2] pointer-events-none" />
      <nav className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/50 rounded">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              SAFETY<span className="text-cyan-400">.OS</span> 後台
            </h1>
            <p className="text-xs text-slate-500">申請一覽、簽署紀錄、Email 發送紀錄</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首頁
        </Link>
      </nav>

      <main className="relative max-w-6xl mx-auto p-6 z-10 space-y-8">
        {/* 申請一覽：誰發申請 */}
        <section className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white px-4 py-3 border-b border-slate-700">
            <FileText className="w-5 h-5 text-cyan-400" />
            申請一覽（誰發申請）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="p-3">工單編號</th>
                  <th className="p-3">申請人</th>
                  <th className="p-3">申請人 Email</th>
                  <th className="p-3">部門</th>
                  <th className="p-3">施工區域</th>
                  <th className="p-3">狀態</th>
                  <th className="p-3">建立時間</th>
                  <th className="p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-cyan-400">{app.workOrderNumber}</td>
                    <td className="p-3">{app.applicantName}</td>
                    <td className="p-3 text-slate-400">{app.applicantEmail || "—"}</td>
                    <td className="p-3">{app.department}</td>
                    <td className="p-3">{app.workArea}</td>
                    <td className="p-3">{STATUS_LABELS[app.status] || app.status}</td>
                    <td className="p-3 text-slate-500">{formatDate(app.createdAt)}</td>
                    <td className="p-3">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-cyan-400 hover:underline"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {applications.length === 0 && (
            <p className="p-6 text-slate-500 text-center">尚無申請紀錄</p>
          )}
        </section>

        {/* 審核簽署紀錄 */}
        <section className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white px-4 py-3 border-b border-slate-700">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            審核簽署紀錄
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="p-3">時間</th>
                  <th className="p-3">申請案</th>
                  <th className="p-3">簽署角色</th>
                  <th className="p-3">簽署人 Email</th>
                  <th className="p-3">結果</th>
                  <th className="p-3">附註</th>
                </tr>
              </thead>
              <tbody>
                {approvalLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500">{formatDate(log.approvedAt)}</td>
                    <td className="p-3">
                      <Link
                        href={`/applications/${log.applicationId}`}
                        className="text-cyan-400 hover:underline"
                      >
                        {log.application?.applicantName} / {log.application?.workArea}
                      </Link>
                    </td>
                    <td className="p-3">{log.approverTypeLabel}</td>
                    <td className="p-3 font-mono text-slate-300">{log.approverEmail}</td>
                    <td className="p-3">
                      <span
                        className={
                          log.action === "approve"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {log.action === "approve" ? "通過" : "拒絕"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-[200px] truncate">
                      {log.comment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {approvalLogs.length === 0 && (
            <p className="p-6 text-slate-500 text-center">尚無審核紀錄</p>
          )}
        </section>

        {/* Email 發送紀錄 */}
        <section className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white px-4 py-3 border-b border-slate-700">
            <Mail className="w-5 h-5 text-cyan-400" />
            Email 發送紀錄
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="p-3">發送時間</th>
                  <th className="p-3">類型</th>
                  <th className="p-3">收件人</th>
                  <th className="p-3">主旨</th>
                  <th className="p-3">狀態</th>
                  <th className="p-3">錯誤訊息</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500">{formatDate(log.sentAt)}</td>
                    <td className="p-3">{log.emailTypeLabel}</td>
                    <td className="p-3 font-mono text-slate-300">{log.to}</td>
                    <td className="p-3 text-slate-300 max-w-[240px] truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          log.success ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {log.success ? "已發送" : "失敗"}
                      </span>
                    </td>
                    <td className="p-3 text-red-400/90 max-w-[200px] truncate" title={log.errorMessage || ""}>
                      {log.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {emailLogs.length === 0 && (
            <p className="p-6 text-slate-500 text-center">尚無 Email 發送紀錄（僅記錄部署後發送的郵件）</p>
          )}
        </section>
      </main>
    </div>
  );
}
