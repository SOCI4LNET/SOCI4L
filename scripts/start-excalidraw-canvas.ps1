# Excalidraw Canvas Server Başlatma Scripti
# Bu script canvas server'ı başlatır

$mcpExcalidrawPath = Join-Path $PSScriptRoot "..\..\mcp_excalidraw"

if (-not (Test-Path $mcpExcalidrawPath)) {
    Write-Host "Hata: mcp_excalidraw klasörü bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen önce mcp_excalidraw'ı klonlayın:" -ForegroundColor Yellow
    Write-Host "  cd .." -ForegroundColor Yellow
    Write-Host "  git clone https://github.com/yctimlin/mcp_excalidraw.git" -ForegroundColor Yellow
    exit 1
}

$distPath = Join-Path $mcpExcalidrawPath "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "Hata: mcp_excalidraw build edilmemiş!" -ForegroundColor Red
    Write-Host "Lütfen önce build edin:" -ForegroundColor Yellow
    Write-Host "  cd $mcpExcalidrawPath" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor Yellow
    Write-Host "  npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "Excalidraw Canvas Server başlatılıyor..." -ForegroundColor Green
Write-Host "Canvas: http://localhost:3000" -ForegroundColor Cyan

Set-Location $mcpExcalidrawPath
$env:HOST = "0.0.0.0"
$env:PORT = "3000"
npm run canvas
