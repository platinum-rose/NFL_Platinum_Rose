# scripts/props/launch-bol-browser.ps1
# Launches Chrome with a dedicated persistent profile and remote debugging enabled on port 9223.
# Log into BetOnline.ag once in this browser window; session cookies and Cloudflare clearance will persist.

$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $ChromePath)) {
    $ChromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $ChromePath)) {
    Write-Error "Chrome executable not found. Please verify Google Chrome installation."
    exit 1
}

$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$ProfileDir = Join-Path $RepoRoot ".chrome-bol"
if (-not (Test-Path $ProfileDir)) {
    New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
}

$Url = "https://sports.betonline.ag/sportsbook/football/nfl"

Write-Host "[LAUNCH] Starting Chrome with Remote Debugging (port 9223)..." -ForegroundColor Cyan
Write-Host "[PROFILE] Directory: $ProfileDir" -ForegroundColor Gray

Start-Process -FilePath $ChromePath -ArgumentList @(
    "--remote-debugging-port=9223",
    "--user-data-dir=`"$ProfileDir`"",
    "--no-first-run",
    "--no-default-browser-check",
    "`"$Url`""
)

Write-Host "[SUCCESS] Chrome launched on port 9223. Complete Cloudflare verification and log in once if required." -ForegroundColor Green
