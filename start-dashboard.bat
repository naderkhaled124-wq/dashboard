@echo off
title Interactive Dashboard
echo ========================================
echo   جاري تشغيل لوحة البيانات...
echo ========================================
echo.
cd /d "%~dp0"
start "" "http://localhost:3000"
node server.js
pause
