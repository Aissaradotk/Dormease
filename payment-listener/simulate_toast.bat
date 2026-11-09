@echo off
chcp 65001 >nul
title DormEase - Windows Notification Simulator
echo.
echo ========================================================
echo   DormEase - Windows Toast Notification Simulator
echo   จำลองการเด้งแจ้งเตือน LINE / Krungthai Connext บน Windows
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0simulate_toast.ps1"
echo.
pause
