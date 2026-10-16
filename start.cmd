@echo off
cd /d "%~dp0"
call npm start
set "accesssprig_exit=%errorlevel%"
pause
exit /b %accesssprig_exit%
