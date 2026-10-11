$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\Pushpak\AppData\Local\Android\Sdk"
$jbr = "C:\Program Files\Android\Android Studio\jbr"
$outputAabRelease = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\android\app\build\outputs\bundle\release\app-release.aab"
$outputAabDebug = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\android\app\build\outputs\bundle\debug\app-debug.aab"
$destDir = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\build_apk"

Write-Host "=== FarmerBox Android App Bundle (.aab) Builder ===" -ForegroundColor Cyan

# 1. Build Vite web assets
Write-Host "`n1. Building Vite web assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }

# 2. Sync web assets with Capacitor Android
Write-Host "`n2. Syncing assets with Capacitor Android platform..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

# 2.1 Verify and fix any Android resource images
if (Test-Path ".\fix_res_images.ps1") {
    powershell -ExecutionPolicy Bypass -File .\fix_res_images.ps1
}

# 3. Build AAB with Gradle
Write-Host "`n3. Compiling Android App Bundle (.aab) with Gradle..." -ForegroundColor Yellow
$env:JAVA_HOME = $jbr
$env:ANDROID_HOME = $sdkDir

Push-Location "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\android"
try {
    .\gradlew.bat bundleRelease bundleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle bundle build failed" }
} finally {
    Pop-Location
}

# 4. Copy to build_apk folder
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

if (Test-Path $outputAabRelease) {
    Copy-Item $outputAabRelease "$destDir\FarmerBox-release.aab" -Force
    Write-Host "`n[SUCCESS] Release AAB created at: $destDir\FarmerBox-release.aab" -ForegroundColor Green
    Get-Item "$destDir\FarmerBox-release.aab" | Select-Object Name, Length, LastWriteTime
}

if (Test-Path $outputAabDebug) {
    Copy-Item $outputAabDebug "$destDir\FarmerBox-debug.aab" -Force
    Write-Host "`n[SUCCESS] Debug AAB created at: $destDir\FarmerBox-debug.aab" -ForegroundColor Green
    Get-Item "$destDir\FarmerBox-debug.aab" | Select-Object Name, Length, LastWriteTime
}
