@echo off
start "ExamPortal Backend" cmd /c "%~dp0start_backend.bat"
start "ExamPortal Frontend" cmd /c "%~dp0start_frontend.bat"
echo ExamPortal is launching in separate windows!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000/docs
timeout /t 5
