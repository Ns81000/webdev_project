@echo off
setlocal enabledelayedexpansion

if /I "%1"=="stop" goto stop

cd /d "%~dp0"

taskkill /F /IM bun.exe >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *http.server*" >nul 2>&1

cd backend
if not exist node_modules (
    start /B /MIN cmd /c "bun install && bun run dev" >nul 2>&1
) else (
    start /B /MIN cmd /c "bun run dev" >nul 2>&1
)
cd ..

timeout /t 2 /nobreak >nul

cd frontend
start /B /MIN cmd /c "python -m http.server 8080" >nul 2>&1
cd ..

timeout /t 1 /nobreak >nul

start http://localhost:8080

exit

:stop
taskkill /F /IM bun.exe >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *http.server*" >nul 2>&1
echo Servers stopped.
timeout /t 2 /nobreak >nul
exit
