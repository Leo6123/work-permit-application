# 施工安全作業許可申請系統

工作許可申請系統

## 技術棧

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (SQLite)
- **React Hook Form** + **Zod** (表單驗證)

## 開發

```bash
# 安裝依賴
npm install

# 初始化資料庫（首次運行）
# 注意：Prisma 7 需要特殊配置，可能需要手動建立資料庫檔案
npx prisma generate

# 啟動開發伺服器
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 功能特性

1. **申請表線上填寫**
   - 完整的施工安全作業許可申請表單
   - 必填欄位驗證
   - 動火作業邏輯驗證

2. **多層級審核流程**
   - EHS Manager 審核
   - 部門主管審核
   - EHS Manager 拒絕時必須填寫附註說明（至少 10 字元）

3. **Email 通知機制（模擬）**
   - 申請提交後通知 EHS Manager
   - EHS 審核通過後通知部門主管
   - 審核結果通知申請人
   - 所有通知使用 `console.log` 模擬輸出

4. **線上點閱**
   - 申請列表查看
   - 申請詳情及審核進度查看
   - 狀態篩選功能

## 專案結構

```
app/
  api/
    applications/
      route.ts              # GET: 查詢列表, POST: 提交申請
      [id]/
        route.ts            # GET: 查詢單筆, PATCH: 更新狀態
        approve/
          route.ts          # POST: 審核操作
  applications/
    new/
      page.tsx              # 申請表單頁面
    [id]/
      page.tsx              # 申請詳情及進度頁面
  page.tsx                  # 首頁（申請列表）
lib/
  prisma.ts                 # Prisma Client 初始化
  notifications.ts          # Email 通知模擬服務
  validation.ts             # 表單驗證邏輯
  config.ts                 # 固定審核人員配置
types/
  application.ts            # TypeScript 類型定義
prisma/
  schema.prisma             # 資料庫 schema
```

## 環境變數

建立 `.env` 檔案（或設定環境變數）：

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EHS_MANAGER_EMAIL="ehs.manager@company.com"
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com"
```

## 使用說明

1. **申請表填寫**：點選「新增申請」，填寫所有必填欄位後提交
2. **審核流程**：EHS Manager 和部門主管可在申請詳情頁進行審核
3. **查看進度**：在任何申請詳情頁可查看當前審核進度和記錄
