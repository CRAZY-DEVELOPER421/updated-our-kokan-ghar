@echo off
REM ============================================================
REM  Konkan Bazaar - ONE-CLICK TUNNEL START
REM  Opens 5 windows:
REM    Backend    (:5000) -> npm start
REM    Storefront (:3000) -> next start (production build)
REM    Admin      (:3001) -> next start (production build, served at /admin)
REM    Gateway    (:8080) -> tools\ngrok-gateway.js (password protected)
REM    Ngrok      (tunnel)-> https://xxxx.ngrok-free.dev
REM ============================================================
cd /d "%~dp0"

REM --- Shared gateway credentials ---
REM NEVER hardcode the real password here (this file is in git).
REM The real values live in .env (GATEWAY_USER / GATEWAY_PASS, gitignored).
set GATEWAY_USER=kokan
set GATEWAY_PASS=CHANGE_ME
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="GATEWAY_USER" set GATEWAY_USER=%%b
        if "%%a"=="GATEWAY_PASS" set GATEWAY_PASS=%%b
    )
)

REM --- Read the ngrok authtoken from .env ---
REM The ngrok authtoken is read by ngrok itself from its own private config
REM (C:\Users\devel\AppData\Local\ngrok\ngrok.yml) - registered once via:
REM   ngrok config add-authtoken ^<token^>
REM (kept in sync with NGROK_AUTHTOKEN in .env). No fragile parsing here.

echo Starting Konkan Bazaar ... 5 windows will open.
echo NOTE: Close old windows first if ports are already in use.

start "Konkan Backend"    cmd /k "cd /d %~dp0backend && npm start"
start "Konkan Storefront" cmd /k "cd /d %~dp0frontend && npx next start -p 3000"
start "Konkan Admin"      cmd /k "cd /d %~dp0admin && npx next start -p 3001"
start "Konkan Gateway"    cmd /k "cd /d %~dp0 && node tools\ngrok-gateway.js"
start "Ngrok Tunnel"      cmd /k "C:\ngrok-v3-stable-windows-386\ngrok.exe http 8080"

echo.
echo All windows opened! Wait 20-30 seconds for everything to boot.
echo   Public URL : the https://....ngrok-free.dev shown in the "Ngrok Tunnel" window
echo   Login      : user %GATEWAY_USER% / password %GATEWAY_PASS%
echo   Admin      : ^<url^>/admin
echo.
pause
