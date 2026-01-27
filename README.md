# 施工安全作業許可申請系統

工作許可申請系統

## 技術棧

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (PostgreSQL via Supabase)
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
# Supabase PostgreSQL 資料庫連接字串
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 應用程式基礎 URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# EHS Manager Email
EHS_MANAGER_EMAIL="ehs.manager@company.com"

# 部門主管 Email 配置（格式：部門名稱:email,部門名稱:email）
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com"
```

**注意**：本地開發時可以使用 SQLite（`DATABASE_URL="file:./dev.db"`），但部署到 Vercel 時必須使用 Supabase PostgreSQL。

## 部署到 Vercel

### 前置準備

1. **建立 Supabase 專案**
   - 前往 [Supabase](https://supabase.com) 註冊並建立新專案
   - 取得 PostgreSQL 連接字串（Settings → Database → Connection string → URI）
   - 將連接字串中的 `[YOUR-PASSWORD]` 替換為實際密碼

2. **準備 GitHub 倉庫**
   - 確保所有代碼已推送到 GitHub

### 部署步驟

1. **連接 Vercel**
   - 前往 [Vercel](https://vercel.com) 並登入
   - 點擊 "Add New Project"
   - 選擇您的 GitHub 倉庫

2. **設定環境變數**
   在 Vercel Dashboard 的專案設定中，添加以下環境變數：
   - `DATABASE_URL` - Supabase PostgreSQL 連接字串（包含 `pgbouncer=true&connection_limit=1`）
   - `NEXT_PUBLIC_BASE_URL` - Vercel 會自動設定，或手動設定為您的 Vercel URL
   - `EHS_MANAGER_EMAIL` - EHS Manager 的 Email
   - `DEPARTMENT_MANAGERS` - 部門主管 Email 配置

3. **執行部署**
   - Vercel 會自動偵測 Next.js 專案並執行建置
   - 等待部署完成

4. **初始化資料庫**
   部署成功後，需要執行 Prisma 遷移來建立資料表：
   
   **方法 1：使用 Vercel CLI（推薦）**
   ```bash
   # 安裝 Vercel CLI
   npm i -g vercel
   
   # 登入 Vercel
   vercel login
   
   # 連結專案
   vercel link
   
   # 執行遷移
   vercel env pull .env.local
   npx prisma migrate deploy
   ```
   
   **方法 2：在 Supabase Dashboard 執行**
   - 前往 Supabase Dashboard → SQL Editor
   - 執行 `npx prisma migrate dev --name init` 生成的 SQL（或使用 `prisma db push`）

### 驗證部署

1. 訪問 Vercel 提供的部署 URL
2. 確認首頁正常顯示
3. 測試建立新申請
4. 確認資料正確儲存到 Supabase

### 注意事項

- Vercel 使用無伺服器環境，不支援 SQLite，必須使用 Supabase PostgreSQL
- 確保 Supabase 連接字串包含 `pgbouncer=true&connection_limit=1` 參數
- 首次部署後必須執行 Prisma 遷移來建立資料表
- 環境變數變更後需要重新部署

## 使用說明

1. **申請表填寫**：點選「新增申請」，填寫所有必填欄位後提交
2. **審核流程**：EHS Manager 和部門主管可在申請詳情頁進行審核
3. **查看進度**：在任何申請詳情頁可查看當前審核進度和記錄
