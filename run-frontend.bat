@echo off
title DormEase Frontend UI (Port 5173)
chcp 65001 >nul
echo ====================================================
echo   DormEase Frontend UI (Vite)
echo   http://localhost:5173
echo ====================================================
echo.
cd frontend
npm run dev
pause
