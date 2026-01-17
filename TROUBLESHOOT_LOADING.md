# 頁面一直載入問題排查

## 🔍 問題診斷

如果申請詳情頁一直顯示載入中的狀態（loading spinner），請按照以下步驟排查：

---

## 步驟 1：檢查終端機錯誤訊息

**最重要**：查看運行 `npm run dev` 的終端機視窗，是否有錯誤訊息。

常見錯誤：
- 資料庫連接錯誤
- JSON 解析錯誤
- Prisma Client 錯誤

---

## 步驟 2：檢查瀏覽器控制台

1. 按 `F12` 打開開發者工具
2. 點擊「Console」分頁
3. 查看是否有錯誤訊息（紅色）

常見錯誤：
- `Failed to fetch`
- `Network error`
- `JSON parse error`

---

## 步驟 3：檢查 URL

確認 URL 格式是否正確：

**正確格式**：
```
http://localhost:3000/applications/clxxxxx...
```

**錯誤格式**（會導致一直載入）：
```
http://localhost:3000/applications/[ID]
http://localhost:3000/applications/%5BID%5D
```

**解決方法**：
- 從首頁的申請列表點擊「查看詳情」
- 或從終端機的 Email 通知中複製正確的連結

---

## 步驟 4：檢查資料庫

### 4.1 確認資料庫檔案存在

檢查專案根目錄是否有 `dev.db` 檔案（SQLite 資料庫）。

**如果沒有**：
```powershell
# 重新初始化資料庫
$env:DATABASE_URL="file:./dev.db"
npx prisma db push
```

### 4.2 確認資料庫中有申請記錄

如果使用 Prisma Studio：
```powershell
npx prisma studio
```

訪問 http://localhost:5555，查看 `WorkPermitApplication` 表中是否有記錄。

---

## 步驟 5：檢查 API 端點

直接在瀏覽器中訪問 API 端點，查看是否返回資料：

```
http://localhost:3000/api/applications/[實際申請ID]
```

**如果返回 404**：
- 申請不存在或 ID 不正確

**如果返回 500**：
- 查看終端機的錯誤訊息
- 可能是資料庫連接或資料格式問題

---

## 步驟 6：檢查伺服器狀態

確認開發伺服器是否正常運行：

1. **檢查終端機**：是否顯示 `Ready` 或 `Local: http://localhost:3000`
2. **檢查端口**：確認使用的是正確的端口（3000 或其他）
3. **重新啟動伺服器**：
   ```powershell
   # 停止伺服器（Ctrl + C）
   # 重新啟動
   npm run dev
   ```

---

## 🔧 常見問題解決方案

### 問題 1：資料庫連接失敗

**錯誤訊息**：`Error: Cannot find module '@prisma/client'` 或資料庫連接錯誤

**解決方法**：
```powershell
# 重新生成 Prisma Client
npx prisma generate

# 推送資料庫 schema
$env:DATABASE_URL="file:./dev.db"
npx prisma db push
```

### 問題 2：申請 ID 不正確

**錯誤訊息**：`申請不存在` 或 404

**解決方法**：
- 從首頁的申請列表進入
- 確認申請確實存在
- 檢查 URL 中的 ID 是否正確

### 問題 3：JSON 解析錯誤

**錯誤訊息**：`Unexpected token` 或 JSON 解析錯誤

**解決方法**：
- 檢查資料庫中的 JSON 欄位格式
- 可能需要重新建立申請

### 問題 4：網路請求失敗

**錯誤訊息**：`Failed to fetch` 或 `Network error`

**解決方法**：
- 確認伺服器正在運行
- 檢查防火牆設定
- 確認使用的是正確的端口

---

## 🚀 快速修復步驟

如果以上步驟都無法解決，嘗試：

1. **重新啟動伺服器**：
   ```powershell
   # 停止伺服器（Ctrl + C）
   npm run dev
   ```

2. **清除瀏覽器快取**：
   - 按 `Ctrl + Shift + R`（硬重新整理）
   - 或使用無痕模式打開

3. **檢查 .env 檔案**：
   - 確認 `DATABASE_URL` 設定正確
   - 確認檔案格式正確（無特殊字符）

4. **重新初始化資料庫**（謹慎使用，會刪除現有資料）：
   ```powershell
   # 刪除資料庫檔案
   Remove-Item dev.db -ErrorAction SilentlyContinue
   
   # 重新建立
   $env:DATABASE_URL="file:./dev.db"
   npx prisma db push
   ```

---

## 📝 取得詳細錯誤資訊

如果問題持續，請收集以下資訊：

1. **終端機的完整錯誤訊息**
2. **瀏覽器控制台的錯誤訊息**（F12 → Console）
3. **API 請求的 Response**（F12 → Network → 找到請求 → 查看 Response）
4. **URL 和申請 ID**

---

## ✅ 驗證修復

修復後，確認：

- [ ] 終端機沒有錯誤訊息
- [ ] 瀏覽器控制台沒有錯誤（F12）
- [ ] API 請求返回 200 狀態碼（F12 → Network）
- [ ] 申請詳情頁正常顯示資料
- [ ] 不再顯示載入中的狀態

---

如果問題仍然存在，請提供終端機和瀏覽器控制台的錯誤訊息，我可以進一步協助排查。
