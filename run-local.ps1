# =============================================================================
# run-local.ps1 - Chay website tren may ca nhan. Khong can cai gi ngoai .NET 10 SDK.
#
#   .\run-local.ps1              # binh thuong: build App + chay (http://localhost:11000)
#   .\run-local.ps1 -Reset       # xoa CSDL local roi chay -> tao lai tu dau
#   .\run-local.ps1 -BuildCore   # da sua code trong src/ANTC.Portal.Core -> build lai core truoc khi chay
#   .\run-local.ps1 -NoRun       # chi chuan bi va build, khong chay
#
# Lan chay dau: Umbraco tu cai dat, tu tao CSDL SQLite, document type, template, cay noi dung mau
# va nap 200 cau hoi. Mat khoang 30 giay. Khong can thao tac tay.
# =============================================================================
param(
    [switch]$Reset,
    [switch]$BuildCore,
    [switch]$NoRun
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$App = Join-Path $Root "src\ANTC.Portal.App"
$HostDir = Join-Path $App "Umbraco.Web.UI"
$Local = Join-Path $HostDir "appsettings.Local.json"
$Template = Join-Path $HostDir "appsettings.Local.template.json"
$DefaultPassword = "Antc@Local2026"

function Step($m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }

Step "Kiem tra .NET SDK"
$sdks = & dotnet --list-sdks 2>$null
$sdk10 = $sdks | Where-Object { $_ -match '^10\.' } | Select-Object -Last 1
if (-not $sdk10) {
    throw "Chua co .NET 10 SDK. Tai tai https://dotnet.microsoft.com/download/dotnet/10.0"
}
Write-Host ("SDK: " + ($sdk10 -split ' ')[0])

if (-not (Test-Path $Local)) {
    Step "Tao appsettings.Local.json (chi tren may nay, khong commit)"
    $text = [IO.File]::ReadAllText($Template).Replace("__DOI_MAT_KHAU__", $DefaultPassword)
    [IO.File]::WriteAllText($Local, $text, (New-Object Text.UTF8Encoding $false))
}

if ($Reset) {
    Step "Xoa CSDL local"
    foreach ($d in "umbraco\Data", "umbraco\Logs", "App_Data") {
        $p = Join-Path $HostDir $d
        if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
    }
}

if ($BuildCore) {
    Step "Build lai core"
    & (Join-Path $Root "core_build.ps1") -SkipValidate
}

Step "Build App"
Push-Location $App
try {
    dotnet build ANTC.Portal.App.slnx -c Debug --verbosity quiet -nologo
    if ($LASTEXITCODE -ne 0) { throw "Build App that bai" }
} finally { Pop-Location }

if ($NoRun) { Step "Xong (khong chay vi -NoRun)"; return }

Step "Chay website"
Write-Host "  Trang web:   http://localhost:11000"
Write-Host "  Quan tri:    http://localhost:11000/umbraco"
Write-Host "  Tai khoan:   admin@antc.local / $DefaultPassword"
Write-Host "               (muon doi: sua appsettings.Local.json TRUOC lan chay dau, hoac doi trong backoffice)"
Write-Host "  Dung:        Ctrl+C"
Push-Location $HostDir
try { dotnet run --no-build } finally { Pop-Location }
