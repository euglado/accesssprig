@echo off
cd /d "%~dp0"
call npm run register
if errorlevel 1 goto failed
pause
exit /b 0
:failed
pause
exit /b 1
