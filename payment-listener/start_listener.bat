@echo off
chcp 65001 > nul
title DormEase LINE Payment Listener
cd /d "%~dp0"

echo ========================================================
echo   DormEase - LINE Desktop & Multi-Bank Payment Listener
echo ========================================================
echo กำลังเริ่มต้นระบบตรวจจับ LINE Desktop และทุกแอปธนาคาร...

:: ปิดโปรแกรมเดิมที่อาจเปิดค้างอยู่
taskkill /F /FI "WINDOWTITLE eq *DormEase*" >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*LinePaymentListener.pyw*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

:: เปิดโปรแกรมตรวจจับแบบไม่มีหน้าต่างจอดำ
start "" pythonw "%~dp0LinePaymentListener.pyw"

echo [OK] โปรแกรมเริ่มทำงานเรียบร้อยแล้วใน System Tray ข้างนาฬิกา!
echo - ตรวจจับหน้าต่างป๊อปอัปสีขาวของ LINE Desktop อัตโนมัติ
echo - รองรับ Krungthai Connext, SCB Connect, KBank Live, BBL, ttb, BAY, GSB, PromptPay
echo - ดับเบิลคลิกที่ไอคอนโล่สีเขียวข้างนาฬิกาเพื่อเปิดดูหน้าจอควบคุม
timeout /t 3 > nul
exit
