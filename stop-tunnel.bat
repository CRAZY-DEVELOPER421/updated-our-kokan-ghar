@echo off
REM Stops backend (:5000), storefront (:3000), admin (:3001),
REM gateway (:8080) and the ngrok agent - by port / process name.
echo Stopping Konkan Bazaar services...
for %%p in (8080 5000 3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%%p .*LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)
taskkill /IM ngrok.exe /F >nul 2>&1
echo Done. Sab services band ho gaye.
pause
