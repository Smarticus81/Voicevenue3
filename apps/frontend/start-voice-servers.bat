@echo off
echo Starting voice application servers...
echo.
echo Starting Next.js development server...
start "Next.js Dev Server" cmd /k "npm run dev"
echo.
echo Starting WebSocket server...
start "WebSocket Server" cmd /k "npm run dev:voice"
echo.
echo Both servers are starting...
echo Next.js will be available at: http://localhost:3000
echo WebSocket server will be available at: ws://localhost:8787
echo.
pause
