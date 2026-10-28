@echo off
echo ============================================================
echo   Predictive Maintenance Portal - Full Stack Launcher
echo   Backend: Node.js (Port 5000)
echo   ML Service: Python FastAPI (Port 8000)
echo ============================================================
echo.

start "FastAPI ML Microservice (Port 8000)" cmd /k "python ml_service\server.py"
timeout /t 3 /nobreak > nul

start "Express Backend API (Port 5000)" cmd /k "npm run dev"
echo Both services launched in separate windows.
