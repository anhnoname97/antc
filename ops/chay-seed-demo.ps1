# =============================================================================
# chay-seed-demo.ps1 - Nap du lieu demo quay so tren may local va kiem tra lai bang HTTP.
#
#   .\ops\chay-seed-demo.ps1                 # chay het cac buoc, xong thi dung web
#   .\ops\chay-seed-demo.ps1 -Reset          # xoa CSDL local truoc (mat het du lieu local cua worktree)
#   .\ops\chay-seed-demo.ps1 -KeepRunning    # de web chay tiep sau khi xong
#   .\ops\chay-seed-demo.ps1 -PreDraw 3      # so suat quay truoc (0-5, mac dinh 2)
#
# Cac buoc: run-local -NoRun (build, tao appsettings.Local.json) -> dat DrawDemo:Member:Password ->
# chay web (Development) -> SeedDrawDemo (xem, --apply, --verify) -> kiem tra HTTP -> dung web.
# Mat khau demo lay tu UnattendedUserPassword trong appsettings.Local.json (mac dinh cua run-local);
# script khong in mat khau va khong ghi gi vao git (appsettings.Local.json va App_Data da bi .gitignore).
# =============================================================================
param(
    [switch]$Reset,
    [switch]$KeepRunning,
    [ValidateRange(0, 5)][int]$PreDraw = 2,
    [int]$Port = 11000
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$App = Join-Path $Root "src\ANTC.Portal.App"
$HostDir = Join-Path $App "Umbraco.Web.UI"
$Local = Join-Path $HostDir "appsettings.Local.json"
$Db = Join-Path $HostDir "App_Data\app.sqlite.db"
$Seed = Join-Path $App "Tools\SeedDrawDemo"
$Base = "http://localhost:$Port"
$Log = Join-Path ([IO.Path]::GetTempPath()) "antc-seed-demo-web.log"

function Step($m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Fail($m) { throw $m }

function Stop-Web {
    $pids = @((Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).OwningProcess) | Where-Object { $_ } | Sort-Object -Unique
    foreach ($p in $pids) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
}

function Invoke-Seed([string[]]$SeedArgs) {
    $ErrorActionPreference = "Continue"
    $out = & dotnet run --project $Seed -- --db $Db @SeedArgs 2>&1 | Where-Object { $_ -notmatch "warning NU" }
    if ($LASTEXITCODE -ne 0) { $out | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }; Fail "SeedDrawDemo that bai ($($SeedArgs -join ' '))" }
    return $out
}

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    Fail "Cong $Port dang co chuong trinh khac nghe; dung no truoc (hoac chon -Port khac)."
}

Step "Chuan bi (run-local -NoRun)"
if ($Reset) { & (Join-Path $Root "run-local.ps1") -NoRun -Reset } else { & (Join-Path $Root "run-local.ps1") -NoRun }
if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) { Fail "run-local.ps1 -NoRun that bai" }

Step "Dat thanh vien demo trong appsettings.Local.json"
$cfg = [IO.File]::ReadAllText($Local) | ConvertFrom-Json
$password = $cfg.Umbraco.CMS.Unattended.UnattendedUserPassword
if (-not $password -or $password.StartsWith("__")) { Fail "Chua co mat khau that trong UnattendedUserPassword cua appsettings.Local.json" }
if (-not $cfg.DrawDemo) { $cfg | Add-Member -NotePropertyName DrawDemo -NotePropertyValue ([pscustomobject]@{ Member = [pscustomobject]@{} }) }
$member = $cfg.DrawDemo.Member
foreach ($pair in @{ UserName = "bantochuc.demo"; Email = "bantochuc.demo@antc.local"; Name = "Ban to chuc (demo)" }.GetEnumerator()) {
    if (-not $member.($pair.Key)) { $member | Add-Member -NotePropertyName $pair.Key -NotePropertyValue $pair.Value -Force }
}
$member | Add-Member -NotePropertyName Password -NotePropertyValue $password -Force
[IO.File]::WriteAllText($Local, ($cfg | ConvertTo-Json -Depth 10), (New-Object Text.UTF8Encoding $false))
Write-Host "  Thanh vien demo: $($member.UserName)"

