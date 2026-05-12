@echo off
echo ==========================================
echo STOPPING EXISTING BACKEND SERVER...
echo ==========================================
taskkill /F /IM node.exe
echo.
echo ==========================================
echo STARTING BACKEND SERVER WITH NEW FIXES...
echo ==========================================
npm run dev
pause
