<#
.SYNOPSIS
    OrderCraft Enterprise Manufacturing OMS Launcher
#>

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "      ORDERCRAFT: Enterprise Manufacturing Order Management System      " -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Local Dev Mode (Backend port 8085 + Angular port 4200)" -ForegroundColor Yellow
Write-Host "[2] Docker Compose Mode (Full stack: MySQL + Redis + MinIO + Backend + UI)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter choice [1 or 2] (Default is 1)"
if (-not $choice) { $choice = "1" }

if ($choice -eq "2") {
    Write-Host "`nStarting Docker Compose environment..." -ForegroundColor Cyan
    docker compose up --build -d
    Write-Host "`nContainers online:" -ForegroundColor Green
    Write-Host " - Frontend Web Portal: http://localhost:4200"
    Write-Host " - Backend REST API / Swagger: http://localhost:8085/swagger-ui.html"
    Write-Host " - MinIO S3 Console: http://localhost:9001"
} else {
    Write-Host "`nStarting Local Services..." -ForegroundColor Cyan
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; mvn spring-boot:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm start"
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:4200"
    Write-Host "`nOrderCraft launched successfully at http://localhost:4200" -ForegroundColor Green
}