$web = $null
try {
    Step "Chay web (Development) tai $Base"
    $web = Start-Process dotnet -ArgumentList "run", "--no-build" -WorkingDirectory $HostDir `
        -RedirectStandardOutput $Log -RedirectStandardError "$Log.err" -PassThru -WindowStyle Hidden
    $up = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep 5
        if ($web.HasExited) { Get-Content "$Log.err" -TotalCount 3 | ForEach-Object { Write-Host $_.Substring(0, [Math]::Min(300, $_.Length)) }; Fail "Web thoat som, xem $Log.err" }
        try { if ((Invoke-WebRequest "$Base/quay-so/dang-nhap" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200) { $up = $true; break } } catch { }
    }
    if (-not $up) { Fail "Web khong len sau 5 phut, xem $Log" }
    Write-Host "  Web da chay."

    Step "Seed du lieu demo"
    Invoke-Seed @() | Out-Null
    $applied = Invoke-Seed @("--apply", "--predraw", "$PreDraw")
    $applied | Where-Object { $_ -match '"(Manifest|Backup)"' } | ForEach-Object { Write-Host ("  " + $_.Trim()) }
    $verify = Invoke-Seed @("--verify") | Out-String
    if ($verify -notmatch '"ScoreMismatches":\s*0' -or $verify -notmatch '"AnswerCountMismatches":\s*0') { Fail "Verify lech diem hoac so dap an" }
    if ($verify -notmatch '"DistinctScores":\s*50') { Fail "Verify: khong du 50 diem khac nhau" }
    Write-Host "  Verify dat: 50 luot nop, 50 diem khac nhau, 0 lech."

    Step "Kiem tra HTTP"
    $redirected = $false
    try { Invoke-WebRequest "$Base/quay-so" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop | Out-Null } catch { $redirected = $true }
    if (-not $redirected) { Fail "GET /quay-so khi chua dang nhap phai chuyen huong" }
    Write-Host "  /quay-so khi chua dang nhap: chuyen huong (dung)"
    $page = Invoke-WebRequest "$Base/quay-so/dang-nhap" -UseBasicParsing -SessionVariable session
    $token = [regex]::Match($page.Content, 'name="__RequestVerificationToken"[^>]*value="([^"]+)"').Groups[1].Value
    try {
        Invoke-WebRequest "$Base/quay-so/dang-nhap" -Method Post -WebSession $session -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop `
            -Body @{ UserName = $member.UserName; Password = $password; ReturnUrl = "/quay-so"; __RequestVerificationToken = $token } | Out-Null
    } catch { }
    $list = Invoke-WebRequest "$Base/quay-so" -WebSession $session -UseBasicParsing
    if ($list.StatusCode -ne 200 -or -not $list.Content.Contains("[DEMO]")) { Fail "Dang nhap demo hoac danh sach /quay-so khong dat" }
    $contestId = [regex]::Match($list.Content, '/quay-so/(\d+)').Groups[1].Value
    $api = (Invoke-WebRequest "$Base/api/v1/quay-so/contests/$contestId" -WebSession $session -UseBasicParsing).Content | ConvertFrom-Json
    $quantity = ($api.prizes | Measure-Object quantity -Sum).Sum
    $awarded = ($api.prizes | Measure-Object awarded -Sum).Sum
    if ($awarded -ne $PreDraw) { Fail "Da quay $awarded suat, mong doi $PreDraw (da co luot quay truoc do?)" }
    if ($api.participants -ne 50) { Fail "participants = $($api.participants), mong doi 50" }

    Step "Ket qua"
    Write-Host "  URL:          $Base/quay-so/dang-nhap"
    Write-Host "  Tai khoan:    $($member.UserName) (mat khau: UnattendedUserPassword trong appsettings.Local.json)"
    Write-Host "  contestId:    $contestId"
    Write-Host "  Da quay:      $awarded/$quantity suat"
    foreach ($p in $api.prizes) { Write-Host ("    {0}: con {1}/{2}" -f $p.name, $p.remaining, $p.quantity) }
}
finally {
    if (-not $KeepRunning) {
        Step "Dung web"
        Stop-Web
        if ($web -and -not $web.HasExited) { Stop-Process -Id $web.Id -Force -ErrorAction SilentlyContinue }
        & dotnet build-server shutdown 2>&1 | Out-Null
    }
}
