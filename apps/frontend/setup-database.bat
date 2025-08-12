@echo off
echo Setting up database...
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable is not set
    echo Please set DATABASE_URL to your PostgreSQL connection string
    echo Example: set DATABASE_URL=postgresql://user:password@host:port/database
    pause
    exit /b 1
)

echo Running database migration...
npm run migrate:db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database setup completed successfully!
    echo You can now run the application normally.
) else (
    echo.
    echo ❌ Database setup failed!
    echo Please check your DATABASE_URL and try again.
)

echo.
pause

