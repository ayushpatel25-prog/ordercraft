@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   OrderCraft: Manufacturing OMS - Push to GitHub
echo ========================================================
echo.

set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/ordercraft.git): "

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty.
    pause
    exit /b 1
)

echo.
echo Setting branch to main...
git branch -M main

echo Configuring remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! OrderCraft has been pushed to GitHub.
    echo ========================================================
) else (
    echo.
    echo PUSH FAILED. Please ensure you have permission and check your URL.
)

pause
