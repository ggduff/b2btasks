@echo off
REM B2B Tasks Deployment Script for Windows
REM Run from thinkhuge-b2b-tracker directory
REM Usage: deploy.bat

setlocal EnableDelayedExpansion

set SERVER=root@152.89.209.20
set SSH_PORT=22122
set SSH_KEY=C:\ssh\id_rsa
set REMOTE_DIR=/srv/b2btasks

echo ============================================
echo   B2B Tasks - Production Deployment
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Run this script from the thinkhuge-b2b-tracker directory
    exit /b 1
)

echo [1/5] Building Next.js app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    exit /b 1
)
echo Build completed successfully.
echo.

echo [2/5] Syncing files to production server...
REM Using tar over SSH since rsync is not available on Windows
tar --exclude="node_modules" --exclude=".git" --exclude=".env.local" --exclude=".env" --exclude="*.db" --exclude="*.db-journal" --exclude=".next/cache" -cvf - . | ssh -i "%SSH_KEY%" -p %SSH_PORT% %SERVER% "cd %REMOTE_DIR% && tar -xvf -"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: File sync failed!
    exit /b 1
)
echo Files synced successfully.
echo.

echo [3/5] Installing dependencies on server...
ssh -i "%SSH_KEY%" -p %SSH_PORT% %SERVER% "cd %REMOTE_DIR% && npm ci --omit=dev"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Dependency installation failed!
    exit /b 1
)
echo Dependencies installed.
echo.

echo [4/5] Running database migrations...
ssh -i "%SSH_KEY%" -p %SSH_PORT% %SERVER% "cd %REMOTE_DIR% && npx prisma generate && npx prisma migrate deploy"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database migration failed!
    exit /b 1
)
echo Migrations completed.
echo.

echo [5/5] Restarting application...
ssh -i "%SSH_KEY%" -p %SSH_PORT% %SERVER% "cd %REMOTE_DIR% && pm2 restart b2btasks 2>/dev/null || pm2 start ecosystem.config.js && pm2 save"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Application restart failed!
    exit /b 1
)
echo.

echo ============================================
echo   Deployment Complete!
echo ============================================
echo.
echo Site URL: https://b2btasks.thinkhuge.net
echo.

REM Show PM2 status
ssh -i "%SSH_KEY%" -p %SSH_PORT% %SERVER% "pm2 status"

endlocal
