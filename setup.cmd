@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto missing
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
pause
exit /b 0
:missing
echo Install Node.js 24 LTS first / Once Node.js 24 LTS kur.
:failed
pause
exit /b 1
