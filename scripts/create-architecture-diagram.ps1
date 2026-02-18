# Mimari Diagram Oluşturma Scripti
# REST API üzerinden Excalidraw'a proje mimari diagramını çizer

$baseUrl = "http://localhost:3000/api/elements"
$headers = @{ "Content-Type" = "application/json" }

# REST API expects fontFamily as string (server-side schema validation)
$fontFamily = "1"

# Clear canvas
Write-Host "Clearing canvas..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/elements/clear" -Method DELETE -ErrorAction SilentlyContinue
} catch {
    Write-Host "Canvas already clear" -ForegroundColor Gray
}

# 0. Title
Write-Host "Adding title..." -ForegroundColor Green
$title = @{
    type = "text"
    x = 260
    y = 10
    text = "SOCI4L - System Architecture"
    fontSize = 24
    fontFamily = "1"
    strokeColor = "#111827"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $title -Headers $headers | Out-Null

# Element ID'leri
$elementIds = @{
    Frontend = "frontend-layer"
    PublicPages = "public-pages"
    Dashboard = "dashboard-pages"
    APILayer = "api-layer"
    DataLayer = "data-layer"
    Database = "database"
    Blockchain = "blockchain"
    ExternalAPIs = "external-apis"
}

# 1. Frontend Layer
Write-Host "Frontend Layer oluşturuluyor..." -ForegroundColor Green
$frontend = @{
    id = $elementIds.Frontend
    type = "rectangle"
    x = 100
    y = 50
    width = 300
    height = 120
    backgroundColor = "#3b82f6"
    strokeColor = "#1e40af"
    strokeWidth = 3
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $frontend -Headers $headers | Out-Null

# Frontend Layer Text
$frontendText = @{
    type = "text"
    x = 120
    y = 70
    text = "Frontend Layer`nNext.js 14 (App Router)`nReact + TypeScript UI`nTailwind CSS + shadcn/ui components"
    fontSize = 14
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $frontendText -Headers $headers | Out-Null

# 2. Public Pages
$publicPages = @{
    id = $elementIds.PublicPages
    type = "rectangle"
    x = 450
    y = 50
    width = 200
    height = 120
    backgroundColor = "#10b981"
    strokeColor = "#059669"
    strokeWidth = 2
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $publicPages -Headers $headers | Out-Null

# Public Pages Text
$publicPagesText = @{
    type = "text"
    x = 460
    y = 70
    text = "Public / Marketing Layer`n/  -> Wallet search & entry`n/p/[id] -> Public profile pages`n/r/[linkId]/track -> Click tracking"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $publicPagesText -Headers $headers | Out-Null

# 3. Dashboard Pages
$dashboard = @{
    id = $elementIds.Dashboard
    type = "rectangle"
    x = 700
    y = 50
    width = 200
    height = 120
    backgroundColor = "#10b981"
    strokeColor = "#059669"
    strokeWidth = 2
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $dashboard -Headers $headers | Out-Null

# Dashboard Pages Text
$dashboardText = @{
    type = "text"
    x = 710
    y = 70
    text = "Dashboard / Studio / Account`n/dashboard/[address]`nOverview, Assets, Activity, Social`nProfile editing & settings"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $dashboardText -Headers $headers | Out-Null

# 4. API Layer
$apiLayer = @{
    id = $elementIds.APILayer
    type = "rectangle"
    x = 100
    y = 250
    width = 400
    height = 150
    backgroundColor = "#8b5cf6"
    strokeColor = "#7c3aed"
    strokeWidth = 3
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $apiLayer -Headers $headers | Out-Null

# API Layer Text
$apiLayerText = @{
    type = "text"
    x = 120
    y = 270
    text = "API Layer - Next.js API Routes`n/api/wallet  -> Wallet + chain data`n/api/profile -> Profile CRUD`n/api/claim  -> Claim + signature verification`n/api/dashboard -> Dashboard data`n/api/auth -> Nonce + verify"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $apiLayerText -Headers $headers | Out-Null

# 5. Data Layer
$dataLayer = @{
    id = $elementIds.DataLayer
    type = "rectangle"
    x = 550
    y = 250
    width = 200
    height = 150
    backgroundColor = "#10b981"
    strokeColor = "#059669"
    strokeWidth = 3
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $dataLayer -Headers $headers | Out-Null

# Data Layer Text
$dataLayerText = @{
    type = "text"
    x = 560
    y = 270
    text = "Data Layer`nPrisma ORM`nType-safe queries`nCache/optimization layer"
    fontSize = 13
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $dataLayerText -Headers $headers | Out-Null

# 6. Database
$database = @{
    id = $elementIds.Database
    type = "rectangle"
    x = 800
    y = 250
    width = 200
    height = 150
    backgroundColor = "#8b5cf6"
    strokeColor = "#7c3aed"
    strokeWidth = 3
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $database -Headers $headers | Out-Null

# Database Text
$databaseText = @{
    type = "text"
    x = 810
    y = 270
    text = "Database`nPostgreSQL (prod) / SQLite (dev)`nProfile, Follow, Link`nScoreSnapshot, AnalyticsEvent`nBillingInteraction"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $databaseText -Headers $headers | Out-Null

# 7. Blockchain Layer
$blockchain = @{
    id = $elementIds.Blockchain
    type = "rectangle"
    x = 100
    y = 450
    width = 300
    height = 120
    backgroundColor = "#f59e0b"
    strokeColor = "#d97706"
    strokeWidth = 3
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $blockchain -Headers $headers | Out-Null

# Blockchain Layer Text
$blockchainText = @{
    type = "text"
    x = 110
    y = 470
    text = "Blockchain Layer`nAvalanche C-Chain (43114)`nwagmi + viem RPC client`nWalletConnect, MetaMask, injected wallets"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $blockchainText -Headers $headers | Out-Null

# 8. External APIs
$externalAPIs = @{
    id = $elementIds.ExternalAPIs
    type = "rectangle"
    x = 450
    y = 450
    width = 350
    height = 120
    backgroundColor = "#ef4444"
    strokeColor = "#dc2626"
    strokeWidth = 2
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $externalAPIs -Headers $headers | Out-Null

# External APIs Text
$externalAPIsText = @{
    type = "text"
    x = 460
    y = 470
    text = "External Services`nSnowtrace -> Transaction history`nOpenSea -> NFT metadata + images`nCoinGecko -> Price data`nAvalanche RPC -> Blockchain data"
    fontSize = 12
    fontFamily = $fontFamily
    strokeColor = "#ffffff"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $externalAPIsText -Headers $headers | Out-Null

# Create connections (arrows) - More organized and professional
Write-Host "Creating connections..." -ForegroundColor Green

# Frontend -> Public Pages (yatay, düzgün)
$arrow1 = @{
    type = "arrow"
    x = 400
    y = 110
    points = @(@(0, 0), @(50, 0))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.Frontend }
    end = @{ id = $elementIds.PublicPages }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow1 -Headers $headers | Out-Null

# Frontend -> Dashboard (yatay, düzgün)
$arrow2 = @{
    type = "arrow"
    x = 400
    y = 110
    points = @(@(0, 0), @(300, 0))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.Frontend }
    end = @{ id = $elementIds.Dashboard }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow2 -Headers $headers | Out-Null

# Public Pages -> API Layer (aşağı, merkezden)
$arrow3 = @{
    type = "arrow"
    x = 550
    y = 170
    points = @(@(0, 0), @(-100, 80))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.PublicPages }
    end = @{ id = $elementIds.APILayer }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow3 -Headers $headers | Out-Null

# Dashboard -> API Layer (aşağı, merkezden)
$arrow4 = @{
    type = "arrow"
    x = 800
    y = 170
    points = @(@(0, 0), @(-200, 80))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.Dashboard }
    end = @{ id = $elementIds.APILayer }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow4 -Headers $headers | Out-Null

# API Layer -> Data Layer (sağa, yatay)
$arrow5 = @{
    type = "arrow"
    x = 500
    y = 325
    points = @(@(0, 0), @(50, 0))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.APILayer }
    end = @{ id = $elementIds.DataLayer }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow5 -Headers $headers | Out-Null

# Data Layer -> Database (sağa, yatay)
$arrow6 = @{
    type = "arrow"
    x = 750
    y = 325
    points = @(@(0, 0), @(50, 0))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.DataLayer }
    end = @{ id = $elementIds.Database }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow6 -Headers $headers | Out-Null

# API Layer -> Blockchain Layer (aşağı, dikey)
$arrow7 = @{
    type = "arrow"
    x = 250
    y = 400
    points = @(@(0, 0), @(-150, 50))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.APILayer }
    end = @{ id = $elementIds.Blockchain }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow7 -Headers $headers | Out-Null

# API Layer -> External APIs (aşağı sağa, diagonal)
$arrow8 = @{
    type = "arrow"
    x = 450
    y = 400
    points = @(@(0, 0), @(0, 50))
    strokeColor = "#374151"
    strokeWidth = 2
    startArrowhead = $null
    endArrowhead = "arrow"
    start = @{ id = $elementIds.APILayer }
    end = @{ id = $elementIds.ExternalAPIs }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow8 -Headers $headers | Out-Null

Write-Host "Diagram ready: Layers + descriptions drawn." -ForegroundColor Green
Write-Host "View canvas at: http://localhost:3000" -ForegroundColor Cyan
