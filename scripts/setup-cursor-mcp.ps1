# Cursor MCP Yapılandırma Scripti
# Bu script .cursor/mcp.json dosyasını oluşturur veya günceller

$projectRoot = $PSScriptRoot | Split-Path -Parent
$cursorDir = Join-Path $projectRoot ".cursor"
$mcpConfigFile = Join-Path $cursorDir "mcp.json"

# .cursor klasörünü oluştur
if (-not (Test-Path $cursorDir)) {
    New-Item -ItemType Directory -Force -Path $cursorDir | Out-Null
    Write-Host ".cursor klasörü oluşturuldu." -ForegroundColor Green
}

# mcp_excalidraw path'ini bul
$mcpExcalidrawPath = Join-Path (Split-Path $projectRoot -Parent) "mcp_excalidraw"
$mcpIndexPath = Join-Path $mcpExcalidrawPath "dist\index.js"

if (-not (Test-Path $mcpIndexPath)) {
    Write-Host "Hata: mcp_excalidraw/dist/index.js bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen önce mcp_excalidraw'ı build edin:" -ForegroundColor Yellow
    Write-Host "  cd $mcpExcalidrawPath" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor Yellow
    Write-Host "  npm run build" -ForegroundColor Yellow
    exit 1
}

# Absolute path'e çevir
$mcpIndexPath = Resolve-Path $mcpIndexPath

# MCP config JSON'u oluştur
$mcpConfig = @{
    mcpServers = @{
        excalidraw = @{
            command = "node"
            args = @($mcpIndexPath)
            env = @{
                EXPRESS_SERVER_URL = "http://localhost:3000"
                ENABLE_CANVAS_SYNC = "true"
            }
        }
    }
} | ConvertTo-Json -Depth 10

# Dosyayı yaz
$mcpConfig | Out-File -FilePath $mcpConfigFile -Encoding UTF8

Write-Host "Cursor MCP yapılandırması oluşturuldu: $mcpConfigFile" -ForegroundColor Green
Write-Host ""
Write-Host "Yapılandırma:" -ForegroundColor Cyan
Write-Host $mcpConfig
Write-Host ""
Write-Host "Cursor IDE'yi yeniden başlatmanız gerekebilir." -ForegroundColor Yellow
