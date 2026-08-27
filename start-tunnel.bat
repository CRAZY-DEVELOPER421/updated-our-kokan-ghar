@echo off
REM ============================================================
REM  Konkan Bazaar - ONE-CLICK TUNNEL START
REM  Opens 5 windows:
REM    Backend    (:5000) -> npm start
REM    Storefront (:3000) -> next start (production build)
REM    Admin      (:3001) -> next start (production build)
REM    Gateway    (:8080) -> tools\ngrok-gateway.js
REM    Ngrok      (tunnel)-> ngrok http 8080
REM ============================================================
cd /d "%~dp0"

echo.
echo  Starting Konkan Bazaar ... 5 windows will open.
echo  NOTE: Close old windows first if ports are already in use.
echo.

start "Konkan Backend"    cmd /k "cd /d %~dp0backend && npm start"
start "Konkan Storefront" cmd /k "cd /d %~dp0frontend && npx next start -p 3000"
start "Konkan Admin"      cmd /k "cd /d %~dp0admin && npx next start -p 3001"
start "Konkan Gateway"    cmd /k "cd /d %~dp0 && node tools\ngrok-gateway.js"
start "Ngrok Tunnel"      cmd /k "ngrok http 8080"

echo.
echo  All windows opened! Wait 20-30 seconds for everything to boot.
echo.
echo  PUBLIC URL:
echo    Open http://127.0.0.1:4040 in your browser to find the ngrok URL.
echo    Or look at the "Ngrok Tunnel" window for the https://... URL.
echo.
echo  Storefront: ^<ngrok-url^>/
echo  Admin:      ^<ngrok-url^>/admin
echo  API:        ^<ngrok-url^>/api
echo.
pause
