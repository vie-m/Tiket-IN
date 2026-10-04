@echo off
rem Starts local PostgreSQL (embedded copy), the API and the website. Close the 3 windows to stop.
cd /d "%~dp0"
start "Postgres" cmd /k "cd local-postgres && pg\bin\postgres.exe -D data -p 5432"
timeout /t 4 >nul
start "API" cmd /k "cd server && npm start"
start "Client" cmd /k "cd client && npm run dev"
timeout /t 5 >nul
start http://localhost:5173
