"use client";

import type { ApplicationWithLogs } from "@/types/application";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

interface ConfinedSpacePermitProps {
  application: ApplicationWithLogs;
}

export default function ConfinedSpacePermit({ application }: ConfinedSpacePermitProps) {
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return {
      year: d.getFullYear(),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      day: String(d.getDate()).padStart(2, '0'),
      hour: String(d.getHours()).padStart(2, '0'),
      minute: String(d.getMinutes()).padStart(2, '0'),
      full: d.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    };
  };

  const workOrderNumber = application.workOrderNumber || getWorkOrderNumberFromDate(application.createdAt);
  const startDate = formatDate(application.workTimeStart);
  const endDate = formatDate(application.workTimeEnd);
  const applyDate = formatDate(application.createdAt);

  return (
    <div id="confined-space-permit" className="bg-white text-black">

      {/* ========== 第1頁：許可申請 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* Avient 表頭 */}
        <div className="border-2 border-black border-b-0">
          <img src="/images/Avient表頭.png" alt="Avient Header" className="w-full h-auto" />
        </div>

        {/* 標題區域 */}
        <div className="border-2 border-black border-t-0 p-2">
          <h1 className="text-2xl font-bold text-center mb-1">此頁局限空間作業許可申請表</h1>
          <p className="text-sm text-center">CONFINED SPACE ENTRY PERMIT</p>
        </div>

        {/* 注意事項 */}
        <div className="border-2 border-black border-t-0 p-2 text-xs space-y-1">
          <p>※請於作業一週前提申請並檢附局限空間危害防止計畫,經營運主管及環安核可後始得作業。</p>
          <p>※作業過程將申請表(含附件)張貼於作業現場,作業結束後繳回環安單位。</p>
        </div>

        {/* 一、許可申請 */}
        <div className="border-2 border-black border-t-0 p-3">
          <h2 className="text-lg font-bold mb-3">一、許可申請</h2>
          
          <div className="space-y-3 text-sm">
            {/* 申請日期 */}
            <div className="flex items-center gap-2">
              <span className="font-bold">申請日期:</span>
              <span>年: {applyDate.year}</span>
              <span>月: {applyDate.month}</span>
              <span>日: {applyDate.day}</span>
            </div>

            {/* 申請人 */}
            <div className="flex items-center gap-2">
              <span className="font-bold">申請人:</span>
              <div className="border-b border-black flex-1">{application.applicantName}</div>
            </div>

            {/* 工程名稱 */}
            <div className="flex items-center gap-2">
              <span className="font-bold">工程名稱:</span>
              <div className="border-b border-black flex-1">{application.workContent}</div>
            </div>

            {/* 屬於局限空間作業遇緊急事故 */}
            <div className="flex items-center gap-4">
              <span className="font-bold">屬於局限空間作業遇緊急事故,狀況解除後重新申請許可:</span>
              <span>☐ 是</span>
              <span>☐ 否</span>
            </div>

            {/* 作業內容 */}
            <div>
              <span className="font-bold">作業內容:</span>
              <div className="border-b border-black mt-1">{application.workContent}</div>
            </div>

            {/* 作業位置 */}
            <div>
              <span className="font-bold">作業位置:</span>
              <div className="border-b border-black mt-1">{application.workArea}</div>
            </div>

            {/* 申請作業時間 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">申請作業時間:</span>
              <span>自</span>
              <span>年: {startDate.year}</span>
              <span>月: {startDate.month}</span>
              <span>日: {startDate.day}</span>
              <span>時: {startDate.hour}</span>
              <span>分: {startDate.minute}</span>
              <span>~</span>
              <span>時: {endDate.hour}</span>
              <span>分: {endDate.minute}</span>
            </div>

            {/* 承攬商名稱 */}
            <div>
              <span className="font-bold">承攬商名稱:</span>
              <div className="border-b border-black mt-1 inline-block w-64">{application.contractorInfo.name}</div>
            </div>

            {/* 承攬商現場負責人及連絡電話 */}
            <div>
              <span className="font-bold">承攬商現場負責人及連絡電話:</span>
              <div className="border-b border-black mt-1 inline-block w-64">{application.contractorInfo.siteSupervisor}</div>
            </div>

            {/* 局限空間作業人員 */}
            <div>
              <span className="font-bold">局限空間作業人員:</span>
              <div className="border-b border-black mt-1 inline-block w-64">
                {Array.isArray(application.contractorInfo.personnel)
                  ? application.contractorInfo.personnel.join("、")
                  : application.contractorInfo.personnel}
              </div>
            </div>

            {/* 缺氧作業主管 */}
            <div>
              <span className="font-bold">缺氧作業主管:</span>
              <div className="border-b border-black mt-1 inline-block w-64"></div>
            </div>

            {/* 急救人員 */}
            <div>
              <span className="font-bold">急救人員:</span>
              <div className="border-b border-black mt-1 inline-block w-64"></div>
            </div>

            {/* 安全設施 */}
            <div>
              <span className="font-bold">安全設施:</span>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>☐ 呼吸防護具</div>
                <div>☐ 通風設備</div>
                <div>☐ 安全帶</div>
                <div>☐ 梯子</div>
                <div>☐ 橡膠鞋</div>
                <div>☐ 橡膠手套</div>
                <div>☐ 防護衣</div>
                <div>☐ 滅火器</div>
                <div>☐ 呼吸鋼瓶</div>
                <div>☐ 安全帽</div>
                <div>☐ 救生索</div>
                <div className="flex items-center gap-1">
                  <span>☐ 其他:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
              </div>
            </div>

            {/* 核准簽名 */}
            <div className="mt-4 space-y-2">
              <div className="font-bold">核准簽名:</div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs">申請單位主管</span>
                  <div className="border-b border-black h-8"></div>
                </div>
                <div className="flex-1">
                  <span className="text-xs">營運主管</span>
                  <div className="border-b border-black h-8"></div>
                </div>
                <div className="flex-1">
                  <span className="text-xs">環安</span>
                  <div className="border-b border-black h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 二、危害告知及防範措施點檢 */}
        <div className="border-2 border-black border-t-0 p-3">
          <h2 className="text-lg font-bold mb-3">二、危害告知及防範措施點檢</h2>
          
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-black p-1 bg-gray-100" rowSpan={2}>施工期程</th>
                <th className="border border-black p-1 bg-gray-100" colSpan={3}>符合規定</th>
                <th className="border border-black p-1 bg-gray-100" rowSpan={2}>點檢項目</th>
              </tr>
              <tr>
                <th className="border border-black p-1 bg-gray-100">是</th>
                <th className="border border-black p-1 bg-gray-100">否</th>
                <th className="border border-black p-1 bg-gray-100">NA</th>
              </tr>
            </thead>
            <tbody>
              {/* 作業前 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={7}>作業前</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">1. 張貼注意事項、依規定設置圍籬、建立進出管制紀錄。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">2. 通知缺氧作業主管、確認環境、作業前至少通風10分鐘且作業中持續通風、指定監視人員。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">3. 作業前於上、中、下不同深度各選三點實施危害物質測定,濃度不符合規定或存在可燃性粉塵時禁止進入。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">4. 進出設備牢固、授權人員熟悉公司程序、配戴個人防護具、攜帶通訊設備。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">5. 關閉、上鎖、掛牌開關、閥門或管線之危害能量(電力、壓縮空氣等)。須進行危害能量隔離以防止誤開之設備: <div className="border-b border-black inline-block w-48 mt-1"></div></td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">6. 電源插座應裝設漏電斷路器(含自備發電機組)。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">7. 緊急狀況(如地震、火災等)發生時立即停止作業,狀況解除後重新申請許可。</td>
              </tr>
              {/* 作業中 */}
              <tr>
                <td className="border border-black p-1 align-top">作業中</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">8. 其他注意事項: <div className="border-b border-black inline-block w-64 mt-1"></div></td>
              </tr>
            </tbody>
          </table>

          {/* 簽名區域 */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-4">
              <span>廠內監工人員簽名:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
            <div className="flex items-center gap-4">
              <span>現場安全負責人簽名(警戒人員,不得離開現場):</span>
              <div className="border-b border-black flex-1"></div>
            </div>
            <div className="flex items-center gap-4">
              <span>配合本申請表附件一及附件二紀錄不符合項目:</span>
              <span>不符合項目: ☐ 無 ☐ 有</span>
            </div>
            <div className="flex items-center gap-4">
              <span>廠內監工人員簽名:</span>
              <div className="border-b border-black flex-1"></div>
              <span>時間:</span>
              <div className="border-b border-black w-32"></div>
              <span>;改善確認簽名(如有):</span>
              <div className="border-b border-black flex-1"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 第2頁：作業後 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* 標題區域 */}
        <div className="border-2 border-black p-2">
          <h1 className="text-2xl font-bold text-center mb-1">此頁局限空間作業許可申請表</h1>
          <p className="text-sm text-center">CONFINED SPACE ENTRY PERMIT</p>
        </div>

        {/* 作業後 */}
        <div className="border-2 border-black border-t-0 p-3">
          <div className="flex">
            <div className="writing-vertical-rl text-lg font-bold border-r-2 border-black pr-2 mr-3">作業後</div>
            <div className="flex-1">
              {/* 簽名區域 */}
              <div className="space-y-3 text-sm mb-4">
                <div className="flex items-center gap-4">
                  <span>現場安全負責人簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                  <span>時間:</span>
                  <div className="border-b border-black w-32"></div>
                  <span>;改善確認簽名(如有):</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
              </div>

              {/* 點檢表格 */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-black p-1 bg-gray-100" colSpan={3}>符合規定</th>
                    <th className="border border-black p-1 bg-gray-100">點檢項目</th>
                  </tr>
                  <tr>
                    <th className="border border-black p-1 bg-gray-100">是</th>
                    <th className="border border-black p-1 bg-gray-100">否</th>
                    <th className="border border-black p-1 bg-gray-100">NA</th>
                    <th className="border border-black p-1 bg-gray-100"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1">1. 點名確認進入局限空間作業之勞工已全數離開。</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1">2. 完成工作環境清理、隔離設施撤除。</td>
                  </tr>
                </tbody>
              </table>

              {/* 簽名區域 */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-4">
                  <span>廠內監工人員簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                  <span>時間:</span>
                  <div className="border-b border-black w-32"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>現場安全負責人簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                  <span>時間:</span>
                  <div className="border-b border-black w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 第3頁：附件一 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        <div className="border-2 border-black p-3">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-xl font-bold">附件一、局限(缺氧)空間作業人員進出管制紀錄表</h2>
            <div className="text-xs">
              <div>填表日期: <span className="border-b border-black inline-block w-12">{applyDate.year}</span> 年 <span className="border-b border-black inline-block w-8">{applyDate.month}</span> 月 <span className="border-b border-black inline-block w-8">{applyDate.day}</span> 日</div>
            </div>
          </div>

          <table className="w-full border-collapse text-xs border-2 border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1">項次</th>
                <th className="border border-black p-1">進入人員簽名</th>
                <th className="border border-black p-1">進入時間(時/分)</th>
                <th className="border border-black p-1">離場時間(時/分)</th>
                <th className="border border-black p-1">離廠人員簽名</th>
                <th className="border border-black p-1">備註</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <tr key={num}>
                  <td className="border border-black p-1 text-center">{num}</td>
                  <td className="border border-black p-1 h-8"></td>
                  <td className="border border-black p-1 h-8"></td>
                  <td className="border border-black p-1 h-8"></td>
                  <td className="border border-black p-1 h-8"></td>
                  <td className="border border-black p-1 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-4">
              <span>監視人員:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
            <div className="flex items-center gap-4">
              <span>缺氧作業主管:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
            <div className="flex items-center gap-4">
              <span>廠內工程發包人員:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
          </div>

          <p className="mt-4 text-xs">※本表單為局限空間作業許可附件,記錄作業人員進出局限空間管制之使用。</p>
        </div>
      </div>

      {/* ========== 第4頁：附件二 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        <div className="border-2 border-black p-3">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-xl font-bold">附件二、局限(缺氧)空間作業危害物質紀錄表</h2>
            <div className="text-xs">
              <div>填表日期: <span className="border-b border-black inline-block w-12">{applyDate.year}</span> 年 <span className="border-b border-black inline-block w-8">{applyDate.month}</span> 月 <span className="border-b border-black inline-block w-8">{applyDate.day}</span> 日</div>
            </div>
          </div>

          <div className="space-y-2 text-xs mb-3">
            <div className="flex items-center gap-4">
              <span>承攬商:</span>
              <div className="border-b border-black flex-1">{application.contractorInfo.name}</div>
            </div>
            <div className="flex items-center gap-4">
              <span>作業場所:</span>
              <div className="border-b border-black flex-1">{application.workArea}</div>
            </div>
          </div>

          <table className="w-full border-collapse text-[10px] border-2 border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1" rowSpan={2}>設定條件</th>
                <th className="border border-black p-1" rowSpan={2}>測定時間</th>
                <th className="border border-black p-1" colSpan={12}>測定深度</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-1" colSpan={3}>作業前(實施通風換氣後)</th>
                <th className="border border-black p-1" colSpan={3}>作業中(一)</th>
                <th className="border border-black p-1" colSpan={3}>再入槽前</th>
                <th className="border border-black p-1" colSpan={3}>作業中(二)</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">上</th>
                <th className="border border-black p-1">中</th>
                <th className="border border-black p-1">下</th>
                <th className="border border-black p-1">上</th>
                <th className="border border-black p-1">中</th>
                <th className="border border-black p-1">下</th>
                <th className="border border-black p-1">上</th>
                <th className="border border-black p-1">中</th>
                <th className="border border-black p-1">下</th>
                <th className="border border-black p-1">上</th>
                <th className="border border-black p-1">中</th>
                <th className="border border-black p-1">下</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">氧氣(O₂)%</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1">一氧化碳(CO)ppm</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1">硫化氫(H₂S)ppm</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1">可燃性氣體 LEL</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 text-[10px] space-y-1">
            <p>註1.須監測上、中、下不同深度各選三個點實施測定。</p>
            <p>註2.危害物質限值:氧氣19.5%以上~23.5%以下、一氧化碳35ppm以下、硫化氫10ppm以下、可燃性氣體 LEL &lt;10%(法規&lt;30%LEL);未在限值內,禁止勞工進入作業。</p>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-4">
              <span>危害監測人員:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
            <div className="flex items-center gap-4">
              <span>缺氧作業主管:</span>
              <div className="border-b border-black flex-1"></div>
            </div>
          </div>

          <p className="mt-4 text-xs">※本表單為局限空間作業許可附件,記錄作業危害物質濃度管制之使用。</p>
        </div>
      </div>

      {/* ========== 第5頁：附件三 ========== */}
      <div className="permit-page bg-white">
        <div className="border-2 border-black p-3">
          <h2 className="text-xl font-bold text-center mb-3">附件三、台灣埃萬特股份有限公司局限空間作業場所公告</h2>

          <table className="w-full border-collapse text-xs border border-black mb-3">
            <tbody>
              <tr>
                <td className="border border-black p-2">工程名稱</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2">作業內容</td>
                <td className="border border-black p-2"></td>
              </tr>
              <tr>
                <td className="border border-black p-2">廠內工程施作單位</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2">承攬商</td>
                <td className="border border-black p-2">{application.contractorInfo.name}</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="font-bold mb-2">施工須知</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-bold">有罹患缺氧症或其他危害之虞事項:</p>
                  <p>缺氧、中毒、火災、爆炸、感電、墜落、被夾(捲)、電弧灼傷、燒傷、穿刺(切割)傷、滑倒、崩塌、物體飛落</p>
                </div>
                <div>
                  <p className="font-bold">作業有可能引起缺氧等危害時,應經許可使得進入之重要性:</p>
                  <p>1. 勞工如未經許可,則不確知有上述各項之危害及應採取之防護措施。</p>
                  <p>2. 若發生緊急危害時,能確實掌握作業人員及現場狀況,俾能及時救援。</p>
                </div>
                <div>
                  <p className="font-bold">進入該場所時應採取之措施:</p>
                  <p>1. 經簽認許可後,始得進入。</p>
                  <p>2. 先通風、測定、紀錄,確認氧氣及有害氣體濃度是否低於標準值(如附件二、局限(缺氧)空間作業危害物質紀錄表);作業中持續監測及通風換氣。</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">注意事項</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-bold">事故發生時之緊急措施及緊急聯絡方式:</p>
                  <p className="font-bold">緊急措施:</p>
                  <p>(1)置備可以動力或機械輔助調升之緊急救援設備,盡可能於緊急事故發生時採取非進入搶救;但現場設置有困難已採取其他適當緊急救還設施者,不在此限。</p>
                  <p>(2)撥打119尋求協助或通報警衛室連絡119,迅速就醫。</p>
                  <p className="font-bold">聯絡方式:</p>
                  <p>對講機等聯絡設備</p>
                  <p className="font-bold">事故發生時,需立即聯絡之人員:</p>
                  <div className="space-y-1">
                    <div>廠內監工人員: <span className="border-b border-black inline-block w-24"></span> 行動電話: <span className="border-b border-black inline-block w-24"></span></div>
                    <div>廠內環安人員: <span className="border-b border-black inline-block w-24"></span> 行動電話: <span className="border-b border-black inline-block w-24"></span></div>
                  </div>
                </div>
                <div>
                  <p className="font-bold">救援設備(呼吸防護具等)、測定儀器及聯絡設備放置場所:</p>
                  <p>救援設備置於作業場所明顯處供緊急救援用;個人防護具及聯絡設備隨身攜帶。</p>
                </div>
                <div>
                  <p className="font-bold">現場監視人員及缺氧作業主管姓名:</p>
                  <div className="space-y-1">
                    <div>缺氧作業主管: <span className="border-b border-black inline-block w-24"></span> 行動電話: <span className="border-b border-black inline-block w-24"></span></div>
                    <div>監視人員: <span className="border-b border-black inline-block w-24"></span> 行動電話: <span className="border-b border-black inline-block w-24"></span></div>
                  </div>
                </div>
                <div>
                  <p className="font-bold">其他作業安全應注意事項:</p>
                  <p>1. 進入作業場所務必佩戴安全帽,並扣上頤帶。</p>
                  <p>2. 嚴禁飲用含酒精成分之飲料。</p>
                  <p>3. 確實依作業需求穿戴相關防護用具。</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs">※本表單為局限空間作業許可附件,張貼於作業場所入口公告局限空間作業注意事項之使用。</p>
        </div>
      </div>

      {/* 列印樣式 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #confined-space-permit,
          #confined-space-permit * {
            visibility: visible;
          }
          #confined-space-permit {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .permit-page {
            page-break-after: always;
            min-height: 100vh;
          }
          .permit-page:last-child {
            page-break-after: auto;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
