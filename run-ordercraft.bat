@echo off
TITLE OrderCraft - Manufacturing Order Management System
echo =========================================================================
echo       ORDERCRAFT: Enterprise Manufacturing Order Management System
echo =========================================================================
echo.
echo Select Run Mode:
echo [1] Local Dev Mode (Backend on Port 8085 + Angular on Port 4200)
echo [2] Docker Compose Mode (Full stack: MySQL + Redis + MinIO + Backend + Frontend)
echo.
set /p mode="Enter choice [1 or 2]: "

if "%mode%"=="2" (
    echo.
    echo Launching Docker Compose stack...
    docker compose up --build -d
    echo.
    echo System started:
    echo  - Frontend Web UI:  http://localhost:4200
    echo  - Backend API docs: http://localhost:8085/swagger-ui.html
    echo  - MinIO Console:    http://localhost:9001
    pause
    exit /b 0
)

echo.
echo Starting Local Dev Mode...
echo 1. Starting Backend on port 8085 (Spring Boot Dev/H2 profile)...
start "OrderCraft Backend (Port 8085)" cmd /k "cd backend && mvn spring-boot:run"

echo 2. Starting Frontend on port 4200 (Angular)...
start "OrderCraft Frontend (Port 4200)" cmd /k "cd frontend && npm start"

echo.
echo Opening browser to http://localhost:4200 in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:4200

echo.
echo OrderCraft is running!
echo Frontend: http://localhost:4200
echo Backend:  http://localhost:8085
pause
