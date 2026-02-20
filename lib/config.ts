// 固定審核人員配置
// 分兩套：① 權限（誰可以登入並擔任該角色審核） ② Resend 通知（信寄給誰，可測試用）

// ---------- ① Resend 通知用（信寄到這些信箱） ----------
export const EHS_MANAGER_EMAIL = process.env.EHS_MANAGER_EMAIL || "cti912@hotmail.com";

const DEFAULT_DEPARTMENT_MANAGERS: Record<string, string> = {
  "維修部": "cti912@hotmail.com",
  "生產部": "cti912@hotmail.com",
  "實驗室": "cti912@hotmail.com",
  "R&D": "cti912@hotmail.com",
  "QC": "cti912@hotmail.com",
};

/** 獲取營運經理 Email（Resend 通知用） */
export function getDepartmentManagerEmail(department: string): string | null {
  const operationsManagerEmail = process.env.OPERATIONS_MANAGER_EMAIL?.trim();
  if (operationsManagerEmail) return operationsManagerEmail;
  const managersEnv = process.env.DEPARTMENT_MANAGERS || "";
  if (managersEnv) {
    const managers = managersEnv.split(",").map((m) => {
      const parts = m.split(":");
      if (parts.length >= 2) return { dept: parts[0]?.trim() || "", email: parts[1]?.trim() || "" };
      return null;
    }).filter((m): m is { dept: string; email: string } => m !== null && m.dept !== "" && m.email !== "");
    const manager = managers.find((m) => m.dept === department);
    if (manager?.email) return manager.email;
  }
  return DEFAULT_DEPARTMENT_MANAGERS[department] || null;
}

const DEFAULT_AREA_SUPERVISORS: Record<string, string> = {
  "生產經理": "cti912@hotmail.com",
  "倉庫經理": "cti912@hotmail.com",
  "技術部經理": "cti912@hotmail.com",
  "研發部經理": "cti912@hotmail.com",
  "維修部經理": "cti912@hotmail.com",
};

/** 獲取作業區域主管 Email（Resend 通知用） */
export function getAreaSupervisorEmail(areaSupervisor: string): string | null {
  const supervisorsEnv = process.env.AREA_SUPERVISORS || "";
  if (supervisorsEnv) {
    const supervisors = parseNameEmailPairs(supervisorsEnv);
    const supervisor = supervisors.find((s) => s.name === areaSupervisor);
    if (supervisor?.email) return supervisor.email;
  }
  return DEFAULT_AREA_SUPERVISORS[areaSupervisor] || null;
}

// ---------- ② 權限用（誰可以擔任該角色審核 / 誰可填單 / 管理者） ----------
function parseNameEmailPairs(env: string): { name: string; email: string }[] {
  return env.split(",").map((s) => {
    const parts = s.split(":");
    if (parts.length >= 2) return { name: parts[0]?.trim() || "", email: parts[1]?.trim() || "" };
    return null;
  }).filter((s): s is { name: string; email: string } => s !== null && s.name !== "" && s.email !== "");
}

const DEFAULT_APPLICANT_LIST = "Jack Chen:jack.chen@avient.com,Charlie Lin:charlie.lin@avient.com,David Yeh:david.yeh@avient.com";
const DEFAULT_ADMIN_EMAILS = "cti912@hotmail.com";
const DEFAULT_EHS_PERMISSION_EMAILS = "attagal.lai@avient.com";
const DEFAULT_OPERATIONS_MANAGER_PERMISSION_EMAILS = "leo.chang@avient.com";
const DEFAULT_AREA_SUPERVISORS_PERMISSION = "生產經理:hamish.chen@avient.com";

/** 管理者 Email 列表（可進所有頁面、所有審核）。 */
export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS?.trim() || DEFAULT_ADMIN_EMAILS;
  return env.split(",").map((e) => e.trim()).filter(Boolean);
}

/** 是否為管理者 */
export function isAdmin(email: string): boolean {
  return getAdminEmails().some((e) => e.toLowerCase() === email.trim().toLowerCase());
}

/** 可填單的申請人清單（姓名 + Email），用於下拉選單與填單權限。 */
export function getApplicantList(): { name: string; email: string }[] {
  const env = process.env.APPLICANT_LIST?.trim() || DEFAULT_APPLICANT_LIST;
  return parseNameEmailPairs(env);
}

/** 是否可提交新申請（僅申請人清單或管理者） */
export function canSubmitApplication(email: string): boolean {
  if (!email?.trim()) return false;
  if (isAdmin(email)) return true;
  const list = getApplicantList();
  return list.some((p) => p.email.trim().toLowerCase() === email.trim().toLowerCase());
}

/** 可擔任 EHS 審核的 Email（權限用）。含管理者。 */
export function getEHSPermissionEmails(): string[] {
  const env = process.env.EHS_PERMISSION_EMAILS?.trim() || DEFAULT_EHS_PERMISSION_EMAILS;
  const base = env.split(",").map((e) => e.trim()).filter(Boolean);
  return Array.from(new Set([...base, ...getAdminEmails()]));
}

/** 可擔任營運經理審核的 Email（權限用）。含管理者。 */
export function getOperationsManagerPermissionEmails(): string[] {
  const env = process.env.OPERATIONS_MANAGER_PERMISSION_EMAILS?.trim() || DEFAULT_OPERATIONS_MANAGER_PERMISSION_EMAILS;
  const base = env.split(",").map((e) => e.trim()).filter(Boolean);
  return Array.from(new Set([...base, ...getAdminEmails()]));
}

/** 名稱 → 可擔任該區域主管審核的 Email（權限用）。管理者不寫在此表，由 isAdmin 涵蓋。 */
export function getAreaSupervisorPermissionMap(): Record<string, string> {
  const env = process.env.AREA_SUPERVISORS_PERMISSION?.trim() || DEFAULT_AREA_SUPERVISORS_PERMISSION;
  if (env) {
    const pairs = parseNameEmailPairs(env);
    return Object.fromEntries(pairs.map((p) => [p.name, p.email]));
  }
  return { ...DEFAULT_AREA_SUPERVISORS };
}

/** 該 email 是否為 EHS 審核權限者（含管理者） */
export function isEHSPermission(email: string): boolean {
  if (isAdmin(email)) return true;
  return getEHSPermissionEmails().some((e) => e.toLowerCase() === email.toLowerCase());
}

/** 該 email 是否為營運經理審核權限者（含管理者） */
export function isOperationsManagerPermission(email: string): boolean {
  if (isAdmin(email)) return true;
  return getOperationsManagerPermissionEmails().some((e) => e.toLowerCase() === email.toLowerCase());
}

/** 該 email 是否為指定名稱的作業區域主管審核權限者 */
export function isAreaSupervisorPermission(email: string, areaSupervisorName: string): boolean {
  const map = getAreaSupervisorPermissionMap();
  const allowed = map[areaSupervisorName];
  return !!allowed && allowed.toLowerCase() === email.toLowerCase();
}

/** 該 email 是否可審核此申請的「作業區域主管」階段（區域經理列表或管理者） */
export function canAreaSupervisorApprove(email: string, applicationAreaSupervisorEmail: string | null): boolean {
  if (isAdmin(email)) return true;
  if (!applicationAreaSupervisorEmail) return false;
  const allowed = Object.values(getAreaSupervisorPermissionMap()).some((e) => e.toLowerCase() === email.toLowerCase());
  return allowed && applicationAreaSupervisorEmail.toLowerCase() === email.toLowerCase();
}
