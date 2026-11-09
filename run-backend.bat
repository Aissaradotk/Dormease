@echo off
title DormEase Backend Service (Port 3007)
chcp 65001 >nul
echo ====================================================
echo   DormEase + CPU SHOP Unified Backend Service
echo   Port 3007 on 119.59.102.161
echo ====================================================
echo.
echo กำลังเชื่อมต่อไปยังเซิร์ฟเวอร์มหาวิทยาลัย...
echo (กรุณาเปิดหน้าต่างนี้ทิ้งไว้ขณะใช้งานเว็บ DormEase)
echo.
python run_remote_backend.py
pause
