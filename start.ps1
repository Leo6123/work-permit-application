# 启动脚本 - 施工安全作業許可申請系統

Write-Host "正在啟動開發伺服器..." -ForegroundColor Cyan

# 設定環境變數
$env:DATABASE_URL = "file:./dev.db"
$env:NODE_ENV = "development"

# 檢查資料庫檔案是否存在，如果不存在則建立
if (-not (Test-Path "dev.db")) {
    Write-Host "資料庫檔案不存在，將在首次啟動時自動建立..." -ForegroundColor Yellow
}

# 啟動開發伺服器
Write-Host "啟動 Next.js 開發伺服器..." -ForegroundColor Green
Write-Host "請稍候，伺服器啟動後會顯示本地 URL" -ForegroundColor Yellow
Write-Host ""

npm run dev
