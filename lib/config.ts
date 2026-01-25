// 固定審核人員配置

export const EHS_MANAGER_EMAIL = process.env.EHS_MANAGER_EMAIL || "ehs.manager@company.com";

// 預設部門主管 Email 對照表
// 暫時設定為 afn3028@gmail.com 以便測試，日後可修改
const DEFAULT_DEPARTMENT_MANAGERS: Record<string, string> = {
  "維修部": "afn3028@gmail.com",
  "生產部": "afn3028@gmail.com",
  "實驗室": "afn3028@gmail.com",
  "R&D": "afn3028@gmail.com",
  "QC": "afn3028@gmail.com",
};

/**
 * 獲取部門主管 Email（從環境變數或固定列表）
 */
export function getDepartmentManagerEmail(department: string): string | null {
  // 先嘗試從環境變數讀取
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
// 暫時設定為測試 Email，日後可修改
const DEFAULT_AREA_SUPERVISORS: Record<string, string> = {
  "生產經理": "production.manager@company.com",
  "倉庫經理": "warehouse.manager@company.com",
  "技術部經理": "tech.manager@company.com",
  "研發部經理": "rnd.manager@company.com",
  "維修部經理": "maintenance.manager@company.com",
};

/**
 * 獲取作業區域主管 Email（從環境變數或固定列表）
 */
export function getAreaSupervisorEmail(areaSupervisor: string): string | null {
  // 先嘗試從環境變數讀取
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
