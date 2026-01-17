# EHS Manager Email 配置完成

## ✅ 已設定測試 Email

您的 EHS Manager 測試 Email 已設定為：**`cti912@hotmail.com`**

---

## 📝 配置內容

系統已配置以下環境變數：

```env
EHS_MANAGER_EMAIL=cti912@hotmail.com
```

---

## 🔄 重新啟動伺服器

**重要**：如果您已經啟動了開發伺服器，需要**重新啟動**才會載入新的環境變數：

1. **停止當前伺服器**：在終端機按 `Ctrl + C`

2. **重新啟動伺服器**：
   ```powershell
   npm run dev
   ```

---

## 🧪 測試步驟

### 1. 創建申請

1. 訪問：http://localhost:3000/applications/new
2. 填寫申請表單並提交

### 2. 查看 Email 通知

提交申請後，**查看終端機**，應該會看到：

```
============================================================
📧 EMAIL NOTIFICATION
============================================================
To: cti912@hotmail.com
Subject: 【施工安全作業許可】新申請待審核
...
```

### 3. 進行審核

在申請詳情頁的「審核表單」中：

- **審核人 Email**：填入 `cti912@hotmail.com`
- **審核結果**：選擇「通過」或「拒絕」
- **附註說明**：（如果拒絕，必填，至少 10 字元）
- **點擊「提交審核」**

---

## ✅ 驗證配置

### 方式 1：查看終端機通知

創建申請後，終端機的 Email 通知中，收件人（To）應該顯示：
```
To: cti912@hotmail.com
```

### 方式 2：測試審核權限

在申請詳情頁使用 `cti912@hotmail.com` 進行審核，應該可以正常提交。

---

## 📋 使用說明

### 在申請表單中（可選）

申請表單中也可以填寫 EHS Manager Email（選填），但系統會優先使用環境變數 `EHS_MANAGER_EMAIL`。

如果不填寫，系統會自動使用 `cti912@hotmail.com`。

### 在審核表單中（必須）

在申請詳情頁進行審核時，**必須**填寫：
- **審核人 Email**：`cti912@hotmail.com`

系統會驗證此 Email 是否為 EHS Manager，只有匹配的 Email 才能進行審核。

---

## 🔧 如果需要修改 Email

### 方法 1：修改 .env 檔案

編輯專案根目錄的 `.env` 檔案：

```env
EHS_MANAGER_EMAIL=新的email@example.com
```

然後重新啟動伺服器。

### 方法 2：在 PowerShell 中設定

```powershell
$env:EHS_MANAGER_EMAIL = "新的email@example.com"
npm run dev
```

**注意**：這種方式只對當前終端機有效，關閉後需要重新設定。

---

## ❓ 常見問題

### Q: 審核時顯示「無權限」？

**A:** 確認使用的 Email 是否為 `cti912@hotmail.com`（完全匹配，包括大小寫）。

### Q: 終端機通知還是使用舊的 Email？

**A:** 確認已重新啟動開發伺服器（`npm run dev`）。

### Q: Email 通知會實際發送嗎？

**A:** 不會。目前所有 Email 通知都是模擬的（使用 `console.log` 輸出到終端機）。實際部署時需要整合真正的 Email 服務。

---

## 🎯 開始測試

配置完成後，您可以：

1. ✅ 創建測試申請
2. ✅ 使用 `cti912@hotmail.com` 進行審核
3. ✅ 查看終端機中的 Email 通知，確認收件人正確

祝測試順利！🎉
