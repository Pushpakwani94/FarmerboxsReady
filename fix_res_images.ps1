Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -Recurse -Path "android\app\src\main\res" -Filter "*.png"

foreach ($file in $files) {
    $fs = [System.IO.File]::OpenRead($file.FullName)
    $b1 = $fs.ReadByte()
    $b2 = $fs.ReadByte()
    $fs.Close()

    if ($b1 -eq 0xFF -and $b2 -eq 0xD8) {
        Write-Host "Converting JPEG disguised as PNG:" $file.FullName
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $temp = $file.FullName + ".tmp.png"
        $img.Save($temp, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Move-Item -Force $temp $file.FullName
    }
}
Write-Host "Resource verification & conversion complete!"
