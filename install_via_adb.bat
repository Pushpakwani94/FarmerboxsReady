@echo off
setlocal
set "ADB=C:\Users\Pushpak\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "APK=d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\public\farmerbox.apk"

echo ========================================================
echo    FarmerBox Joiner - ADB Installer (farmerbox.apk)
echo ========================================================
echo.
echo Checking for connected Android devices...
echo.

"%ADB%" devices

echo.
echo Waiting for device... Please connect your phone with USB Debugging enabled.
"%ADB%" wait-for-device

echo.
echo Device connected! Installing farmerbox.apk...
"%ADB%" install -r -d -t "%APK%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo    SUCCESS: FarmerBox.apk installed on your device!
    echo ========================================================
    echo.
    echo Launching FarmerBox Joiner on phone...
    "%ADB%" shell am start -n com.farmerbox.joiner/.MainActivity
) else (
    echo.
    echo [ERROR] Installation failed.
    echo Please ensure 'Install via USB' is enabled in Developer Options.
)

echo.
pause
