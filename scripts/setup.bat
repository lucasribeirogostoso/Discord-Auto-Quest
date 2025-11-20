@echo off
echo ========================================
echo Discord Auto Quest - Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found!
node --version
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo npm found!
npm --version
echo.

echo Installing dependencies...
echo This may take a few minutes...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Try running: npm cache clean --force
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application in development mode:
echo   npm run dev
echo.
echo To build for Windows:
echo   npm run build:win
echo.
pause

