@echo off
echo Starting Voice Agent Loopback Test...
echo.
echo This will start:
echo 1. WebSocket server on port 8787
echo 2. Next.js dev server on port 3000
echo.
echo Open http://localhost:3000/voice-test in your browser
echo.
echo Press Ctrl+C to stop both servers
echo.

start "WebSocket Server" cmd /k "npm run voice:ws"
timeout /t 2 /nobreak >nul
start "Next.js Dev Server" cmd /k "npm run frontend:dev"

echo Both servers started! Open http://localhost:3000/voice-test
pause
