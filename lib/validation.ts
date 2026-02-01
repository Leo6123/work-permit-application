import { z } from "zod";

// 申請表單驗證 Schema
export const applicationFormSchema = z.object({
  applicantName: z.string().min(1, "廠內申請人為必填欄位"),
  department: z.string().min(1, "部門為必填欄位"),
  workTimeStart: z.string().min(1, "作業時間開始為必填欄位"),
  workTimeEnd: z.string().min(1, "作業時間結束為必填欄位"),
  workArea: z.string().min(1, "施工區域為必填欄位"),
  workContent: z.string().min(1, "施工內容為必填欄位"),
  hazardFactors: z.object({
    generalWork: z.boolean().optional(),
    hotWork: z.boolean().optional(),
    confinedSpace: z.boolean().optional(),
    workAtHeight: z.boolean().optional(),
  }),
  hazardFactorsDescription: z.string().optional(), // 一般作業危害因素說明
  otherHazardFactorsDescription: z.string().optional(), // 其他作業危害因素說明
  hazardousOperations: z.object({
    hotWork: z.enum(["yes", "no"]).optional(),
    confinedSpace: z.enum(["yes", "no"]).optional(),
    workAtHeight: z.enum(["yes", "no"]).optional(),
    hotWorkDetails: z.object({
      personnelType: z.enum(["employee", "contractor"], {
        errorMap: () => ({ message: "請選擇進行熱加工操作人員類型" }),
      }),
      contractorName: z.string().optional(),
      date: z.string().min(1, "日期為必填欄位"),
      operationLocation: z.string().min(1, "操作地點為必填欄位"),
      workToBePerformed: z.string().min(1, "待進行的作業為必填欄位"),
      operatorName: z.string().min(1, "熱加工操作人員姓名為必填欄位"),
      fireWatcherName: z.string().min(1, "火警巡查員姓名為必填欄位"),
      areaSupervisor: z.enum(["生產經理", "倉庫經理", "技術部經理", "研發部經理", "維修部經理"], {
        errorMap: () => ({ message: "請選擇作業區域主管" }),
      }),
    }).optional(),
  }),
  personnelInfo: z.object({
    contractor: z.object({
      name: z.string().min(1, "承攬商名稱為必填欄位"),
      siteSupervisor: z.string().min(1, "承攬商施工現場負責人為必填欄位"),
      personnel: z.union([
        z.array(z.string()).min(1, "至少需有一位施工人員"),
        z.string().min(1, "至少需有一位施工人員"),
      ]).transform((val) => {
        // 如果是字串，轉換為陣列
        if (typeof val === "string") {
          return val.split(/[,，]/).map(p => p.trim()).filter(p => p);
        }
        return val;
      }),
    }),
    subcontractors: z.array(
      z.object({
        name: z.string().min(1, "再承攬商名稱為必填"),
        siteSupervisor: z.string().min(1, "再承攬商施工現場負責人為必填"),
        personnel: z.array(z.string()).min(1, "至少需有一位施工人員"),
      })
    ).optional(),
  }),
  applicantEmail: z.string().email("Email 格式不正確").min(1, "申請人 Email 為必填欄位"),
  ehsManagerEmail: z.string().email("Email 格式不正確").optional().or(z.literal("")),
  departmentManagerEmail: z.string().email("Email 格式不正確").optional().or(z.literal("")),
}).refine(
  (data) => {
    // 當勾選動火作業且選擇「是」時，hotWorkDetails 為必填
    if (data.hazardFactors.hotWork && data.hazardousOperations.hotWork === "yes") {
      return data.hazardousOperations.hotWorkDetails !== undefined;
    }
    return true;
  },
  {
    message: "當選擇動火作業「是」時，必須填寫動火作業詳細資訊",
    path: ["hazardousOperations", "hotWorkDetails"],
  }
).refine(
  (data) => {
    // 當選擇承包商時，contractorName 為必填
    if (data.hazardFactors.hotWork && 
        data.hazardousOperations.hotWork === "yes" &&
        data.hazardousOperations.hotWorkDetails?.personnelType === "contractor") {
      return data.hazardousOperations.hotWorkDetails.contractorName !== undefined &&
             data.hazardousOperations.hotWorkDetails.contractorName.trim() !== "";
    }
    return true;
  },
  {
    message: "當選擇承包商時，承包商名稱為必填欄位",
    path: ["hazardousOperations", "hotWorkDetails", "contractorName"],
  }
).refine(
  (data) => {
    // 檢查開始和結束日期是否為同一天
    if (data.workTimeStart && data.workTimeEnd) {
      const startDate = new Date(data.workTimeStart);
      const endDate = new Date(data.workTimeEnd);
      
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();
      
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();
      
      return startYear === endYear && startMonth === endMonth && startDay === endDay;
    }
    return true;
  },
  {
    message: "結束日期必須與開始日期為同一天",
    path: ["workTimeEnd"],
  }
);

// 審核請求驗證 Schema
export const approvalRequestSchema = z.object({
  approverEmail: z.string().email("Email 格式不正確"),
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
}).refine(
  (data) => {
    // 當 action 為 reject 時，comment 為必填（前端驗證會更嚴格，特別是 EHS Manager）
    // 這裡只是基本驗證
    return true;
  },
  {
    message: "拒絕時必須填寫附註說明",
  }
);

// EHS Manager 審核請求驗證（拒絕時必須填寫附註說明）
export const ehsApprovalRequestSchema = z.object({
  approverEmail: z.string().email("Email 格式不正確"),
  action: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
}).refine(
  (data) => {
    // EHS Manager 拒絕時，comment 為必填且至少 10 字元
    if (data.action === "reject") {
      return data.comment !== undefined && data.comment !== null && data.comment.trim().length >= 10;
    }
    return true;
  },
  {
    message: "拒絕時必須填寫附註說明（至少 10 個字元）",
    path: ["comment"],
  }
);

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;
export type EHSApprovalRequestInput = z.infer<typeof ehsApprovalRequestSchema>;
