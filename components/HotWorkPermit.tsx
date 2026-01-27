"use client";

import { Printer } from "lucide-react";

interface HotWorkDetails {
  personnelType: "employee" | "contractor";
  contractorName?: string;
  date: string;
  workOrderNumber: string;
  operationLocation: string;
  workToBePerformed: string;
  operatorName: string;
  fireWatcherName: string;
  areaSupervisor: string;
}

interface HotWorkPermitProps {
  hotWorkDetails: HotWorkDetails;
  workTimeStart: string | Date;
  workTimeEnd: string | Date;
}

export default function HotWorkPermit({ hotWorkDetails, workTimeStart, workTimeEnd }: HotWorkPermitProps) {
  const handlePrint = () => {
    window.print();
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

  return (
    <div id="hot-work-permit" className="bg-white text-black">
      {/* 列印按鈕 */}
      <div className="print:hidden mb-4 flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          列印許可證 (3頁)
        </button>
      </div>

      {/* ========== 第1頁：熱加工操作許可證 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* 黃色標題區域 */}
        <div className="bg-yellow-400 p-4 text-center">
          <h1 className="text-3xl font-bold text-black mb-2">熱加工操作許可證</h1>
          <p className="text-red-600 font-bold text-lg">停止！</p>
          <p className="text-red-600 font-bold">盡量避免熱加工操作！考慮採用冷加工替代方式。</p>
          <p className="text-xs mt-2 text-black text-left">
            在指定熱加工操作區域以外進行的涉及明火或產生熱量和/或火花的任何臨時操作，均需取得此熱加工操作許可證。其中包括但不限於：硬焊、切割、打磨、軟焊、用熱熔法鋪設屋頂和焊接等工序。
          </p>
        </div>

        {/* 兩欄佈局 */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black">
          {/* 左欄：許可證核准人操作指南 */}
          <div className="border-r-2 border-black p-3">
            <h2 className="font-bold text-sm border-b border-black pb-1 mb-2">許可證核准人操作指南</h2>
            <ol className="text-xs space-y-1 list-decimal list-inside">
              <li>指定必須執行的預防措施。</li>
              <li>熱加工操作過程中填妥並保留第1部分。</li>
              <li>將第2部分交給熱加工操作人員。</li>
              <li>將第2部分存檔，供將來參考，包括操作後防火巡視與監控實施完畢後的簽署確認。</li>
              <li>在第2部分簽字確認最後檢查情況。</li>
            </ol>

            {/* 進行熱加工操作人員 */}
            <div className="mt-3 border-t border-black pt-2">
              <h3 className="font-bold text-xs mb-2">進行熱加工操作人員</h3>
              <div className="text-xs space-y-1">
                <div className="flex gap-4">
                  <span className={hotWorkDetails.personnelType === "employee" ? "font-bold" : ""}>
                    {hotWorkDetails.personnelType === "employee" ? "☑" : "☐"} 員工
                  </span>
                  <span className={hotWorkDetails.personnelType === "contractor" ? "font-bold" : ""}>
                    {hotWorkDetails.personnelType === "contractor" ? "☑" : "☐"} 承包商
                  </span>
                </div>
                {hotWorkDetails.personnelType === "contractor" && (
                  <div>承包商名稱：{hotWorkDetails.contractorName}</div>
                )}
              </div>
            </div>

            {/* 基本資訊表格 */}
            <div className="mt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">日期</span>
                  <div className="border-b border-black">{hotWorkDetails.date}</div>
                </div>
                <div>
                  <span className="font-bold">工作編號</span>
                  <div className="border-b border-black">{hotWorkDetails.workOrderNumber}</div>
                </div>
              </div>
              <div className="mt-1">
                <span className="font-bold">操作地點（建築/樓層/物體）</span>
                <div className="border-b border-black">{hotWorkDetails.operationLocation}</div>
              </div>
              <div className="mt-1">
                <span className="font-bold">待進行的作業</span>
                <div className="border-b border-black">{hotWorkDetails.workToBePerformed}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="font-bold">熱加工操作人員的姓名</span>
                  <div className="border-b border-black">{hotWorkDetails.operatorName}</div>
                </div>
                <div>
                  <span className="font-bold">火警巡查員姓名</span>
                  <div className="border-b border-black">{hotWorkDetails.fireWatcherName}</div>
                </div>
              </div>
            </div>

            {/* 許可證核准人確認 */}
            <div className="mt-3 border-t border-black pt-2 text-xs">
              <p className="mb-2">本人確認已對上述地點進行了檢查，已採取「所需預防措施」，並授權批准進行此項操作。</p>
              <div>
                <span className="font-bold">許可證核准人（正楷及簽名）</span>
                <div className="border-b border-black h-6"></div>
              </div>
              <div className="mt-2">
                <span className="font-bold">本許可證有效期至（限一個班次的批准）:</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>日期：<span className="border-b border-black inline-block w-full"></span></div>
                  <div>時間：<span className="border-b border-black inline-block w-full"></span></div>
                  <div>☐ 上午/下午</div>
                </div>
              </div>
            </div>

            {/* 註解 */}
            <div className="mt-3 bg-yellow-400 p-2 text-xs">
              <p className="font-bold">註：本表格背頁印有緊急事故通知字樣。</p>
            </div>

            {/* 額外 FM Global 資源 */}
            <div className="mt-2 text-xs">
              <p className="font-bold">額外 FM Global 資源:</p>
              <ul className="list-disc list-inside text-[10px]">
                <li>財產防損數據冊10-3，《熱加工操作管理》</li>
                <li>熱加工操作許可證應用程式可透過 fmglobal.com/apps 下載</li>
                <li>熱加工操作許可證表格(F2630_TCH) 可在fmglobalcatalog.com訂購</li>
                <li>線上培訓在 training.fmglobal.com</li>
                <li>FM認證的設備可在fmapprovals.com 查閱</li>
              </ul>
            </div>

            {/* FM Global Logo */}
            <div className="mt-2 flex justify-between items-end">
              <img src="/images/FM.png" alt="FM Global" className="h-10" />
              <div className="text-[8px] text-right">
                <p>F2630_TCH © 2018 FM Global。</p>
                <p>(01/2018) 版權所有。</p>
              </div>
            </div>
          </div>

          {/* 右欄：第1部分 - 所需預防措施 */}
          <div className="p-3">
            <h2 className="font-bold text-sm border-b border-black pb-1 mb-2">第1部分 - 所需預防措施</h2>
            
            {/* 標題行 */}
            <div className="text-xs flex items-center mb-1">
              <span className="w-4 text-center">是</span>
              <span className="w-12 text-center">不適用</span>
            </div>
            
            <div className="text-xs space-y-1">
              <div className="flex items-center">
                <span className="w-4 text-center">☐</span>
                <span className="w-4 text-center">☑</span>
                <span className="ml-1">消防泵正在運作並可自動啟動。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☐</span>
                <span className="w-4 text-center">☑</span>
                <span className="ml-1">灑水系統的供水控制閥為開啟狀態。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☑</span>
                <span className="w-4 text-center">☐</span>
                <span className="ml-1">滅火器處於工作狀態/可操作。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☑</span>
                <span className="w-4 text-center">☐</span>
                <span className="ml-1">熱加工操作設備處於良好工作狀態。</span>
              </div>
            </div>

            {/* 在熱加工操作區35英尺以內的安全要求 */}
            <div className="mt-3 bg-yellow-100 p-2">
              <h3 className="font-bold text-xs mb-1">在熱加工操作區35英尺（10公尺）以內的安全要求</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">移走可燃物或採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">隔離易燃氣體、可燃液體或可燃粉塵/棉絨等潛在火源（如關閉設備）。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">移走可燃液體、可燃粉塵/棉絨和可燃殘留物。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">關閉通風和輸送系統。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃物，對於存在開口或有導熱材料貫穿的地板、牆壁、天花板或屋頂的另一面，考慮進行二次防火巡視。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">熱加工操作是否在可燃屋頂上進行（例如，熱熔法鋪設屋頂）？如果是，採取以下所需的額外預防措施。</span>
                </div>
              </div>
            </div>

            {/* 密閉設備、管道或管路上/內的熱加工操作 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">密閉設備、管道或管路上/內的熱加工操作</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">將設備與操作隔離。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃液體和淨化易燃氣體/蒸汽。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">操作之前及/或操作過程中，監控易燃氣體/蒸汽。LEL讀數：_____</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃粉塵/棉絨或其他可燃材料。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">是否在配有無法移走的可燃襯套或部件的設備上/內進行操作？如果是，採取以下所需的額外預防措施。</span>
                </div>
              </div>
            </div>

            {/* 對熱加工區進行防火巡視/防火監控 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">對熱加工區進行防火巡視/防火監控</h3>
              <p className="text-[9px] text-gray-600 mb-1">列出的時間適用於大多數情況。可燃隱蔽空隙、屋頂工程或有利因素使用許可證背面的表格作為指南。</p>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">熱加工操作期間進行不間斷防火巡視。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">熱加工操作結束後，對熱加工操作區類別進行</span>
                </div>
                <div className="flex items-start ml-4">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">1小時或另外___小時的不間斷防火巡查。</span>
                </div>
                <div className="flex items-start ml-4">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">3小時或另外___小時的防火監控。</span>
                </div>
              </div>
            </div>

            {/* 所需的額外預防措施 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">所需的額外預防措施:</h3>
              <div className="border border-black h-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 第2頁：警告 + 第2部分 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* 黃色警告標題 */}
        <div className="bg-yellow-400 p-4 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-2">警告</h1>
          <p className="text-xl font-bold text-black">熱加工操作進行中！小心火焰！</p>
        </div>

        {/* 兩欄佈局 */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black">
          {/* 左欄：說明 */}
          <div className="border-r-2 border-black p-3">
            <h2 className="font-bold text-sm border-b border-black pb-1 mb-2">說明</h2>
            <div className="text-xs space-y-2">
              <p><strong>熱加工操作人員：</strong>記錄開始時間，並將許可證展示於熱加工操作區域。熱加工操作結束後，將許可證交還給火警巡查員使用。</p>
              <p><strong>火警巡查員：</strong>在熱加工操作期間和操作後進行防火巡視，記錄時間，操作結束後將許可證交還核准人。</p>
              <p><strong>監察：</strong>進行最後檢查，確認無火災危險，在許可證上簽名確認，將許可證存檔。</p>
            </div>

            {/* 進行熱加工操作人員 */}
            <div className="mt-3 border-t border-black pt-2">
              <h3 className="font-bold text-xs mb-2">進行熱加工操作人員</h3>
              <div className="text-xs space-y-1">
                <div className="flex gap-4">
                  <span>{hotWorkDetails.personnelType === "employee" ? "☑" : "☐"} 員工</span>
                  <span>{hotWorkDetails.personnelType === "contractor" ? "☑" : "☐"} 承包商</span>
                </div>
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="mt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>日期<div className="border-b border-black">{hotWorkDetails.date}</div></div>
                <div>工作編號<div className="border-b border-black">{hotWorkDetails.workOrderNumber}</div></div>
              </div>
              <div className="mt-1">操作地點（建築/樓層/物體）<div className="border-b border-black">{hotWorkDetails.operationLocation}</div></div>
              <div className="mt-1">待進行的作業<div className="border-b border-black">{hotWorkDetails.workToBePerformed}</div></div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>熱加工操作人員的姓名<div className="border-b border-black">{hotWorkDetails.operatorName}</div></div>
                <div>火警巡查員姓名<div className="border-b border-black">{hotWorkDetails.fireWatcherName}</div></div>
              </div>
            </div>

            {/* 許可證核准人確認 */}
            <div className="mt-3 border-t border-black pt-2 text-xs">
              <p className="mb-2">本人確認已對上述地點進行了檢查，已採取「所需預防措施」，並授權批准進行此項操作。</p>
              <div>許可證核准人（正楷及簽名）<div className="border-b border-black h-6"></div></div>
              <div className="mt-2">
                <span className="font-bold">本許可證有效期至（限一個班次的批准）:</span>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
                  <div>日期：______</div>
                  <div>時間：______</div>
                  <div>☐ 上午/下午</div>
                </div>
              </div>
            </div>

            {/* 熱加工操作日期 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>熱加工操作日期<div className="border-b border-black"></div>開始時間：______ ☐上午/下午</div>
                <div>結束時間<div className="border-b border-black"></div>結束時間：______ ☐上午/下午</div>
              </div>
            </div>

            {/* 操作後防火巡視 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold">操作後防火巡視</div>
              <div className="grid grid-cols-2 gap-2">
                <div>結束時間：______ ☐上午/下午</div>
                <div>姓名：______</div>
              </div>
            </div>

            {/* 防火監控 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold">防火監控 ☐人員 ☐其他 結束時間</div>
              <div className="grid grid-cols-2 gap-2">
                <div>結束時間：______ ☐上午/下午</div>
                <div>姓名/其他：______</div>
              </div>
            </div>

            {/* 最後檢查 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold">最後檢查</div>
              <div className="grid grid-cols-2 gap-2">
                <div>時間：______ ☐上午/下午</div>
                <div>姓名：______</div>
              </div>
            </div>

            {/* 版權資訊 */}
            <div className="mt-2 text-[8px] text-right">
              <p>F2630_TCH © 2018 FM Global。(2018年1月修訂) 保留所有權利。</p>
            </div>
          </div>

          {/* 右欄：第2部分 - 所需預防措施 */}
          <div className="p-3">
            <h2 className="font-bold text-sm border-b border-black pb-1 mb-2">第2部分 - 所需預防措施</h2>
            
            {/* 標題行 */}
            <div className="text-xs flex items-center mb-1">
              <span className="w-4 text-center">是</span>
              <span className="w-12 text-center">不適用</span>
            </div>
            
            <div className="text-xs space-y-1">
              <div className="flex items-center">
                <span className="w-4 text-center">☐</span>
                <span className="w-4 text-center">☑</span>
                <span className="ml-1">消防泵正在運作並可自動啟動。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☐</span>
                <span className="w-4 text-center">☑</span>
                <span className="ml-1">灑水系統的供水控制閥為開啟狀態。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☑</span>
                <span className="w-4 text-center">☐</span>
                <span className="ml-1">滅火器處於工作狀態/可操作。</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 text-center">☑</span>
                <span className="w-4 text-center">☐</span>
                <span className="ml-1">熱加工操作設備處於良好工作狀態。</span>
              </div>
            </div>

            {/* 在熱加工操作區35英尺以內的安全要求 */}
            <div className="mt-2 bg-yellow-100 p-2">
              <h3 className="font-bold text-xs mb-1">在熱加工操作區35英尺（10公尺）以內的安全要求</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">移走可燃物或採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">隔離易燃氣體、可燃液體或可燃粉塵/棉絨等潛在火源（如關閉設備）。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">移走可燃液體、可燃粉塵/棉絨和可燃殘留物。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">關閉通風和輸送系統。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃物，對於存在開口或有導熱材料貫穿的地板、牆壁、天花板或屋頂的另一面，考慮進行二次防火巡視。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">熱加工操作是否在可燃屋頂上進行？如果是，採取以下所需的額外預防措施。</span>
                </div>
              </div>
            </div>

            {/* 密閉設備 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">密閉設備、管道或管路上/內的熱加工操作</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">將設備與操作隔離。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃液體和淨化易燃氣體/蒸汽。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">操作之前及/或操作過程中，監控易燃氣體/蒸汽。LEL讀數：_____</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">移走可燃粉塵/棉絨或其他可燃材料。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">是否在配有無法移走的可燃襯套或部件的設備上/內進行操作？</span>
                </div>
              </div>
            </div>

            {/* 對熱加工區進行防火巡視/防火監控 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">對熱加工區進行防火巡視/防火監控</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">熱加工操作期間進行不間斷防火巡視。</span>
                </div>
                <div className="flex items-start">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">熱加工操作結束後，對熱加工操作區類別進行</span>
                </div>
                <div className="flex items-start ml-4">
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="ml-1">1小時或另外___小時的不間斷防火巡查。</span>
                </div>
                <div className="flex items-start ml-4">
                  <span className="w-4 text-center flex-shrink-0">☑</span>
                  <span className="w-4 text-center flex-shrink-0">☐</span>
                  <span className="ml-1">3小時或另外___小時的防火監控。</span>
                </div>
              </div>
            </div>

            {/* 所需的額外預防措施 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">所需的額外預防措施:</h3>
              <div className="border border-black h-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 第3頁：警告 + 緊急聯絡 + 建築物因素表格 ========== */}
      <div className="permit-page bg-white">
        {/* 黃色警告標題 */}
        <div className="bg-yellow-400 p-4 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-1">警告！</h1>
          <p className="text-xl font-bold text-black">熱加工操作進行中！</p>
          <p className="text-xl font-bold text-black">小心火焰！</p>
          <p className="text-sm mt-2">一旦發生緊急事故，請先致電下方聯絡人，然後再嘗試滅火。</p>
        </div>

        {/* 緊急聯絡人 */}
        <div className="border-2 border-black p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold">聯絡人</span>
              <div className="border-b-2 border-black h-8 mt-1"></div>
            </div>
            <div>
              <span className="font-bold">號碼</span>
              <div className="border-b-2 border-black h-8 mt-1"></div>
            </div>
          </div>
        </div>

        {/* 建築物及使用因素決定操作後防火巡視及監控時間 */}
        <div className="border-2 border-black border-t-0 p-3">
          <h2 className="font-bold text-sm text-center mb-2">建築物及使用因素決定操作後防火巡視及監控時間</h2>
          
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-yellow-200">
                <th className="border border-black p-1" rowSpan={2}></th>
                <th className="border border-black p-1 text-center" colSpan={2}>建築因素</th>
              </tr>
              <tr className="bg-yellow-200">
                <th className="border border-black p-1 text-center">可燃建築，或FM認證的1級或A級建築材料</th>
                <th className="border border-black p-1 text-center">無隱蔽空隙的可燃建築</th>
                <th className="border border-black p-1 text-center">含有無保護隱蔽空隙的可燃建築</th>
              </tr>
              <tr className="bg-yellow-100">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1 text-center">巡視</th>
                <th className="border border-black p-1 text-center">監控</th>
                <th className="border border-black p-1 text-center">巡視</th>
                <th className="border border-black p-1 text-center">監控</th>
                <th className="border border-black p-1 text-center">巡視</th>
                <th className="border border-black p-1 text-center">監控</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">含包納於密閉設備的可燃物（例如，管路中的可燃液體）的非可燃建築</td>
                <td className="border border-black p-1 text-center">30分鐘</td>
                <td className="border border-black p-1 text-center">0小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">5小時</td>
              </tr>
              <tr>
                <td className="border border-black p-1">含有限可燃物的辦公室、零售商店、或工廠建築</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">5小時</td>
              </tr>
              <tr>
                <td className="border border-black p-1">含適度至相當數量可燃物的工廠建築，除非如下所述</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">2小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">5小時</td>
              </tr>
              <tr>
                <td className="border border-black p-1">倉庫</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">2小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">5小時</td>
              </tr>
              <tr>
                <td className="border border-black p-1">例外：建築物有助長火勢緩慢發展的加工或大量儲存散裝易燃材料所佔用（例如，紙張、紙漿、紡纖纖維、木材、樹皮、穀物、煤炭或木炭）</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">3小時</td>
                <td className="border border-black p-1 text-center">1小時</td>
                <td className="border border-black p-1 text-center">5小時</td>
              </tr>
            </tbody>
          </table>

          {/* 注意事項 */}
          <div className="mt-3 text-[9px] space-y-2">
            <p>進行熱熔法鋪設屋頂時，應採取額外預防措施，並實施至少2小時防火巡視和2小時防火監控。如果使用紅外線攝影機，則減少到1小時防火巡視和1小時防火監控。</p>
            <p>在配有無法移走的可燃襯套或部件的設備上/內進行熱加工操作時，應按照上表指示，在設備內部及周圍區域採取額外預防措施，並實施至少1小時防火巡視和3小時防火監控。</p>
          </div>
        </div>

        {/* FM Global Logo */}
        <div className="flex justify-end p-4">
          <img src="/images/FM.png" alt="FM Global" className="h-16" />
        </div>
      </div>

      {/* 列印樣式 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #hot-work-permit,
          #hot-work-permit * {
            visibility: visible;
          }
          #hot-work-permit {
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
