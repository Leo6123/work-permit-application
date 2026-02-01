"use client";

import { Printer } from "lucide-react";
import type { ApplicationWithLogs } from "@/types/application";
import { getWorkOrderNumberFromDate } from "@/lib/workOrderNumber";

interface WorkAtHeightPermitProps {
  application: ApplicationWithLogs;
}

export default function WorkAtHeightPermit({ application }: WorkAtHeightPermitProps) {
  const handlePrint = () => {
    window.print();
  };

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
    <div id="work-at-height-permit" className="bg-white text-black">
      {/* 列印按鈕 */}
      <div className="print:hidden mb-4 flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          此頁列印表單 (4頁)
        </button>
      </div>

      {/* ========== 第1頁：許可申請 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* Avient 表頭 */}
        <div className="border-2 border-black border-b-0">
          <img src="/images/Avient高空作業表頭.png" alt="Avient High-Altitude Work Header" className="w-full h-auto" />
        </div>

        {/* 標題區域 */}
        <div className="border-2 border-black border-t-0 p-2">
          <h1 className="text-2xl font-bold text-center mb-1">此頁高處作業許可申請表</h1>
          <p className="text-sm text-center">WORK AT HEIGHT PERMIT APPLICATION FORM</p>
        </div>

        {/* 注意事項 */}
        <div className="border-2 border-black border-t-0 p-2 text-xs space-y-1">
          <p>※請於作業五天前提出申請，經營運主管及環安核可後始得作業。</p>
          <p>※每張作業許可有效日為當日，跨日須重提申請，作業結束後必須將許可申請表繳回環安單位。</p>
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

            {/* 工程內容 */}
            <div className="flex items-center gap-2">
              <span className="font-bold">工程內容:</span>
              <div className="border-b border-black flex-1">{application.workContent}</div>
            </div>

            {/* 作業地點 */}
            <div className="flex items-center gap-2">
              <span className="font-bold">作業地點:</span>
              <div className="border-b border-black flex-1">{application.workArea}</div>
            </div>

            {/* 高處作業是否有更安全的替代方案 */}
            <div className="flex items-center gap-4">
              <span className="font-bold">高處作業是否有更安全的替代方案?</span>
              <span>☐ 是</span>
              <span>☐ 否</span>
              <span className="text-xs">(若勾選「是」，則不須申請高處作業許可)</span>
            </div>

            {/* 申請作業時間 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">申請作業時間:</span>
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

            {/* 承攬商現場負責人 */}
            <div>
              <span className="font-bold">承攬商現場負責人:</span>
              <div className="border-b border-black mt-1 inline-block w-64">{application.contractorInfo.siteSupervisor}</div>
            </div>

            {/* 連絡電話 */}
            <div>
              <span className="font-bold">連絡電話:</span>
              <div className="border-b border-black mt-1 inline-block w-64"></div>
            </div>

            {/* 作業項目 */}
            <div className="mt-4">
              <span className="font-bold">作業項目:</span>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-bold">高處作業:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <div>☐ 於天花板或屋頂上方施工</div>
                    <div>☐ 於管線上或鋼樑/架上施工</div>
                    <div>☐ 位於2公尺以上無固定平台及護欄之處所或開口旁需停留施工</div>
                    <div>☐ 合梯或移動梯施工</div>
                    <div>☐ 鷹架施工</div>
                    <div>☐ 吊掛作業之吊運平台</div>
                    <div className="flex items-center gap-1">
                      <span>☐ 其他:</span>
                      <div className="border-b border-black flex-1"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-bold">吊掛作業:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <div>☐ 固定式起重機</div>
                    <div>☐ 移動式起重機</div>
                    <div>☐ 人字臂起重桿</div>
                    <div>☐ 升降機</div>
                    <div>☐ 營建用升降機</div>
                    <div>☐ 吊籠</div>
                    <div>☐ 簡易升降機</div>
                    <div>☐ 捲揚機</div>
                    <div className="flex items-center gap-1">
                      <span>☐ 其他:</span>
                      <div className="border-b border-black flex-1"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-bold">電梯維修保養:</span>
                  <div className="mt-1 text-xs">☐ 電梯維修保養</div>
                </div>
              </div>
            </div>

            {/* 墜落災害防止計畫和安全設施 */}
            <div className="mt-4">
              <span className="font-bold">墜落災害防止計畫和安全設施:</span>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>☐ 安全帽</div>
                <div>☐ 安全索</div>
                <div>☐ 安全網</div>
                <div>☐ 安全帶</div>
                <div>☐ 圍籬</div>
                <div>☐ 警告標示</div>
                <div className="flex items-center gap-1">
                  <span>☐ 其他:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
              </div>
            </div>

            {/* 專業證照 */}
            <div className="mt-4">
              <span className="font-bold">專業證照:</span>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>☐ 屋頂作業主管</div>
                <div>☐ 吊掛機具使用檢查合格證</div>
                <div>☐ 起重機具吊掛作業合格人員</div>
                <div>☐ 危險性機械操作合格人員</div>
                <div className="flex items-center gap-1">
                  <span>☐ 其他:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div>☐ 不需要</div>
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
              {/* 作業前 - 共通性 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={11}>作業前<br/>共通性</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">1. 地面無濕滑、傾斜或不穩固等會造成絆倒等危險。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">2. 作業現場無險峻天候會引起作業危害之情況(如遇強風風速達每秒十公尺以上、雷雨等狀況應停止施工)。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">3. 作業環境無搖擺不穩的之情況。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">4. 無堆高機或其他交通造成的可能危害。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">5. 無採光照明不足情形。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">6. 錨錠點位置可使佩掛安全帶之作業人員就近掛置。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">7. 電氣施工電源插座使用漏電斷路器;電線架高不得防礙人員進出之安全。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">8. 作業材料或隨身工具需牢靠固定,防止材料、工具掉落或傾倒之措施。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">9. 施工現場設置圍欄或警告標示,作業地點下方安全無虞及施工梯架位置不會被門所撞到。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">10. 2公尺以上作業應使用高空工作車或架設施工架等方法設置工作臺施工;施工架頂層設置90公分以上護欄,並包括上欄杆、中欄杆,並設置內爬梯上下設備,階梯側邊應設置扶手及翼支撑(補助斜撑);施工架或作業平台穩固性良好。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>11. 高空工作車操作人員:</div>
                  <div className="mt-1">合格證號: <span className="border-b border-black inline-block w-32"></span> 複訓日期: <span className="border-b border-black inline-block w-24"></span> (每三年三小時)</div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 align-top">作業前</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">12. 施工架高度1.5公尺以上應設置安全固定之上下設備;不得使作業勞工攀爬施工架。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== 第2頁：危害告知及防範措施點檢（續） ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* 標題區域 */}
        <div className="border-2 border-black p-2">
          <h1 className="text-2xl font-bold text-center mb-1">此頁高處作業許可申請表</h1>
          <p className="text-sm text-center">WORK AT HEIGHT PERMIT APPLICATION FORM</p>
        </div>

        {/* 二、危害告知及防範措施點檢（續） */}
        <div className="border-2 border-black border-t-0 p-3">
          <h2 className="text-lg font-bold mb-3">二、危害告知及防範措施點檢（續）</h2>
          
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
              {/* 高處作業 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={5}>高處作業</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">13. 於石綿板、鐵皮板、瓦、木板、塑膠等材料構築的屋頂或礦纖板、石膏板等夾層天花板上作業時，應設置適當強度且寬度在三十公分以上的踏板、堅固格柵或安全網等防墜設施，並使用符合國家標準14253規定的背負式安全帶及捲揚式防墜器，並設置屋頂作業主管。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">14. 合梯及移動梯應符合耐重使用並使用FRP(玻璃纖維)材質；合梯不得作為2公尺以上作業之上下設備使用，並確實將中間橫桿打直，移動梯梯腳應設置防滑設施。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">15. 高處作業（含使用合梯及移動梯、高空工作車、吊籠等），應確實佩戴安全帽及背負式安全帶。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">16. 高處作業嚴禁獨自作業，並指定專人監督及指揮作業。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>17. 屋頂作業主管:</div>
                  <div className="mt-1">合格證號: <span className="border-b border-black inline-block w-32"></span> 複訓日期: <span className="border-b border-black inline-block w-24"></span> (每三年三小時)</div>
                </td>
              </tr>
              {/* 吊掛作業 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={8}>吊掛作業</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">1. 施工現場周邊圈圍警示區，加設圍欄或警報標示，並由專人指揮告知不可從吊舉物下方通過；設置信號指揮聯絡人，統一指揮訊號。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">2. 機械設備之作業點檢：每年整體檢查、每月定期檢查及每日作業前檢查。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>3. 危險性機械操作人員:</div>
                  <div className="mt-1">合格證號: <span className="border-b border-black inline-block w-32"></span> 複訓日期: <span className="border-b border-black inline-block w-24"></span> (每三年三小時)</div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>4. 起重機具吊掛搭乘設備作業人員:</div>
                  <div className="mt-1">合格證號: <span className="border-b border-black inline-block w-32"></span> 複訓日期: <span className="border-b border-black inline-block w-24"></span> (每三年三小時)</div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>5. 移動式起重機檢查合格證號:</div>
                  <div className="mt-1">有效期限: <span className="border-b border-black inline-block w-32"></span></div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div>6. 搭乘設備檢查合格證號:</div>
                  <div className="mt-1">有效期限: <span className="border-b border-black inline-block w-32"></span></div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">7. 起重機之吊鉤應裝設防滑舌片以防吊物脫落。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">8. 吊掛作業區域淨空並執行人員及車輛進出管制；吊掛作業其吊運貨物不得超出額定荷重。</td>
              </tr>
              {/* 安全帶檢查 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={6}>安全帶檢查</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">1. 掛繩無以下情形：顯著磨損、斷線、化學品附著及顯著收縮現象。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">2. 掛鉤無以下情形：變形、龜裂、鬆脫裝置開閉不良、生鏽、彈簧片折損現象。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">3. D環無以下情形：變形、龜裂、磨損、D環無法將繫身腰帶固定現象。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">4. 皮帶扣無以下情形：顯著磨損、龜裂、繫好後腹部用力感覺有鬆脫現象。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">5. 皮帶無以下情形：顯著磨損、割傷、變形現象。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">6. 繩索無以下情形：顯著變形、龜裂、生鏽及鉚釘帽部變形現象。</td>
              </tr>
              {/* 安全帶檢查簽名 */}
              <tr>
                <td className="border border-black p-1" colSpan={5}>
                  <div className="text-xs">
                    <p className="mb-1">(每一式安全帶佩帶前皆須檢查; 未能符合禁止使用、禁止作業):</p>
                    <div className="flex items-center gap-4">
                      <span>檢查人員核准簽名:</span>
                      <div className="border-b border-black flex-1"></div>
                      <span>日期:</span>
                      <div className="border-b border-black w-12"></div>
                      <span>年</span>
                      <div className="border-b border-black w-8"></div>
                      <span>月</span>
                      <div className="border-b border-black w-8"></div>
                      <span>日</span>
                    </div>
                  </div>
                </td>
              </tr>
              {/* 電梯維修保養作業 */}
              <tr>
                <td className="border border-black p-1 align-top" rowSpan={2}>電梯維修保養作業</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">1. 確認無感電、捲夾、墜落等相關物理危害。</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">2. 確認必要的機械器具及防護具皆以準備齊全。</td>
              </tr>
              {/* 其他注意事項 */}
              <tr>
                <td className="border border-black p-1">其他注意事項</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1 text-center">☐</td>
                <td className="border border-black p-1">
                  <div className="flex items-center gap-1">
                    <span>其他:</span>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== 第3頁：作業中、作業後 ========== */}
      <div className="permit-page bg-white">
        {/* 標題區域 */}
        <div className="border-2 border-black p-2">
          <h1 className="text-2xl font-bold text-center mb-1">此頁高處作業許可申請表</h1>
          <p className="text-sm text-center">WORK AT HEIGHT PERMIT APPLICATION FORM</p>
        </div>

        {/* 作業中 */}
        <div className="border-2 border-black border-t-0 p-3">
          <div className="flex">
            <div className="writing-vertical-rl text-lg font-bold border-r-2 border-black pr-2 mr-3">作業中</div>
            <div className="flex-1">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-4">
                  <span>廠內監工人員簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>現場安全負責人簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>不符合項目:☐無;☐有:</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>廠內監工人員簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                  <span>時間:</span>
                  <div className="border-b border-black w-32"></div>
                  <span>;改善確認簽名(如有):</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>現場安全負責人簽名:</span>
                  <div className="border-b border-black flex-1"></div>
                  <span>時間:</span>
                  <div className="border-b border-black w-32"></div>
                  <span>;改善確認簽名(如有):</span>
                  <div className="border-b border-black flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 作業後 */}
        <div className="border-2 border-black border-t-0 p-3">
          <div className="flex">
            <div className="writing-vertical-rl text-lg font-bold border-r-2 border-black pr-2 mr-3">作業後</div>
            <div className="flex-1">
              {/* 點檢表格 */}
              <table className="w-full border-collapse text-xs mb-4">
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
                    <td className="border border-black p-1">1. 工作環境已清理,工具清點完畢並攜出。</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1">2. 梯子、施工架確實移除或拆除。</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1">3. 隔離設施已撤除。</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1 text-center">☐</td>
                    <td className="border border-black p-1">4. 確認設備、環境皆復原。</td>
                  </tr>
                </tbody>
              </table>

              {/* 簽名區域 */}
              <div className="space-y-2 text-sm">
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

      {/* ========== 第4頁：共同作業擔任指揮、監督及協調之負責人員 ========== */}
      <div className="permit-page bg-white">
        <div className="border-2 border-black p-4">
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
                <div className="border-b border-black flex-1"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-40">承攬商施工現場負責人簽名:</span>
                <div className="border-b border-black flex-1"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="w-32">再承攬商名稱:</span>
                <div className="border-b border-black flex-1"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-40">再承攬商施工現場負責人簽名:</span>
                <div className="border-b border-black flex-1"></div>
              </div>
            </div>
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

      {/* 列印樣式 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #work-at-height-permit,
          #work-at-height-permit * {
            visibility: visible;
          }
          #work-at-height-permit {
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
