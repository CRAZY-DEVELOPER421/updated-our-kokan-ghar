@echo off
REM ============================================================
REM  Konkan Bazaar - STOP ALL SERVICES
REM  Kills backend, storefront, admin, gateway and ngrok.
REM ============================================================
echo Stopping Konkan Bazaar services...

for %%p in (8080 5000 3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%%p .*LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)
taskkill /IM ngrok.exe /F >nul 2>&1

echo Done. All services stopped.
pause
