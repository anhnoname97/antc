#Requires -Version 7.2
#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9.-]+$')][string]$HostName,
    [Parameter(Mandatory)][string]$CaddyExe,
    [Parameter(Mandatory)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$ExpectedSha256,
    [string]$InstallRoot = 'C:\AntcStaging',
    [ValidateRange(1024,65535)][int]$BackendPort = 11010,
    [string[]]$AllowedClientNetworks = @('LocalSubnet')
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Deployment.Common.ps1')
if (!$IsWindows) { throw 'Script cài proxy dành cho Windows.' }
if (Get-Service -Name 'ANTC-Staging-Proxy' -ErrorAction SilentlyContinue) { throw 'Proxy đã tồn tại; dùng caddy reload để đổi cấu hình.' }
if ((Get-FileHash -LiteralPath $CaddyExe -Algorithm SHA256).Hash -ne $ExpectedSha256) { throw 'SHA-256 Caddy không khớp bản tải tin cậy.' }
$root = Get-InstallPath $InstallRoot
$proxy = Join-Path $root 'proxy'
if (Test-Path -LiteralPath $proxy) { throw 'Thư mục proxy đã tồn tại; không ghi đè cấu hình/chứng thư cũ.' }
New-Item -ItemType Directory -Path (Join-Path $proxy 'data') | Out-Null
Protect-DeploymentDirectory $root
Copy-Item -LiteralPath $CaddyExe -Destination (Join-Path $proxy 'caddy.exe')
$storage = (Join-Path $proxy 'data').Replace('\','/')
$config = @"
{
    admin 127.0.0.1:2019
    persist_config off
    skip_install_trust
    storage file_system {
        root "$storage"
    }
}
$HostName {
    tls internal
    reverse_proxy 127.0.0.1:$BackendPort
}
"@
$config | Set-Content -LiteralPath (Join-Path $proxy 'Caddyfile') -Encoding utf8NoBOM
& (Join-Path $proxy 'caddy.exe') validate --config (Join-Path $proxy 'Caddyfile') --adapter caddyfile
if ($LASTEXITCODE -ne 0) { throw 'Cấu hình Caddy không hợp lệ; chưa tạo service/firewall.' }
$binary = '"' + (Join-Path $proxy 'caddy.exe') + '" run --config "' + (Join-Path $proxy 'Caddyfile') + '" --adapter caddyfile'
Invoke-Sc -Arguments @('create','ANTC-Staging-Proxy','binPath=',$binary,'start=','auto','obj=','NT AUTHORITY\LocalService')
Start-Service 'ANTC-Staging-Proxy'
New-NetFirewallRule -Name 'ANTC-Staging-HTTPS' -DisplayName 'ANTC staging HTTPS (nội bộ)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Domain,Private -RemoteAddress $AllowedClientNetworks | Out-Null
New-NetFirewallRule -Name 'ANTC-Staging-HTTP-Redirect' -DisplayName 'ANTC staging HTTP redirect (nội bộ)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Profile Domain,Private -RemoteAddress $AllowedClientNetworks | Out-Null
Write-Host "Proxy đã cài. Cần DNS nội bộ trỏ $HostName về IP máy này và phân phối root.crt của Caddy cho máy người xem."
Write-Host ('Chứng thư gốc công khai (không phải private key): ' + (Join-Path $proxy 'data/pki/authorities/local/root.crt'))
