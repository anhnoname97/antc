# =============================================================================
# reset-docker.ps1 - Dua moi truong Docker ve trang thai sach (giong run-local.ps1 -Reset).
#   .\reset-docker.ps1            # xoa volume, dung lai (khong build lai image neu da co)
#   .\reset-docker.ps1 -Build     # build lai image truoc khi dung
# Can file .env (xem .env.example). Cho den khi healthcheck xanh (uSync: Startup Complete).
# =============================================================================
param([switch]$Build)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
# File compose local khong dat ten mac dinh (docker-compose.yml) de Vibe Host khong nhan nham.
$env:COMPOSE_FILE = "compose.local.yml"
if (-not (Test-Path ".env")) { throw "Thieu .env. Chay: Copy-Item .env.example .env, roi dat ANTC_ADMIN_PASSWORD." }

Write-Host "==> Xoa container va volume du lieu" -ForegroundColor Cyan
docker compose down -v --remove-orphans
if ($LASTEXITCODE -ne 0) { throw "docker compose down that bai" }

Write-Host "==> Dung lai (cho healthcheck)" -ForegroundColor Cyan
$args2 = @("up", "-d", "--wait", "--wait-timeout", "600")
if ($Build) { $args2 += "--build" }
docker compose @args2
if ($LASTEXITCODE -ne 0) { docker compose logs --tail 60 antc; throw "Khong len duoc" }
$port = if ($env:ANTC_PORT) { $env:ANTC_PORT } else { "11000" }
Write-Host "San sang: http://localhost:$port  (quan tri /umbraco, admin@antc.local)" -ForegroundColor Green
