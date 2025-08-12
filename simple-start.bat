@echo off
echo Starting VenueVoice servers...
echo.

echo [1/4] Cleaning up...
taskkill /F /IM node.exe 2>nul || echo No processes to kill

echo [2/4] Cleaning build cache...
cd apps\frontend
if exist ".next" rmdir /s /q ".next"

echo [3/4] Starting Voice Server...
start "Voice Server" cmd /k "npm run dev:voice"

echo [4/4] Starting Next.js Server...
timeout /t 3 /nobreak >nul
start "Next.js Server" cmd /k "npm run dev"

echo.
echo ✓ Voice Server: ws://localhost:8787
echo ✓ Next.js Server: http://localhost:3000
echo.
echo Two terminal windows should have opened.
echo Go to: http://localhost:3000
pause
