# =============================================================================
# core_build.ps1 - Build lai core Umbraco tu src/ANTC.Portal.Core -> feed noi bo
#                  (src/ANTC.Portal.Lib/Build.Core) -> App nhan core moi.
#
# Chay khi nao?  CHI khi da SUA CODE trong src/ANTC.Portal.Core (core Umbraco).
#                Sua code trong ANTC.Portal.App thi KHONG can chay - build App binh thuong.
#
# Quy trinh:
#   1. (tuy chon) -BuildSpa: xoa backoffice/login da build de MSBuild build lai (can Node 22+)
#   2. dotnet pack core -> src/ANTC.Portal.Lib/Build.Core
#   3. Xoa cache NuGet da giai nen (cung version) de App lay ban moi
#   4. Restore + build App de xac nhan
#
# Version:
#   - Hang ngay: khong truyen gi -> dung UmbracoCoreVersion trong ANTC.Portal.App/Directory.Build.props
#   - Phat hanh: -Version 18.2.1-antc.20261101 -> script cap nhat luon Directory.Build.props
#
# Vi du:
#   .\core_build.ps1
#   .\core_build.ps1 -BuildSpa
#   .\core_build.ps1 -Version 18.2.1-antc.20261101
# =============================================================================
param(
    [string]$Version = "",
    [switch]$BuildSpa,
    [switch]$SkipValidate
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Core = Join-Path $Root "src\ANTC.Portal.Core"
$Sln = Join-Path $Core "umbraco.sln"
$Feed = Join-Path $Root "src\ANTC.Portal.Lib\Build.Core"
$App = Join-Path $Root "src\ANTC.Portal.App"
$BuildProps = Join-Path $App "Directory.Build.props"
$StaticAssets = Join-Path $Core "src\Umbraco.Cms.StaticAssets\wwwroot\umbraco"

function Step($m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what that bai (exit $LASTEXITCODE)" } }

if (-not (Test-Path $Sln)) { throw "Khong thay $Sln" }

# -- Version --
$propsText = [IO.File]::ReadAllText($BuildProps)
if ($Version -eq "") {
    $m = [regex]::Match($propsText, '<UmbracoCoreVersion[^>]*>([^<]+)</UmbracoCoreVersion>')
    if (-not $m.Success) { throw "Khong doc duoc UmbracoCoreVersion tu $BuildProps" }
    $Version = $m.Groups[1].Value.Trim()
} else {
    $propsText = [regex]::Replace($propsText, '(<UmbracoCoreVersion[^>]*>)[^<]+(</UmbracoCoreVersion>)', "`${1}$Version`${2}")
    [IO.File]::WriteAllText($BuildProps, $propsText, (New-Object Text.UTF8Encoding $false))
    Write-Host "Da dat UmbracoCoreVersion = $Version"
}
Step "Core version: $Version"

# -- 1. SPA --
if ($BuildSpa) {
    Step "Xoa backoffice/login da build de build lai..."
    foreach ($d in "backoffice", "login") {
        $p = Join-Path $StaticAssets $d
        if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force }
    }
}
if (-not (Test-Path (Join-Path $StaticAssets "backoffice"))) {
    Write-Host "Backoffice chua duoc build - lan pack nay se chay npm (mat 10-20 phut, can Node 22+)." -ForegroundColor Yellow
}

# -- 2. Pack --
Step "Pack core -> feed..."
if (-not (Test-Path $Feed)) { New-Item -ItemType Directory -Force $Feed | Out-Null }
Get-ChildItem $Feed -Include *.nupkg, *.snupkg -File -Recurse | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
dotnet pack $Sln -c Release -o $Feed "-p:Version=$Version" -p:EnablePackageValidation=false -p:IncludeSymbols=false --verbosity minimal
Check "dotnet pack"
$count = (Get-ChildItem $Feed -Filter *.nupkg).Count
Write-Host "Da tao $count goi trong $Feed"

# -- 3. Cache NuGet --
Step "Xoa cache NuGet cua version $Version..."
$cache = Join-Path $env:USERPROFILE ".nuget\packages"
if (Test-Path $cache) {
    Get-ChildItem $cache -Directory -Filter "umbraco.cms*" | ForEach-Object {
        $v = Join-Path $_.FullName $Version
        if (Test-Path $v) { Remove-Item -LiteralPath $v -Recurse -Force }
    }
}

# -- 4. Validate --
if (-not $SkipValidate) {
    Step "Restore + build App..."
    Push-Location $App
    try {
        dotnet restore ANTC.Portal.App.slnx --force --verbosity quiet; Check "dotnet restore"
        dotnet build ANTC.Portal.App.slnx -c Release --no-restore --verbosity minimal; Check "dotnet build"
    } finally { Pop-Location }
    Step "BUILD OK - App dang dung core $Version"
}
