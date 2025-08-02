@echo off
echo ========================================
echo ShineSmile Backend Installation (Windows)
echo ========================================
echo.

echo Installing Node.js dependencies...
npm install

echo.
echo Creating .env file from config.env...
copy config.env .env

echo.
echo ========================================
echo SQL Server Setup Required
echo ========================================
echo.
echo Please follow these steps to set up SQL Server:
echo.
echo 1. Open SQL Server Management Studio
echo 2. Connect to your SQL Server instance
echo 3. Run the setup-database.sql script
echo 4. Update the database credentials in .env file
echo.
echo Database setup script: setup-database.sql
echo.
echo After completing the SQL Server setup:
echo 1. Update .env file with your database credentials
echo 2. Run: npm start
echo.
echo ========================================
echo Installation completed!
echo ========================================
pause 