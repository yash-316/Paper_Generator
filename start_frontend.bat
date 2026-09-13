@echo off
title ExamPortal Frontend
cd /d "%~dp0exam-system\frontend"
echo Starting ExamPortal Frontend on http://localhost:5173...
npm run dev -- --host 127.0.0.1
pause
