$ErrorActionPreference = "Stop"

$oldPkg = "com.example.rosdom"
$newPkg = "ru.rosdom"

$javaDir = "c:\Programs\RosDom\app\src\main\java"
$oldPath = Join-Path $javaDir "com\example\rosdom"
$newPath = Join-Path $javaDir "ru\rosdom"

if (Test-Path $oldPath) {
    New-Item -ItemType Directory -Force -Path $newPath | Out-Null
    Move-Item -Path "$oldPath\*" -Destination $newPath -Force
    Remove-Item -Path (Join-Path $javaDir "com") -Recurse -Force
}

$testDir = "c:\Programs\RosDom\app\src\test\java"
$oldTestPath = Join-Path $testDir "com\example\rosdom"
$newTestPath = Join-Path $testDir "ru\rosdom"
if (Test-Path $oldTestPath) {
    New-Item -ItemType Directory -Force -Path $newTestPath | Out-Null
    Move-Item -Path "$oldTestPath\*" -Destination $newTestPath -Force
    Remove-Item -Path (Join-Path $testDir "com") -Recurse -Force
}

$androidTestDir = "c:\Programs\RosDom\app\src\androidTest\java"
$oldAndroidTestPath = Join-Path $androidTestDir "com\example\rosdom"
$newAndroidTestPath = Join-Path $androidTestDir "ru\rosdom"
if (Test-Path $oldAndroidTestPath) {
    New-Item -ItemType Directory -Force -Path $newAndroidTestPath | Out-Null
    Move-Item -Path "$oldAndroidTestPath\*" -Destination $newAndroidTestPath -Force
    Remove-Item -Path (Join-Path $androidTestDir "com") -Recurse -Force
}

$files = Get-ChildItem -Path c:\Programs\RosDom -Include *.kt,*.kts,*.xml -Recurse | Where-Object { -not $_.FullName.Contains("build\tmp") -and -not $_.FullName.Contains(".gradle") }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match "com\.example\.rosdom") {
        $content = $content -replace 'com\.example\.rosdom', 'ru.rosdom'
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    }
}
Write-Host "Refactoring complete."
