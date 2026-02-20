// 固定審核人員配置

export const EHS_MANAGER_EMAIL = process.env.EHS_MANAGER_EMAIL || "cti912@hotmail.com";

// 預設營運經理 Email 對照表
// 測試階段統一使用 Resend 註冊信箱（cti912@hotmail.com）
const DEFAULT_DEPARTMENT_MANAGERS: Record<string, string> = {
  "維修部": "cti912@hotmail.com",
  "生產部": "cti912@hotmail.com",
  "實驗室": "cti912@hotmail.com",
  "R&D": "cti912@hotmail.com",
  "QC": "cti912@hotmail.com",
};

/**
 * 獲取營運經理 Email（從環境變數或固定列表）
 * 若設 OPERATIONS_MANAGER_EMAIL，所有部門皆回傳該信箱（單一管理員）；未設則依 DEPARTMENT_MANAGERS 或預設對照表。
 */
export function getDepartmentManagerEmail(department: string): string | null {
  // 優先：單一營運經理（管理員），適用上線後所有部門同一人審核
  const operationsManagerEmail = process.env.OPERATIONS_MANAGER_EMAIL?.trim();
  if (operationsManagerEmail) {
    return operationsManagerEmail;
  }

  // 依部門對照
  const managersEnv = process.env.DEPARTMENT_MANAGERS || "";
  
  if (managersEnv) {
    const managers = managersEnv.split(",").map((m) => {
      const parts = m.split(":");
      if (parts.length >= 2) {
        return { dept: parts[0]?.trim() || "", email: parts[1]?.trim() || "" };
      }
      return null;
    }).filter((m): m is { dept: string; email: string } => m !== null && m.dept !== "" && m.email !== "");
    
    const manager = managers.find((m) => m.dept === department);
    if (manager?.email) {
      return manager.email;
    }
  }
  
  // 使用預設對照表
  return DEFAULT_DEPARTMENT_MANAGERS[department] || null;
}

// 預設作業區域主管 Email 對照表
// 部署前測試：統一使用 cti912@hotmail.com；上線請設 AREA_SUPERVISORS 環境變數
const DEFAULT_AREA_SUPERVISORS: Record<string, string> = {
  "生產經理": "cti912@hotmail.com",
  "倉庫經理": "cti912@hotmail.com",
  "技術部經理": "cti912@hotmail.com",
  "研發部經理": "cti912@hotmail.com",
  "維修部經理": "cti912@hotmail.com",
};

/**
 * 獲取作業區域主管 Email（從環境變數或固定列表）
 * 環境變數 AREA_SUPERVISORS 格式：名稱:email,名稱:email（例如 生產經理:prod@company.com,倉庫經理:wh@company.com）。
 * 未設時使用 DEFAULT_AREA_SUPERVISORS（部署前測試用；上線建議設 AREA_SUPERVISORS）。
 */
export function getAreaSupervisorEmail(areaSupervisor: string): string | null {
  const supervisorsEnv = process.env.AREA_SUPERVISORS || "";
  
  if (supervisorsEnv) {
    const supervisors = supervisorsEnv.split(",").map((s) => {
      const parts = s.split(":");
      if (parts.length >= 2) {
        return { name: parts[0]?.trim() || "", email: parts[1]?.trim() || "" };
      }
      return null;
    }).filter((s): s is { name: string; email: string } => s !== null && s.name !== "" && s.email !== "");
    
    const supervisor = supervisors.find((s) => s.name === areaSupervisor);
    if (supervisor?.email) {
      return supervisor.email;
    }
  }
  
  // 使用預設對照表
  return DEFAULT_AREA_SUPERVISORS[areaSupervisor] || null;
}
