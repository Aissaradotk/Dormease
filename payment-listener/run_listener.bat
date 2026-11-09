@echo off
chcp 65001 >nul
title DormEase - Windows Payment Notification Listener
echo Starting DormEase Windows Payment Notification Listener...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0payment_listener.ps1"
pause
