@echo off
REM ============================================================
REM  RUN TUNNEL - SINGLE WINDOW VERSION (terminal se fast)
REM  Backend, Storefront, Admin, Gateway aur Ngrok sab isi window
REM  ke background me start hote hain. Logs -> logs\*.log
REM  Public URL yahin print hota hai. Window BAND karo = sab band.
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

REM The ngrok authtoken is read by ngrok itself from its own private config
REM (C:\Users\devel\AppData\Local\ngrok\ngrok.yml) - registered once via:
REM   ngrok config add-authtoken ^<token^>
REM (kept in sync with NGROK_AUTHTOKEN in .env). No fragile parsing here.
if not exist logs mkdir logs

echo Starting Konkan Bazaar (single window)...
start /b cmd /c "cd /d %~dp0backend && npm start > %~dp0logs\backend.log 2>&1"
start /b cmd /c "cd /d %~dp0frontend && npx next start -p 3000 > %~dp0logs\frontend.log 2>&1"
start /b cmd /c "cd /d %~dp0admin && npx next start -p 3001 > %~dp0logs\admin.log 2>&1"
start /b cmd /c "cd /d %~dp0 && node tools\ngrok-gateway.js > %~dp0logs\gateway.log 2>&1"
start /b cmd /c "C:\ngrok-v3-stable-windows-386\ngrok.exe http 8080 --log=stdout > %~dp0logs\ngrok.log 2>&1"

echo Waiting for the tunnel URL...
for /l %%i in (1,1,30) do (
    findstr /C:"url=" logs\ngrok.log >nul 2>&1 && goto found
    timeout /t 1 /nobreak >nul
)
echo [wait] Tunnel URL 30s me nahi aaya - logs\ngrok.log check karo.
goto done
:found
echo.
echo ============================================================
echo  PUBLIC URL :
findstr "url=" logs\ngrok.log
echo.
echo  Login   : %GATEWAY_USER% / %GATEWAY_PASS%
echo  Admin   : ^<url^>/admin
echo  Logs    : logs\*.log
echo ============================================================
echo.
echo Services isi window ke background me chal rahe hain.
echo Is window ko BAND karo = sab kuch band.
echo (Ya phir: stop-tunnel.bat chalao)
echo.
:done
pause
