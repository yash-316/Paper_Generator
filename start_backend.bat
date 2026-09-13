@echo off
title ExamPortal Backend
cd /d "%~dp0exam-system\backend"
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
echo Starting ExamPortal Backend on http://localhost:8000...
venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
pause
