# Detailed Signature Usage Diagram
# Shows each page/component, signature type, and target function/endpoint

$baseUrl = "http://localhost:3000/api/elements"
$headers = @{ "Content-Type" = "application/json" }
$fontFamily = "1"

Write-Host "Creating detailed signature usage diagram..." -ForegroundColor Green

# Clear canvas
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/elements/clear" -Method DELETE -ErrorAction SilentlyContinue
} catch {
    Write-Host "Canvas cleared or already empty." -ForegroundColor Gray
}

# Title
$title = @{
    type = "text"
    x = 300
    y = 10
    text = "SOCI4L - Detailed Signature Usage Diagram"
    fontSize = 28
    fontFamily = $fontFamily
    strokeColor = "#111827"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $title -Headers $headers | Out-Null

# Starting positions
$startX = 50
$startY = 80
$boxWidth = 220
$boxHeight = 90
$spacingY = 150
$cardWidth = 200
$cardHeight = 65
$arrowGap = 40
$cardGap = 25

# Element IDs storage
$elementIds = @{}

# Helper function to create a page box
function Create-PageBox {
    param($id, $x, $y, $text, $color)
    $box = @{
        id = $id
        type = "rectangle"
        x = $x
        y = $y
        width = $boxWidth
        height = $boxHeight
        backgroundColor = $color
        strokeColor = "#1e40af"
        strokeWidth = 2
    } | ConvertTo-Json -Depth 10
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $box -Headers $headers
    $elementIds[$id] = $response.element.id
    
    $textEl = @{
        type = "text"
        x = $x + 15
        y = $y + 30
        text = $text
        fontSize = 12
        fontFamily = $fontFamily
        strokeColor = "#ffffff"
    } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri $baseUrl -Method POST -Body $textEl -Headers $headers | Out-Null
}

# Helper function to create a function card
function Create-FunctionCard {
    param($id, $x, $y, $functionName, $endpoint, $sigType)
    $cardColor = if ($sigType -eq "on-chain") { "#f59e0b" } else { "#10b981" }
    $card = @{
        id = $id
        type = "rectangle"
        x = $x
        y = $y
        width = $cardWidth
        height = $cardHeight
        backgroundColor = $cardColor
        strokeColor = if ($sigType -eq "on-chain") { "#d97706" } else { "#059669" }
        strokeWidth = 2
    } | ConvertTo-Json -Depth 10
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $card -Headers $headers
    $elementIds[$id] = $response.element.id
    
    $cardText = @{
        type = "text"
        x = $x + 12
        y = $y + 18
        text = "$functionName`n$endpoint"
        fontSize = 10
        fontFamily = $fontFamily
        strokeColor = "#ffffff"
    } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri $baseUrl -Method POST -Body $cardText -Headers $headers | Out-Null
}

# Helper function to create an arrow with label
function Create-Arrow {
    param($fromId, $toId, $label, $sigType, $x, $y, $points)
    $arrowColor = if ($sigType -eq "on-chain") { "#f59e0b" } else { "#3b82f6" }
    $arrow = @{
        type = "arrow"
        x = $x
        y = $y
        points = $points
        strokeColor = $arrowColor
        strokeWidth = 2
        startArrowhead = $null
        endArrowhead = "arrow"
        text = $label
        fontSize = 10
        fontFamily = $fontFamily
        start = @{ id = $elementIds[$fromId] }
        end = @{ id = $elementIds[$toId] }
    } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri $baseUrl -Method POST -Body $arrow -Headers $headers | Out-Null
}

# 1. Builder Panel
$builderY = $startY
Create-PageBox "builder-panel" $startX $builderY "Builder Panel`n/dashboard/[address]" "#3b82f6"

$builderCardX = $startX + $boxWidth + $arrowGap
$builderCardY1 = $builderY - 5
$builderCardY2 = $builderY + ($boxHeight / 2) - ($cardHeight / 2)
$builderCardY3 = $builderY + $boxHeight - $cardHeight + 5

Create-FunctionCard "builder-updateLayout" $builderCardX $builderCardY1 "updateLayout" "/api/profile/layout" "off-chain"
Create-FunctionCard "builder-updateAppearance" $builderCardX $builderCardY2 "updateAppearance" "/api/profile/appearance" "off-chain"
Create-FunctionCard "builder-updateProfile" $builderCardX $builderCardY3 "updateProfile" "/api/profile/update" "off-chain"

Create-Arrow "builder-panel" "builder-updateLayout" "Off-chain" "off-chain" ($startX + $boxWidth) ($builderY + 15) @(@(0, -20), @($arrowGap, -20))
Create-Arrow "builder-panel" "builder-updateAppearance" "Off-chain" "off-chain" ($startX + $boxWidth) ($builderY + 45) @(@(0, 0), @($arrowGap, 0))
Create-Arrow "builder-panel" "builder-updateProfile" "Off-chain" "off-chain" ($startX + $boxWidth) ($builderY + 75) @(@(0, 20), @($arrowGap, 20))

# 2. Links Panel
$linksY = $startY + $spacingY
Create-PageBox "links-panel" $startX $linksY "Links Panel`n/dashboard/[address]/links" "#3b82f6"

$linksCardX = $startX + $boxWidth + $arrowGap
$linksCardY1 = $linksY - 5
$linksCardY2 = $linksY + ($boxHeight / 2) - ($cardHeight / 2)
$linksCardY3 = $linksY + $boxHeight - $cardHeight + 5
$linksCardX2 = $linksCardX + $cardWidth + $cardGap

Create-FunctionCard "links-addLink" $linksCardX $linksCardY1 "addLink" "/api/profile/links" "off-chain"
Create-FunctionCard "links-updateLink" $linksCardX $linksCardY2 "updateLink" "/api/profile/links" "off-chain"
Create-FunctionCard "links-deleteLink" $linksCardX $linksCardY3 "deleteLink" "/api/profile/links" "off-chain"
Create-FunctionCard "links-updateSocial" $linksCardX2 $linksCardY2 "updateSocialLinks" "/api/profile/social" "off-chain"

Create-Arrow "links-panel" "links-addLink" "Off-chain" "off-chain" ($startX + $boxWidth) ($linksY + 15) @(@(0, -20), @($arrowGap, -20))
Create-Arrow "links-panel" "links-updateLink" "Off-chain" "off-chain" ($startX + $boxWidth) ($linksY + 45) @(@(0, 0), @($arrowGap, 0))
Create-Arrow "links-panel" "links-deleteLink" "Off-chain" "off-chain" ($startX + $boxWidth) ($linksY + 75) @(@(0, 20), @($arrowGap, 20))
Create-Arrow "links-panel" "links-updateSocial" "Off-chain" "off-chain" ($startX + $boxWidth) ($linksY + 45) @(@(0, 0), @($arrowGap + $cardWidth + $cardGap, 0))

# 3. Settings Panel
$settingsY = $startY + ($spacingY * 2)
Create-PageBox "settings-panel" $startX $settingsY "Settings Panel`n/dashboard/[address]/settings" "#3b82f6"

$settingsCardX = $startX + $boxWidth + $arrowGap
$settingsCardY1 = $settingsY - 5
$settingsCardY2 = $settingsY + ($boxHeight / 2) - ($cardHeight / 2)
$settingsCardY3 = $settingsY + $boxHeight - $cardHeight + 5

Create-FunctionCard "settings-visibility" $settingsCardX $settingsCardY1 "updateVisibility" "/api/profile/visibility" "off-chain"
Create-FunctionCard "settings-categories" $settingsCardX $settingsCardY2 "updateCategories" "/api/profile/categories" "off-chain"
Create-FunctionCard "settings-appearance" $settingsCardX $settingsCardY3 "updateAppearance" "/api/profile/appearance" "off-chain"

Create-Arrow "settings-panel" "settings-visibility" "Off-chain" "off-chain" ($startX + $boxWidth) ($settingsY + 15) @(@(0, -20), @($arrowGap, -20))
Create-Arrow "settings-panel" "settings-categories" "Off-chain" "off-chain" ($startX + $boxWidth) ($settingsY + 45) @(@(0, 0), @($arrowGap, 0))
Create-Arrow "settings-panel" "settings-appearance" "Off-chain" "off-chain" ($startX + $boxWidth) ($settingsY + 75) @(@(0, 20), @($arrowGap, 20))

# 4. Claim Profile Button
$claimY = $startY + ($spacingY * 3)
Create-PageBox "claim-button" $startX $claimY "Claim Profile Button`nPublic Pages" "#10b981"

$claimCardX = $startX + $boxWidth + $arrowGap
$claimCardY = $claimY + ($boxHeight / 2) - ($cardHeight / 2)
Create-FunctionCard "claim-profile" $claimCardX $claimCardY "claimProfile" "/api/profile/claim" "off-chain"

Create-Arrow "claim-button" "claim-profile" "Off-chain" "off-chain" ($startX + $boxWidth) ($claimY + 45) @(@(0, 0), @($arrowGap, 0))

# 5. Slug Manager
$slugY = $startY + ($spacingY * 4)
Create-PageBox "slug-manager" $startX $slugY "Slug Manager`n/dashboard/[address]" "#3b82f6"

$slugCardX = $startX + $boxWidth + $arrowGap
$slugCardY = $slugY + ($boxHeight / 2) - ($cardHeight / 2)
$slugCardX2 = $slugCardX + $cardWidth + $cardGap

Create-FunctionCard "slug-sync" $slugCardX $slugCardY "syncSlug" "/api/slug/sync" "off-chain"
Create-FunctionCard "slug-register" $slugCardX2 $slugCardY "registerSlug" "CustomSlugRegistry" "on-chain"

Create-Arrow "slug-manager" "slug-sync" "Off-chain" "off-chain" ($startX + $boxWidth) ($slugY + 45) @(@(0, 0), @($arrowGap, 0))
Create-Arrow "slug-manager" "slug-register" "On-chain" "on-chain" ($startX + $boxWidth) ($slugY + 45) @(@(0, 0), @($arrowGap + $cardWidth + $cardGap, 0))

# 6. Follow Toggle
$followY = $startY + ($spacingY * 5)
Create-PageBox "follow-toggle" $startX $followY "Follow Toggle`nPublic Profile Page" "#10b981"

$followCardX = $startX + $boxWidth + $arrowGap
$followCardY = $followY + ($boxHeight / 2) - ($cardHeight / 2)
Create-FunctionCard "follow-auth" $followCardX $followCardY "authenticate" "/api/auth/verify" "off-chain"

Create-Arrow "follow-toggle" "follow-auth" "Off-chain" "off-chain" ($startX + $boxWidth) ($followY + 45) @(@(0, 0), @($arrowGap, 0))

# 7. Social Link Page
$socialY = $startY + ($spacingY * 6)
Create-PageBox "social-link-page" $startX $socialY "Social Link Page`n/dashboard/[address]/links/[linkId]" "#3b82f6"

$socialCardX = $startX + $boxWidth + $arrowGap
$socialCardY = $socialY + ($boxHeight / 2) - ($cardHeight / 2)
Create-FunctionCard "social-linkAccount" $socialCardX $socialCardY "linkSocialAccount" "/api/social/link" "off-chain"

Create-Arrow "social-link-page" "social-linkAccount" "Off-chain" "off-chain" ($startX + $boxWidth) ($socialY + 45) @(@(0, 0), @($arrowGap, 0))

# Legend - positioned to the right
$legendX = $startX + $boxWidth + ($arrowGap * 2) + ($cardWidth * 2) + ($cardGap * 2) + 50
$legendY = $startY

$legendBox = @{
    type = "rectangle"
    x = $legendX
    y = $legendY
    width = 280
    height = 220
    backgroundColor = "#f3f4f6"
    strokeColor = "#6b7280"
    strokeWidth = 2
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $legendBox -Headers $headers | Out-Null

$legendTitle = @{
    type = "text"
    x = $legendX + 15
    y = $legendY + 20
    text = "Legend"
    fontSize = 18
    fontFamily = $fontFamily
    strokeColor = "#111827"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $legendTitle -Headers $headers | Out-Null

$legendText = @{
    type = "text"
    x = $legendX + 15
    y = $legendY + 50
    text = "Blue Boxes: Frontend Pages/Components`n`nGreen Cards: Off-chain Signatures`n(viem verifyMessage)`n`nOrange Cards: On-chain Signatures`n(Smart Contract Transactions)`n`nArrows: Signature Flow"
    fontSize = 11
    fontFamily = $fontFamily
    strokeColor = "#374151"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -Body $legendText -Headers $headers | Out-Null

Write-Host "Detailed signature diagram created!" -ForegroundColor Green
Write-Host "View canvas at: http://localhost:3000" -ForegroundColor Cyan
