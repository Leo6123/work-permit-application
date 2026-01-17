# Email 配置說明

## 📧 EHS Manager Email 配置

系統使用環境變數 `EHS_MANAGER_EMAIL` 來設定 EHS Manager 的 Email 地址。

---

## 🔧 配置方法

### 方法 1：使用 .env 檔案（推薦）

在專案根目錄建立 `.env` 檔案（如果還沒有），加入以下內容：

```env
# EHS Manager Email
EHS_MANAGER_EMAIL="your-test-email@example.com"

# 部門主管 Email（可選）
DEPARTMENT_MANAGERS="維修部:manager.maintenance@example.com,生產部:manager.production@example.com"

# 資料庫連接（必需）
DATABASE_URL="file:./dev.db"

# 基礎 URL（用於 Email 通知中的連結）
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 方法 2：在 PowerShell 中設定環境變數

```powershell
$env:EHS_MANAGER_EMAIL = "your-test-email@example.com"
npm run dev
```

**注意**：每次重新啟動伺服器時，都需要重新設定環境變數。

### 方法 3：修改程式碼預設值（不推薦，僅用於測試）

如果只是想快速測試，可以修改 `lib/config.ts`：

```typescript
export const EHS_MANAGER_EMAIL = process.env.EHS_MANAGER_EMAIL || "your-test-email@example.com";
```

---

## 🧪 測試用 Email 範例

以下是一些測試用的 Email 範例：

```env
# 範例 1：使用您的個人 Email
EHS_MANAGER_EMAIL="your.email@gmail.com"

# 範例 2：使用公司測試 Email
EHS_MANAGER_EMAIL="ehs.test@company.com"

# 範例 3：使用臨時測試 Email
EHS_MANAGER_EMAIL="test.ehs.manager@example.com"
```

---

## ✅ 驗證配置

配置完成後，可以透過以下方式驗證：

1. **查看申請詳情頁**
   - 在審核表單中，填入您設定的 EHS Manager Email
   - 如果 Email 匹配，應該可以正常審核

2. **查看終端機通知**
   - 創建申請後，終端機顯示的 Email 通知
   - 收件人（To）應該顯示您設定的 Email

3. **檢查環境變數**
   - 在程式碼中使用 `console.log(process.env.EHS_MANAGER_EMAIL)` 查看
   - 或在審核 API 中查看日誌

---

## 📝 完整 .env 範例

```env
# 資料庫
DATABASE_URL="file:./dev.db"

# 基礎 URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# EHS Manager Email（測試用）
EHS_MANAGER_EMAIL="ehs.test@company.com"

# 部門主管 Email（格式：部門名稱:Email，多個用逗號分隔）
DEPARTMENT_MANAGERS="維修部:manager.maintenance@company.com,生產部:manager.production@company.com,實驗室:manager.lab@company.com,R&D:manager.rd@company.com,QC:manager.qc@company.com"
```

---

## 🔄 重新載入配置

修改 `.env` 檔案後，需要**重新啟動開發伺服器**才會生效：

```powershell
# 停止當前伺服器（Ctrl + C）
# 然後重新啟動
npm run dev
```

---

## ❓ 常見問題

### Q: 設定 Email 後，通知還是使用預設 Email？

**A:** 確認已重新啟動開發伺服器（`npm run dev`）。環境變數只在伺服器啟動時載入。

### Q: 可以同時設定多個 EHS Manager Email 嗎？

**A:** 目前系統只支援單一 EHS Manager Email。如果需要多個，需要修改程式碼邏輯。

### Q: Email 通知會實際發送嗎？

**A:** 不會。目前所有 Email 通知都是模擬的（使用 `console.log` 輸出到終端機）。實際部署時需要整合真正的 Email 服務（如 SendGrid、Nodemailer 等）。

---

## 🎯 下一步

設定好 Email 後，可以：

1. 創建測試申請
2. 使用設定的 Email 進行審核
3. 查看終端機中的 Email 通知，確認收件人正確
