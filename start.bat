@echo off
echo ============================================
echo  AI Candidate Preparation Platform
echo ============================================
echo.

REM Start Backend
echo [1/2] Starting FastAPI backend on port 8000...
start cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt && copy .env.example .env && uvicorn main:app --reload --port 8000"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Next.js frontend on port 3000...
start cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
pause
