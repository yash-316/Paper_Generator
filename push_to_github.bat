@echo off
title Push to GitHub - Paper_Generator
cd /d "%~dp0"
echo =======================================================
echo Pushing project to https://github.com/yash-316/Paper_Generator
echo =======================================================
echo.
echo If your repository belongs to a different GitHub account (e.g. yash-316),
echo generate a Personal Access Token with "repo" scope at:
echo https://github.com/settings/tokens
echo.
set /p TOKEN="Enter your GitHub Personal Access Token (or press Enter if already invited): "
if "%TOKEN%"=="" (
    git push -u origin main --force
) else (
    git push -u https://%TOKEN%@github.com/yash-316/Paper_Generator.git main --force
)
pause
