# Supabase 設定指南

## 📋 前置準備

1. 前往 https://supabase.com 註冊帳號（如果還沒有）
2. 建立新的專案（Project）

---

## 🔧 設定步驟

### 1. 取得 Supabase 連接字串

1. 進入 Supabase 專案 Dashboard
2. 點擊左側選單的 **Settings** → **Database**
3. 在 **Connection string** 區塊，選擇 **URI** 模式
4. 複製連接字串，格式類似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 2. 設定環境變數

在專案根目錄建立 `.env` 檔案（如果還沒有），加入以下內容：

```env
# Supabase 資料庫連接字串
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 其他環境變數（如果需要）
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EHS_MANAGER_EMAIL="ehs.manager@company.com"
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com"
```

**注意**：
- 將 `[YOUR-PASSWORD]` 替換為您的資料庫密碼
- 將 `[PROJECT-REF]` 替換為您的專案引用 ID
- 建議使用 `pgbouncer=true&connection_limit=1` 參數以確保連接穩定

---

## 🗄️ 初始化資料庫

設定好環境變數後，執行以下命令初始化資料庫：

### 1. 產生 Prisma Client

```bash
npx prisma generate
```

### 2. 推送資料庫 Schema（建立資料表）

```bash
npx prisma db push
```

或者使用遷移（Migration）方式（推薦生產環境）：

```bash
# 建立遷移檔案
npx prisma migrate dev --name init

# 套用遷移
npx prisma migrate deploy
```

### 3. 驗證資料庫連接

```bash
npx prisma studio
```

如果成功開啟 Prisma Studio，表示連接正常。

---

## ✅ 驗證設定

### 方法 1：使用 Prisma Studio

執行 `npx prisma studio`，應該可以看到：
- `WorkPermitApplication` 資料表
- `ApprovalLog` 資料表

### 方法 2：測試 API

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問 http://localhost:3000/applications/new 建立測試申請

3. 訪問 http://localhost:3000 查看申請列表是否正常載入

---

## 🔍 疑難排解

### 問題 1：連接超時

**解決方法**：
- 確認連接字串正確
- 確認 Supabase 專案狀態為 Active
- 檢查網路連線

### 問題 2：認證失敗

**解決方法**：
- 確認資料庫密碼正確（可在 Supabase Dashboard → Settings → Database 重新設定）
- 確認連接字串中的密碼已正確編碼（特殊字元需要 URL 編碼）

### 問題 3：Schema 不相容

**解決方法**：
- 如果資料表已存在，可能需要先刪除舊的資料表
- 或使用 `npx prisma migrate reset` 重置資料庫（**注意：會刪除所有資料**）

### 問題 4：連接數限制

**解決方法**：
- 在連接字串中加入 `connection_limit=1` 參數
- 使用連接池（pgbouncer）

---

## 📝 從 SQLite 遷移資料（可選）

如果您有現有的 SQLite 資料需要遷移：

1. 匯出 SQLite 資料：
   ```bash
   sqlite3 prisma/dev.db .dump > data.sql
   ```

2. 轉換 SQL 語法（SQLite 和 PostgreSQL 語法略有差異）

3. 在 Supabase Dashboard → SQL Editor 執行轉換後的 SQL

**注意**：由於 SQLite 和 PostgreSQL 的語法差異，建議使用 Prisma 的資料遷移工具或手動轉換。

---

## 🚀 部署到生產環境

部署到 Vercel 或其他平台時：

1. 在平台設定環境變數 `DATABASE_URL`
2. 執行建置前遷移：
   ```bash
   npx prisma migrate deploy
   ```
3. 確保環境變數正確設定

---

## 📚 相關資源

- [Supabase 文件](https://supabase.com/docs)
- [Prisma + Supabase 指南](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-supabase)
- [PostgreSQL 連接字串格式](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
