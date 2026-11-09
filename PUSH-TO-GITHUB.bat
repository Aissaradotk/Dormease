@echo off
chcp 65001 >nul
cd /d C:\Users\LOQ\Desktop\C\dorm-ease

echo ====================================================
echo        Uploading DormEase to GitHub...
echo ====================================================
echo.

git push -u origin main

echo.
echo ====================================================
echo Finished.
echo ====================================================
pause
