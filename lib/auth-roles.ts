import {
  isEHSPermission,
  isOperationsManagerPermission,
  canAreaSupervisorApprove,
  canSubmitApplication,
  getAreaSupervisorPermissionMap,
} from "@/lib/config";

export type UserRoles = {
  email: string;
  applicant: true;
  canSubmitApplication: boolean; // 僅申請人清單或管理者可填單
  ehs: boolean;
  areaSupervisor: boolean;
  operationsManager: boolean;
};

/** 依登入者 email 回傳其角色（申請者/可填單、EHS、區域經理、營運經理） */
export function getRolesForEmail(email: string): UserRoles {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { email: "", applicant: true, canSubmitApplication: false, ehs: false, areaSupervisor: false, operationsManager: false };
  }
  const ehs = isEHSPermission(email);
  const operationsManager = isOperationsManagerPermission(email);
  const areaSupervisorMap = getAreaSupervisorPermissionMap();
  const areaSupervisor = Object.values(areaSupervisorMap).some(
    (e) => e.trim().toLowerCase() === normalized
  );
  return {
    email,
    applicant: true,
    canSubmitApplication: canSubmitApplication(email),
    ehs,
    areaSupervisor,
    operationsManager,
  };
}

/** 當前申請狀態下，此 email 是否可執行審核 */
export function canApproveForStatus(
  email: string,
  status: string,
  applicationAreaSupervisorEmail: string | null,
  applicationDepartment: string
): boolean {
  if (status === "pending_area_supervisor") {
    return canAreaSupervisorApprove(email, applicationAreaSupervisorEmail);
  }
  if (status === "pending_ehs") return isEHSPermission(email);
  if (status === "pending_manager") return isOperationsManagerPermission(email);
  return false;
}
