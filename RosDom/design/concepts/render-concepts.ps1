$ErrorActionPreference = "Stop"

$edgePaths = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$edge = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
    throw "Microsoft Edge was not found."
}

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $baseDir "output"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$targets = @(
    @{ Name = "home-atlas"; Width = 1600; Height = 2400 },
    @{ Name = "scene-hub"; Width = 1600; Height = 2400 },
    @{ Name = "family-guardian"; Width = 1600; Height = 2400 }
)

foreach ($target in $targets) {
    $htmlPath = Join-Path $baseDir ($target.Name + ".html")
    $pngPath = Join-Path $outputDir ($target.Name + ".png")
    $uri = [System.Uri]::new($htmlPath).AbsoluteUri
    & $edge `
        --headless `
        --disable-gpu `
        --hide-scrollbars `
        "--window-size=$($target.Width),$($target.Height)" `
        "--screenshot=$pngPath" `
        $uri | Out-Null
}

Write-Host "Rendered concept boards to $outputDir"
