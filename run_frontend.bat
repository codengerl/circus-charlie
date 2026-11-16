@echo off
cd /d "%~dp0"
call npm run dev -- --port 5020 --host 127.0.0.1
