"use client";
import { useState, useEffect, useCallback } from "react";
import type { PreventiveMeasures } from "@/types/application";

interface HotWorkDetails {
  personnelType: "employee" | "contractor";
  contractorName?: string;
  date: string;
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
  editable?: boolean;
  areaSupervisorPhone?: string | null;
  areaSupervisorDisplayName?: string | null;
  initialPreventiveMeasures?: PreventiveMeasures | null;
  onPreventiveMeasuresChange?: (data: PreventiveMeasures) => void;
}

export default function HotWorkPermit({ hotWorkDetails, workTimeStart, workTimeEnd, editable = false, areaSupervisorPhone, areaSupervisorDisplayName, initialPreventiveMeasures, onPreventiveMeasuresChange }: HotWorkPermitProps) {
  const endDate = new Date(workTimeEnd);
  const endDateStr = endDate.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const endHour = parseInt(
    endDate.toLocaleString("en-US", { timeZone: "Asia/Taipei", hour: "numeric", hour12: false })
  );
  const isAM = endHour < 12;
  const endTimeStr = endDate.toLocaleTimeString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Checkbox state for right column (is/na pairs keyed by id)
  const [cb, setCb] = useState<Record<string, boolean>>(initialPreventiveMeasures?.checkboxes ?? {});
  const [lelValue, setLelValue] = useState(initialPreventiveMeasures?.lelValue ?? "");
  const [extraPatrolHours, setExtraPatrolHours] = useState(initialPreventiveMeasures?.extraPatrolHours ?? "");
  const [extraMonitorHours, setExtraMonitorHours] = useState(initialPreventiveMeasures?.extraMonitorHours ?? "");
  const [extraMeasures, setExtraMeasures] = useState(initialPreventiveMeasures?.extraMeasures ?? "");

  // Notify parent of changes
  const notifyChange = useCallback((
    newCb: Record<string, boolean>,
    newLel: string,
    newPatrol: string,
    newMonitor: string,
    newMeasures: string
  ) => {
    onPreventiveMeasuresChange?.({
      checkboxes: newCb,
      lelValue: newLel,
      extraPatrolHours: newPatrol,
      extraMonitorHours: newMonitor,
      extraMeasures: newMeasures,
    });
  }, [onPreventiveMeasuresChange]);

  const toggle = (key: string) => setCb((prev) => {
    const next = { ...prev, [key]: !prev[key] };
    notifyChange(next, lelValue, extraPatrolHours, extraMonitorHours, extraMeasures);
    return next;
  });

  // Renders a yes/na checkbox pair
  const renderCB = (id: string) =>
    editable ? (
      <>
        <input
          type="checkbox"
          className="w-4 h-4 flex-shrink-0 cursor-pointer"
          checked={!!cb[`${id}_yes`]}
          onChange={() => toggle(`${id}_yes`)}
        />
        <input
          type="checkbox"
          className="w-4 h-4 flex-shrink-0 ml-1 cursor-pointer"
          checked={!!cb[`${id}_na`]}
          onChange={() => toggle(`${id}_na`)}
        />
      </>
    ) : (
      <>
        <span className="w-4 text-center flex-shrink-0">{cb[`${id}_yes`] ? "☑" : "☐"}</span>
        <span className="w-4 text-center flex-shrink-0">{cb[`${id}_na`] ? "☑" : "☐"}</span>
      </>
    );

  return (
    <div id="hot-work-permit" className="bg-white text-black">

      {/* ========== 第1頁：警告 + 說明 + 第2部分 ========== */}
      <div className="permit-page bg-white" style={{ pageBreakAfter: 'always' }}>
        {/* 黃色警告標題 */}
        <div className="bg-yellow-400 p-3 text-center">
          <h1 className="text-3xl font-bold text-black mb-1">警告！</h1>
          <p className="text-lg font-bold text-black">熱加工操作進行中！小心火災！</p>
        </div>

        {/* 兩欄佈局 */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black">
          {/* 左欄：說明 + 表單資料 */}
          <div className="border-r-2 border-black p-3">
            <h2 className="font-bold text-sm border-b border-black pb-1 mb-2">說明</h2>
            <div className="text-xs space-y-2">
              <p><strong>熱加工操作人員：</strong>記錄開始時間，並將許可證展示於熱加工操作區/熱加工操作結束後，記錄操作完成時間，並將許可證交由火警巡查員使用。</p>
              <p><strong>消防員：</strong>在熱加工操作期間和操作後進行防火巡視，記錄時間，操作結束後將許可證交還核准人。</p>
              <p><strong>監察：</strong>進行最後檢查，確認無火災危險，在許可證上簽名確認，將許可證存檔。</p>
            </div>

            {/* 進行熱加工操作人員 */}
            <div className="mt-3 border-t border-black pt-2">
              <h3 className="font-bold text-xs mb-1">進行熱加工操作人員</h3>
              <div className="text-xs flex gap-4">
                <span>☐ 員工</span>
                <span>☐ 承包商</span>
              </div>
              <div className="text-xs mt-1">
                承包商：<span className="border-b border-black inline-block w-32">{hotWorkDetails.personnelType === "contractor" ? hotWorkDetails.contractorName : ""}</span>
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="mt-2 text-xs space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>日期<div className="border-b border-black">{hotWorkDetails.date}</div></div>
                <div>工作編號<div className="border-b border-black"></div></div>
              </div>
              <div>操作地點（建築/樓層/對象）<div className="border-b border-black">{hotWorkDetails.operationLocation}</div></div>
              <div>待進行的作業<div className="border-b border-black">{hotWorkDetails.workToBePerformed}</div></div>
              <div className="grid grid-cols-2 gap-2">
                <div>熱加工操作人員的姓名<div className="border-b border-black">{hotWorkDetails.operatorName}</div></div>
                <div>火警巡查員姓名<div className="border-b border-black">{hotWorkDetails.fireWatcherName}</div></div>
              </div>
            </div>

            {/* 許可證核准人確認 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <p className="mb-2">本人確認已對上述地點進行了檢查，已採取「必要預防措施」，並授權批准進行此項操作。</p>
              <div>許可證核准人（正楷及簽名）<div className="border-b border-black h-6 text-gray-500 italic">參閱電子審核紀錄</div></div>
              <div className="mt-2">
                <div className="font-bold">本許可證有效期至（僅限批准一個班次）:</div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
                  <div>日期：{endDateStr}</div>
                  <div>時間：{endTimeStr}</div>
                  <div>{isAM ? "☑" : "☐"} 上午　{isAM ? "☐" : "☑"} 下午</div>
                </div>
              </div>
            </div>

            {/* 熱加工操作日期 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold mb-1">熱加工操作日期</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>開始時間：______<br/>☐ 上午/下午</div>
                <div>結束時間：______<br/>☐ 上午/下午</div>
              </div>
            </div>

            {/* 操作後防火巡視 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold mb-1">操作後防火巡視</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>結束時間：______ ☐ 上午/下午</div>
                <div>姓名：______</div>
              </div>
            </div>

            {/* 防火監控 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold mb-1">防火監控 ☐ 人員 1人 ☐ 其他 結束時間</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>結束時間：______ ☐ 上午/下午</div>
                <div>姓名/其他：______</div>
              </div>
            </div>

            {/* 最後檢查 */}
            <div className="mt-2 border-t border-black pt-2 text-xs">
              <div className="font-bold mb-1">最後檢查</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>時間：______ ☐ 上午/下午</div>
                <div>姓名：______</div>
              </div>
            </div>

            {/* 版權資訊 */}
            <div className="mt-3 text-[8px] text-right">
              <p>F2830_TCH © 2018 FM. (2021年5月，08/2024) 版權所有。</p>
            </div>
          </div>

          {/* 右欄：第2部分 - 必要預防措施 */}
          <div className="p-3">
            <div className="flex justify-between items-center border-b border-black pb-1 mb-2">
              <h2 className="font-bold text-sm">第2部分</h2>
              <h2 className="font-bold text-sm">必要預防措施</h2>
            </div>

            {/* 標題行 */}
            <div className="text-xs flex items-center mb-1">
              <span className="w-4 text-center">是</span>
              <span className="w-12 text-center">不適用</span>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                {renderCB("pump")}
                <span className="ml-1">消防泵正在運作並可自動啟動。</span>
              </div>
              <div className="flex items-center gap-1">
                {renderCB("sprinkler")}
                <span className="ml-1">灑水系統的供水控制閥為開啟狀態。</span>
              </div>
              <div className="flex items-center gap-1">
                {renderCB("extinguisher")}
                <span className="ml-1">滅火器處於工作狀態/可操作。</span>
              </div>
              <div className="flex items-center gap-1">
                {renderCB("equipment")}
                <span className="ml-1">熱加工操作設備處於良好工作狀態。</span>
              </div>
            </div>

            {/* 在熱加工操作區35英尺以內的安全要求 */}
            <div className="mt-2 bg-yellow-100 p-2">
              <h3 className="font-bold text-xs mb-1">在熱加工操作區35英尺（10公尺）以內的安全要求</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start gap-1">
                  {renderCB("z35_cover")}
                  <span className="ml-1">採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_move")}
                  <span className="ml-1">移走可燃物或採用經核准（例如，FM認證）的焊接防護墊、防火毯和防火簾遮蔽可燃建築。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_isolate")}
                  <span className="ml-1">隔離易燃氣體、可燃液體或可燃粉塵/棉絨等潛在火源（如關閉設備）。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_removeLiquid")}
                  <span className="ml-1">移走可燃液體、可燃粉塵/棉絨和可燃殘留物。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_ventilation")}
                  <span className="ml-1">關閉通風和輸送系統。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_openings")}
                  <span className="ml-1">移走可燃物，對於存在開口或有導熱材料貫穿的地板、牆壁、天花板或屋頂的另一面，考慮進行二次防火巡視。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_combustibleRoof")}
                  <span className="ml-1">熱加工操作是否在可燃屋頂上進行（例如，熱熔法鋪設屋頂）？如果是，採取以下所需的額外預防措施。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("z35_roofEquip")}
                  <span className="ml-1">熱加工操作是否在有可燃屋頂的設備上進行？如果是，採取以下所需的額外預防措施。</span>
                </div>
              </div>
            </div>

            {/* 密閉設備、管道或管路上/內的熱加工操作 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">密閉設備、管道或管路上/內的熱加工操作</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start gap-1">
                  {renderCB("conf_isolate")}
                  <span className="ml-1">將設備與操作隔離。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("conf_purge")}
                  <span className="ml-1">移走可燃液體和淨化易燃氣體/蒸汽。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("conf_monitor")}
                  <span className="ml-1">
                    操作之前及/或操作過程中，監控易燃氣體/蒸汽。LEL讀數：
                    {editable ? (
                      <input
                        type="text"
                        value={lelValue}
                        onChange={(e) => { setLelValue(e.target.value); notifyChange(cb, e.target.value, extraPatrolHours, extraMonitorHours, extraMeasures); }}
                        className="border-b border-black bg-gray-100 w-16 px-1 text-[10px] outline-none"
                        placeholder="_____"
                      />
                    ) : (
                      <span>_____</span>
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("conf_removeDust")}
                  <span className="ml-1">移走可燃粉塵/棉絨或其他可燃材料。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("conf_noRemove")}
                  <span className="ml-1">是否在配有無法移走的可燃襯套或部件的設備上/內進行操作？如果是，採取以下所需的額外預防措施。</span>
                </div>
              </div>
            </div>

            {/* 對熱加工區進行防火巡視/防火監控 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">對熱加工區進行防火巡視/防火監控</h3>
              <div className="text-[10px] space-y-1">
                <div className="flex items-start gap-1">
                  {renderCB("fw_continuous")}
                  <span className="ml-1">熱加工操作期間進行不間斷防火巡視。</span>
                </div>
                <div className="flex items-start gap-1">
                  {renderCB("fw_afterOp")}
                  <span className="ml-1">熱加工操作結束後，對熱加工操作區類別進行</span>
                </div>
                <div className="flex items-start gap-1 ml-4">
                  {renderCB("fw_patrol")}
                  <span className="ml-1">
                    1小時或另外
                    {editable ? (
                      <input
                        type="text"
                        value={extraPatrolHours}
                        onChange={(e) => { setExtraPatrolHours(e.target.value); notifyChange(cb, lelValue, e.target.value, extraMonitorHours, extraMeasures); }}
                        className="border-b border-black bg-gray-100 w-10 px-1 text-[10px] outline-none mx-1"
                        placeholder="___"
                      />
                    ) : (
                      <span>___</span>
                    )}
                    小時的不間斷防火巡查。
                  </span>
                </div>
                <div className="flex items-start gap-1 ml-4">
                  {renderCB("fw_monitor")}
                  <span className="ml-1">
                    3小時或另外
                    {editable ? (
                      <input
                        type="text"
                        value={extraMonitorHours}
                        onChange={(e) => { setExtraMonitorHours(e.target.value); notifyChange(cb, lelValue, extraPatrolHours, e.target.value, extraMeasures); }}
                        className="border-b border-black bg-gray-100 w-10 px-1 text-[10px] outline-none mx-1"
                        placeholder="___"
                      />
                    ) : (
                      <span>___</span>
                    )}
                    小時的防火監控。
                  </span>
                </div>
              </div>
            </div>

            {/* 必要的額外預防措施 */}
            <div className="mt-2">
              <h3 className="font-bold text-xs mb-1">必要的額外預防措施:</h3>
              {editable ? (
                <textarea
                  value={extraMeasures}
                  onChange={(e) => { setExtraMeasures(e.target.value); notifyChange(cb, lelValue, extraPatrolHours, extraMonitorHours, e.target.value); }}
                  className="border border-black w-full h-16 p-1 text-[10px] bg-gray-50 resize-none outline-none"
                  placeholder="請填寫額外預防措施..."
                />
              ) : (
                <div className="border border-black h-16 p-1 text-[10px] whitespace-pre-wrap">{extraMeasures}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== 第2頁：警告 + 緊急聯絡 + 建築物因素表格 ========== */}
      <div className="permit-page bg-white">
        {/* 黃色警告標題 */}
        <div className="bg-yellow-400 p-4 text-center">
          <h1 className="text-4xl font-bold text-black mb-1">警告！</h1>
          <p className="text-xl font-bold text-black">熱加工操作進行中！</p>
          <p className="text-xl font-bold text-black">小心火災！</p>
          <p className="text-sm mt-2">若發生緊急事故，請先致電下方聯絡人，然後再嘗試滅火。</p>
        </div>

        {/* 緊急聯絡人 */}
        <div className="border-2 border-black p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left font-bold">聯絡人</th>
                <th className="border border-black p-2 text-left font-bold">電話號碼</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2">Attagal Lai</td>
                <td className="border border-black p-2">0927-033-132</td>
              </tr>
              {hotWorkDetails.areaSupervisor && areaSupervisorPhone && (
                <tr>
                  <td className="border border-black p-2">
                    {areaSupervisorDisplayName ?? hotWorkDetails.areaSupervisor}
                  </td>
                  <td className="border border-black p-2">{areaSupervisorPhone}</td>
                </tr>
              )}
              <tr>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 建築物及使用因素決定操作後防火巡視及監控時間 */}
        <div className="border-2 border-black border-t-0 p-3">
          <h2 className="font-bold text-sm text-center mb-2">建築物及使用因素決定操作後防火巡視及監控時間</h2>

          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-yellow-200">
                <th className="border border-black p-1" rowSpan={2}></th>
                <th className="border border-black p-1 text-center" colSpan={6}>建築因素</th>
              </tr>
              <tr className="bg-yellow-200">
                <th className="border border-black p-1 text-center" colSpan={2}>非可燃建築或 FM 認證的 1 級或 A 級建築材料</th>
                <th className="border border-black p-1 text-center" colSpan={2}>無隱蔽空隙的可燃建築</th>
                <th className="border border-black p-1 text-center" colSpan={2}>含有無保護隱蔽空隙的可燃建築</th>
              </tr>
              <tr className="bg-yellow-100">
                <th className="border border-black p-1 text-center">使用因素</th>
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
