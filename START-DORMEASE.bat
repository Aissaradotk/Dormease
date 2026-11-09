@echo off
title DormEase Master Launcher
chcp 65001 >nul
echo ====================================================
echo         DormEase Dormitory Management System
echo ====================================================
echo.
echo [1/3] กำลังเปิด Backend Server (พอร์ต 3007)...
start "DormEase Backend" cmd /k "run-backend.bat"

echo [2/3] รอเชื่อมต่อไปยังเซิร์ฟเวอร์ (5 วินาที)...
timeout /t 5 /nobreak >nul

echo [3/3] กำลังเปิด Frontend Dev Server (พอร์ต 5173)...
start "DormEase Frontend" cmd /k "run-frontend.bat"

echo.
echo ====================================================
echo   เปิดระบบทั้งหมดเรียบร้อย! กำลังเปิดเบราว์เซอร์...
echo ====================================================
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo หมายเหตุ: กรุณาอย่าปิดหน้าต่างสีดำ (Command Prompt) ทั้ง 2 หน้าต่างขณะใช้งานเว็บ
echo หากต้องการปิดระบบ ให้ปิดหน้าต่าง Command Prompt ทั้งสองหน้าต่าง
echo.
pause
