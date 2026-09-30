$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\Pushpak\AppData\Local\Android\Sdk"
$adb = "$sdkDir\platform-tools\adb.exe"
$jbr = "C:\Program Files\Android\Android Studio\jbr"
$apkPath = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\android\app\build\outputs\apk\debug\app-debug.apk"
$publicApk = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\public\farmerbox-joiner-v2.4.1.apk"

Write-Host "=== FarmerBox Joiner Capacitor APK Builder & Installer ===" -ForegroundColor Cyan

# 0. Clean prior APK files to prevent bundling them into Vite web assets
Write-Host "`n0. Cleaning previous APK files from public and assets..." -ForegroundColor Yellow
Remove-Item -Path "public\*.apk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist\*.apk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\src\main\assets\public\*.apk" -Force -ErrorAction SilentlyContinue

# 1. Build Vite web assets
Write-Host "`n1. Building Vite web assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }

# 2. Sync web assets with Capacitor Android
Write-Host "`n2. Syncing assets with Capacitor Android platform..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

# 3. Build Android APK using Gradle
Write-Host "`n3. Compiling Android APK with Gradle..." -ForegroundColor Yellow
$env:JAVA_HOME = $jbr
$env:ANDROID_HOME = $sdkDir

Push-Location "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\android"
try {
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
} finally {
    Pop-Location
}

# 4. Copy to public directory for direct download in admin panel
$farmerBoxApk = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\public\FarmerBox.apk"
Copy-Item $apkPath $publicApk -Force
Copy-Item $apkPath $farmerBoxApk -Force
Write-Host "`n=== APK Generated Successfully ===" -ForegroundColor Green
Get-Item $farmerBoxApk | Select-Object Name, Length, LastWriteTime

# 5. Check connected device
Write-Host "`nChecking for connected Android devices via ADB..." -ForegroundColor Yellow
$devices = & $adb devices | Select-String "device$"

if ($devices) {
    Write-Host "Found connected device(s):" -ForegroundColor Green
    $devices | ForEach-Object { Write-Host "  -> $_" }
    
    Write-Host "`nInstalling APK to device..." -ForegroundColor Yellow
    & $adb install -r -d -t $publicApk
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nLaunching FarmerBox Joiner on device..." -ForegroundColor Green
        & $adb shell am start -n com.farmerbox.joiner/.MainActivity
        Write-Host "`nSUCCESS: FarmerBox Joiner App is now installed and running!" -ForegroundColor Green
    } else {
        Write-Warning "ADB install returned exit code $LASTEXITCODE"
    }
} else {
    Write-Host "`nNOTE: No Android device currently detected via USB/ADB." -ForegroundColor Cyan
    Write-Host "You can install the APK in mobile devices using either method:" -ForegroundColor White
    Write-Host "  Option A: Connect phone via USB with USB Debugging enabled, then run: adb install -r $publicApk"
    Write-Host "  Option B: Open your phone's browser and go to: http://192.168.1.21:8080/farmerbox-joiner-v2.4.1.apk"
}
