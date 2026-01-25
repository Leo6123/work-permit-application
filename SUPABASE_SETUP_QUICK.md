# Supabase 連結設定 - 快速指南

## 🎯 步驟 1：取得 Supabase 連接字串

1. **登入 Supabase**
   - 前往 https://supabase.com/dashboard
   - 登入您的帳號（如果沒有帳號，先註冊）

2. **建立或選擇專案**
   - 點擊「New Project」建立新專案（如果還沒有）
   - 或選擇現有專案

3. **取得連接字串**
   - 在專案 Dashboard，點擊左側選單 **Settings**（齒輪圖示）
   - 點擊 **Database**
   - 向下滾動到 **Connection string** 區塊
   - 選擇 **URI** 標籤
   - 點擊連接字串旁的「複製」圖示

   連接字串格式類似：
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

   **重要**：
   - 將 `[YOUR-PASSWORD]` 替換為您建立專案時設定的資料庫密碼
   - 如果忘記密碼，可在 Settings → Database → Database Password 重新設定

---

## 🔧 步驟 2：在專案中設定環境變數

### 方法 1：建立 .env 檔案（推薦）

在專案根目錄（`d:\Cursor_WorkPermitApplication`）建立 `.env` 檔案：

```env
# Supabase 資料庫連接字串
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 其他環境變數
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EHS_MANAGER_EMAIL="ehs.manager@company.com"
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com"
```

**注意**：
- 將整個連接字串貼上，並替換 `[YOUR-PASSWORD]` 為實際密碼
- 建議加上 `?pgbouncer=true&connection_limit=1` 參數以確保連接穩定

### 方法 2：使用 PowerShell 環境變數（臨時）

```powershell
$env:DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
npm run dev
```

---

## 🗄️ 步驟 3：初始化資料庫

設定好 `DATABASE_URL` 後，執行以下命令：

### 1. 產生 Prisma Client

```powershell
npx prisma generate
```

### 2. 推送資料庫 Schema（建立資料表）

```powershell
npx prisma db push
```

這個命令會在 Supabase 資料庫中建立以下資料表：
- `WorkPermitApplication`（申請資料表）
- `ApprovalLog`（審核記錄表）

---

## ✅ 步驟 4：驗證設定

### 方法 1：使用 Prisma Studio 查看資料庫

```powershell
npx prisma studio
```

應該會自動開啟瀏覽器（通常是 http://localhost:5555），您可以看到：
- `WorkPermitApplication` 資料表（目前為空）
- `ApprovalLog` 資料表（目前為空）

如果成功看到這兩個資料表，表示連接成功！

### 方法 2：啟動開發伺服器測試

```powershell
npm run dev
```

然後：
1. 訪問 http://localhost:3000/applications/new
2. 建立一筆測試申請
3. 訪問 http://localhost:3000 查看申請列表

如果申請可以正常建立和顯示，表示設定成功！

---

## 🐛 常見問題

### 問題 1：連接失敗（Connection timeout）

**可能原因**：
- 連接字串中的密碼不正確
- 網路連線問題
- Supabase 專案未啟動

**解決方法**：
1. 確認密碼正確（可在 Supabase Dashboard → Settings → Database 重新設定）
2. 確認 Supabase 專案狀態為 Active
3. 檢查連接字串格式是否正確

### 問題 2：認證失敗（Authentication failed）

**可能原因**：
- 密碼中的特殊字元未正確編碼
- 連接字串格式錯誤

**解決方法**：
- 如果密碼包含特殊字元（如 `@`、`#`、`%`），需要進行 URL 編碼
- 建議在 Supabase Dashboard 重新設定密碼，使用較簡單的密碼

### 問題 3：Schema 錯誤

**可能原因**：
- 資料表已存在但結構不同

**解決方法**：
如果資料庫已有舊資料表，可以：
```powershell
# 選項 1：重置資料庫（會刪除所有資料！）
npx prisma migrate reset

# 選項 2：使用遷移（推薦）
npx prisma migrate dev --name init
```

---

## 📝 完整範例

以下是一個完整的 `.env` 檔案範例：

```env
# Supabase 資料庫連接字串
# 注意：這是範例，請替換為您的實際連接字串和密碼
DATABASE_URL="postgresql://postgres.abcd1234efgh5678:MyPassword123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 應用程式設定
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Email 通知設定
EHS_MANAGER_EMAIL="ehs.manager@company.com"
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com"
```

---

## 🎉 完成！

設定完成後，您的應用程式就可以從 Supabase 資料庫讀取和寫入申請資料了！

如有問題，請參考 `SETUP_SUPABASE.md` 獲取更詳細的說明。
