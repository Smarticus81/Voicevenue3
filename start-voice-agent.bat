@echo off
title Voice Agent - Starting...
echo.
echo  ████████████████████████████████████████
echo  █                                      █
echo  █    VOICE AGENT STARTING...          █
echo  █                                      █
echo  █    Next.js: http://localhost:3000    █
echo  █    OpenAI Realtime: Ready            █
echo  █                                      █
echo  █    Press Ctrl+C to stop              █
echo  █                                      █
echo  ████████████████████████████████████████
echo.

cd /d "%~dp0"
npm run -w apps/frontend dev
