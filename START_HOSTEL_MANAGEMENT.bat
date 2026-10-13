@echo off
title Hostel Management System Launcher
color 0B

echo ===================================================================
echo             HOSTEL MANAGEMENT SYSTEM - 1-CLICK LAUNCHER
echo ===================================================================
echo.
echo [1/3] Checking environment...
cd /d "%~dp0"

echo [2/3] Starting Backend API Server (Port 5000)...
start "Hostel Backend API" cmd /k "cd /d "%~dp0server" && npm.cmd run dev"

echo [3/3] Starting Frontend React UI (Port 5173)...
start "Hostel Frontend UI" cmd /k "cd /d "%~dp0client" && npm.cmd run dev -- --host"

timeout /t 3 /nobreak >nul

echo.
echo Opening Web Application in your default browser...
start http://localhost:5173

echo.
echo ===================================================================
echo   System is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api
echo   Health:   http://localhost:5000/api/health
echo ===================================================================
echo.
echo Keep this window open or minimize it. Press any key to close launcher.
pause >nul
