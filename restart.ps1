# 重启开发服务器脚本

Write-Host "正在停止所有 Node.js 进程..." -ForegroundColor Yellow

# 停止所有 node 进程（谨慎使用，会停止所有 node 进程）
# Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 或者只停止占用 3000-3010 端口的进程
$ports = 3000..3010
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "停止占用端口 $port 的进程 (PID: $process)..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "等待 2 秒..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host "`n正在启动开发服务器..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

# 设置环境变量
$env:DATABASE_URL = "file:./dev.db"

# 启动开发服务器
npm run dev
