@echo off
setlocal
rem ==========================================================================
rem  Anteprima locale dei siti dimostrativi (doppio clic per avviare)
rem  1 = raccolta demo (pagina di selezione + 3 siti)   -> http://localhost:4173/
rem  2 = solo Trattoria  3 = solo Osteria  4 = solo Gemma (export singolo,
rem      servito in una sottocartella come su un hosting reale) -> http://localhost:4174/clienti/demo/
rem  Si puo' anche passare la scelta come argomento: AVVIA-ANTEPRIMA.cmd 3
rem  Per fermare il server: chiudere questa finestra o premere Ctrl+C.
rem ==========================================================================
cd /d "%~dp0"
title Anteprima ristoranti

where node >nul 2>nul
if errorlevel 1 goto nonode

if not exist "node_modules\sharp" (
  echo  Prima installazione delle dipendenze di sviluppo...
  call npm install --no-audit --no-fund
)
if not exist "node_modules\sharp" goto noinstall

set "SCELTA=%~1"
if not "%SCELTA%"=="" goto build

echo.
echo   ANTEPRIMA RISTORANTI
echo   --------------------
echo   1  Raccolta demo: pagina di selezione + tre siti
echo   2  Solo Trattoria Bellandi      (export singolo)
echo   3  Solo Osteria Campolungo      (export singolo)
echo   4  Solo Gemma                   (export singolo)
echo.
choice /c 1234 /n /m "  Scegli 1-4: "
set "SCELTA=%errorlevel%"

:build
echo.
echo  Aggiornamento della build...
call node tools\build.js
if errorlevel 1 goto nobuild

set "DIR=dist"
set "PORTA=4173"
set "SUB=/"
if "%SCELTA%"=="2" set "DIR=exports\trattoria"
if "%SCELTA%"=="3" set "DIR=exports\osteria"
if "%SCELTA%"=="4" set "DIR=exports\contemporaneo"
if not "%DIR%"=="dist" set "PORTA=4174"
if not "%DIR%"=="dist" set "SUB=/clienti/demo/"
set "URL=http://localhost:%PORTA%%SUB%"

echo.
echo  Cartella servita: %DIR%
echo  Indirizzo:        %URL%
echo  Per fermare il server: Ctrl+C oppure chiudere questa finestra.
echo.
if not defined NO_BROWSER start "" cmd /c "timeout /t 2 /nobreak >nul & start "" %URL%"
node tools\serve.js %DIR% %PORTA% %SUB%
echo.
echo  Server fermato. Se la porta %PORTA% era gia' occupata, chiudere l'altra finestra dell'anteprima e riprovare.
pause
exit /b 0

:nonode
echo.
echo  Node.js non e' installato: scaricarlo da https://nodejs.org e riprovare.
pause
exit /b 1

:noinstall
echo.
echo  Installazione delle dipendenze non riuscita: eseguire "npm install" nella cartella del progetto.
pause
exit /b 1

:nobuild
echo.
echo  Build non riuscita: vedere l'errore qui sopra.
pause
exit /b 1
