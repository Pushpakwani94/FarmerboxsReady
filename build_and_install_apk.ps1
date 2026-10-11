$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\Pushpak\AppData\Local\Android\Sdk"
$buildToolsDir = "$sdkDir\build-tools\34.0.0"
$platformJar = "$sdkDir\platforms\android-35\android.jar"
$adb = "$sdkDir\platform-tools\adb.exe"

$aapt = "$buildToolsDir\aapt.exe"
$d8 = "$buildToolsDir\d8.bat"
$zipalign = "$buildToolsDir\zipalign.exe"
$apksigner = "$buildToolsDir\apksigner.bat"

Write-Host "=== Building FarmerBox Joiner Android APK v2.4.1 ==="

# Clean work directory
$workDir = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\build_apk"
if (Test-Path $workDir) { Remove-Item -Recurse -Force $workDir }
New-Item -ItemType Directory -Force -Path "$workDir\src\com\farmerbox\joiner" | Out-Null
New-Item -ItemType Directory -Force -Path "$workDir\res\values" | Out-Null
New-Item -ItemType Directory -Force -Path "$workDir\bin" | Out-Null
New-Item -ItemType Directory -Force -Path "$workDir\classes" | Out-Null

# Create AndroidManifest.xml
@'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.farmerbox.joiner"
    android:versionCode="42"
    android:versionName="2.4.1">

    <uses-sdk
        android:minSdkVersion="26"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="FarmerBox Joiner"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'@ | Set-Content -Path "$workDir\AndroidManifest.xml" -Encoding ascii

# Create res/values/strings.xml
@'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">FarmerBox Joiner</string>
</resources>
'@ | Set-Content -Path "$workDir\res\values\strings.xml" -Encoding ascii

# Create MainActivity.java
@'
package com.farmerbox.joiner;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUserAgentString(settings.getUserAgentString() + " FarmerBoxApp/2.4.1");

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load local dev server with mobile joiner mode
        webView.loadUrl("http://192.168.1.8:8080/?app=joiner");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
'@ | Set-Content -Path "$workDir\src\com\farmerbox\joiner\MainActivity.java" -Encoding ascii

Write-Host "1. Running aapt package..."
& $aapt package -f -m --min-sdk-version 26 --target-sdk-version 34 --version-code 42 --version-name "2.4.1" -J "$workDir\src" -M "$workDir\AndroidManifest.xml" -S "$workDir\res" -I $platformJar -F "$workDir\bin\resources.ap_"
if ($LASTEXITCODE -ne 0) { throw "aapt failed" }

Write-Host "2. Compiling Java sources..."
& javac -d "$workDir\classes" -cp $platformJar "$workDir\src\com\farmerbox\joiner\*.java"
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

Write-Host "3. Compiling to Dalvik bytecode (d8)..."
$classes = Get-ChildItem -Recurse "$workDir\classes" -Filter "*.class" | ForEach-Object { $_.FullName }
& cmd.exe /c "$d8" --output "$workDir\bin" --min-api 26 $classes
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

Write-Host "4. Packaging unaligned APK..."
Copy-Item "$workDir\bin\resources.ap_" "$workDir\bin\unaligned.apk"
& cmd.exe /c "cd /d `"$workDir\bin`" && `"$aapt`" add unaligned.apk classes.dex"
if ($LASTEXITCODE -ne 0) { throw "aapt add failed" }

Write-Host "5. Running zipalign..."
& $zipalign -p -f 4 "$workDir\bin\unaligned.apk" "$workDir\bin\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "6. Generating release keystore and signing..."
$keystore = "$workDir\debug.keystore"
if (Test-Path $keystore) { Remove-Item $keystore }
& keytool -genkeypair -v -keystore $keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=FarmerBox, OU=Mobile, O=FarmerBox, L=Pune, ST=Maharashtra, C=IN"

$finalApk = "d:\Canary-All-Project\FinalFarmerBox\FarmerBoxAdminPanel\public\FarmerBox.apk"
& cmd.exe /c "$apksigner sign --ks `"$keystore`" --ks-pass pass:android --key-pass pass:android --out `"$finalApk`" `"$workDir\bin\aligned.apk`""
if ($LASTEXITCODE -ne 0) { throw "apksigner failed" }

Write-Host "=== Ultra-Lightweight APK Successfully Built ==="
Get-Item $finalApk | Select-Object Name, Length, LastWriteTime

Write-Host "=== Checking Connected Device & Installing via USB ==="
$devices = & $adb devices | Select-String "device$"
if ($devices) {
    & $adb install -r -d -t $finalApk
    if ($LASTEXITCODE -eq 0) {
        Write-Host "=== Launching FarmerBox Joiner on Device ==="
        & $adb shell am start -n com.farmerbox.joiner/.MainActivity
        Write-Host "SUCCESS: FarmerBox Joiner App is installed and running on physical device!"
    }
} else {
    Write-Host "NOTE: Please enable USB Debugging on your phone to install directly via ADB."
}
