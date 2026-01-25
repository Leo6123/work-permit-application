// 申請表單類型定義

export type ApplicationStatus = 
  | "pending_area_supervisor"
  | "pending_ehs" 
  | "pending_manager" 
  | "approved" 
  | "rejected";

export type ApproverType = 
  | "area_supervisor"
  | "ehs_manager" 
  | "department_manager";

export type ApprovalAction = 
  | "approve" 
  | "reject";

// 工作環境危害因素
export interface HazardFactors {
  generalWork?: boolean;           // 一般作業
  hotWork?: boolean;               // 動火作業
  confinedSpace?: boolean;         // 局限空間
  workAtHeight?: boolean;          // 高處作業及電梯維修保養
}

// 動火作業詳細資訊
export interface HotWorkDetails {
  personnelType: "employee" | "contractor";  // 進行熱加工操作人員類型
  contractorName?: string;                    // 承包商名稱（當選擇承包商時必填）
  date: string;                               // 日期
  workOrderNumber: string;                    // 工作編號
  operationLocation: string;                  // 操作地點(建築/樓層/物體)
  workToBePerformed: string;                  // 待進行的作業
  operatorName: string;                       // 熱加工操作人員的姓名
  fireWatcherName: string;                    // 火警巡查員姓名
  areaSupervisor: "生產經理" | "倉庫經理" | "技術部經理" | "研發部經理" | "維修部經理"; // 作業區域主管
}

// 危險性作業
export interface HazardousOperations {
  hotWork?: "yes" | "no";          // 動火
  confinedSpace?: "yes" | "no";    // 局限空間
  workAtHeight?: "yes" | "no";     // 高處作業及電梯維修保養
  hotWorkDetails?: HotWorkDetails;  // 動火作業詳細資訊
}

// 承攬商資訊
export interface ContractorInfo {
  name: string;                    // 承攬商名稱
  siteSupervisor: string;          // 承攬商施工現場負責人
  personnel: string[];             // 承攬商施工人員
}

// 再承攬商資訊
export interface SubcontractorInfo {
  name: string;                    // 再承攬商名稱
  siteSupervisor: string;          // 再承攬商施工現場負責人
  personnel: string[];             // 再承攬商施工人員
}

// 入廠作業人員資訊
export interface PersonnelInfo {
  contractor: ContractorInfo;
  subcontractors?: SubcontractorInfo[];
}

// 申請表單資料
export interface ApplicationFormData {
  applicantName: string;           // 廠內申請人
  department: string;              // 部門
  workTimeStart: string;           // 作業時間開始 (ISO string)
  workTimeEnd: string;             // 作業時間結束 (ISO string)
  workArea: string;                // 施工區域
  workContent: string;             // 施工內容
  hazardFactors: HazardFactors;
  hazardousOperations: HazardousOperations;
  personnelInfo: PersonnelInfo;
  applicantEmail?: string;         // 申請人 Email
  ehsManagerEmail?: string;        // EHS Manager Email
  departmentManagerEmail?: string; // 部門主管 Email
}

// 審核請求資料
export interface ApprovalRequest {
  approverEmail: string;
  action: ApprovalAction;
  comment?: string;                // 附註說明（拒絕時必填，特別是 EHS Manager）
}

// 申請記錄（包含審核記錄）
export interface ApplicationWithLogs {
  id: string;
  applicantName: string;
  department: string;
  workTimeStart: Date;
  workTimeEnd: Date;
  workArea: string;
  workContent: string;
  contractorInfo: ContractorInfo;
  hazardFactors: HazardFactors;
  hazardousOperations: HazardousOperations;
  personnelInfo: PersonnelInfo;
  status: ApplicationStatus;
  ehsManagerEmail: string | null;
  departmentManagerEmail: string | null;
  areaSupervisorEmail: string | null;
  applicantEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  approvalLogs: ApprovalLog[];
  workOrderNumber?: string; // 工單編號：EHS + yyyy + mm + dd + HH + MM
}

// 審核記錄
export interface ApprovalLog {
  id: string;
  applicationId: string;
  approverType: ApproverType;
  approverEmail: string;
  action: ApprovalAction;
  comment: string | null;
  approvedAt: Date;
}
