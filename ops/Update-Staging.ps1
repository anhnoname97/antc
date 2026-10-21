#Requires -Version 7.2
#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ReleasePath,
    [Parameter(Mandatory)][string]$EnvironmentFile,
    [string]$InstallRoot = 'C:\AntcStaging',
    [ValidatePattern('^ANTC-[a-zA-Z0-9-]+$')][string]$ServiceName = 'ANTC-Staging',
    [ValidateRange(1024,65535)][int]$Port = 11010,
    [ValidateRange(10,240)][int]$HealthTimeoutSeconds = 180,
    [switch]$Initialize,
    [switch]$SeedContent
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Deployment.Common.ps1')
if (!$IsWindows) { throw 'Script cập nhật dành cho Windows.' }
if ($SeedContent -and !$Initialize) { throw '-SeedContent chỉ được dùng khi -Initialize môi trường mới.' }
$timer = [Diagnostics.Stopwatch]::StartNew()
$root = Get-InstallPath $InstallRoot
$source = (Resolve-Path -LiteralPath $ReleasePath).Path
$version = Assert-Release $source
if ($version.runtime -ne ('win-' + [Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant())) { throw 'Gói phát hành không khớp kiến trúc Windows của máy đích.' }
$environment = Read-ServiceEnvironment $EnvironmentFile
$release = Join-Path $root ('releases/' + $version.releaseId)
if (Test-Path -LiteralPath $release) { throw 'Phiên bản đã có trên máy; không ghi đè release cũ.' }
if (Test-Path -LiteralPath $root) {
    if ((Get-Item -LiteralPath $root).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'InstallRoot không được là junction.' }
} else { New-Item -ItemType Directory -Path $root | Out-Null }
Protect-DeploymentDirectory $root
$lock = [IO.File]::Open((Join-Path $root '.deployment.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$previousPath = $null; $previousEnvironment = $null; $stopped = $false; $switched = $false; $backupComplete = $false
$backup = Join-Path $root ('backups/' + [DateTimeOffset]::UtcNow.ToString('yyyyMMddHHmmssfff'))
$gate = Join-Path $root 'shared/Deployment/offline.flag'
$recordPath = Join-Path $root 'last-deployment.json'
$previousRecord = if (Test-Path -LiteralPath $recordPath) { Get-Content -LiteralPath $recordPath -Raw } else { $null }
try {
    $shared = Join-Path $root 'shared'
    foreach ($folder in @('releases','backups','shared/App_Data','shared/UmbracoData','shared/media','shared/Logs','shared/Keys','shared/Deployment')) {
        $directory = Join-Path $root $folder
        if ((Test-Path -LiteralPath $directory) -and ((Get-Item -LiteralPath $directory).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Thư mục dữ liệu/triển khai không được là junction.' }
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    $appDb = Join-Path $shared 'App_Data/app.sqlite.db'
    $cmsDb = Join-Path $shared 'UmbracoData/Umbraco.sqlite.db'
    $exists = @((Test-Path -LiteralPath $appDb), (Test-Path -LiteralPath $cmsDb))
    if (($exists -contains $false) -and (!$Initialize -or ($exists -contains $true))) { throw 'Cần đủ hai CSDL; chỉ dùng -Initialize với môi trường mới hoàn toàn.' }
    if ($Initialize -and ($exists -contains $true)) { throw '-Initialize không được dùng với dữ liệu đang có.' }
    if ($Initialize -and (!$environment.ContainsKey('Umbraco__CMS__Unattended__UnattendedUserPassword') -or
        !$environment.ContainsKey('Umbraco__CMS__Unattended__UnattendedUserEmail'))) { throw 'Khởi tạo mới cần email và mật khẩu quản trị qua biến môi trường.' }
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (!$service -and !$Initialize) { throw 'Dịch vụ chưa có. Khởi tạo một lần bằng -Initialize.' }
    if ($service) {
        $key = "HKLM:\SYSTEM\CurrentControlSet\Services\$ServiceName"
        $previousPath = (Get-ItemProperty -LiteralPath $key -Name ImagePath).ImagePath
        if (!$previousPath.Contains((Join-Path $root 'releases'), [StringComparison]::OrdinalIgnoreCase)) { throw 'Dịch vụ hiện tại không thuộc InstallRoot đã chỉ định.' }
        $oldEnvironmentProperty = Get-ItemProperty -LiteralPath $key -Name Environment -ErrorAction SilentlyContinue
        if ($oldEnvironmentProperty) { $previousEnvironment = $oldEnvironmentProperty.Environment }
    }
    # Stage the clean artifact before downtime; never copy runtime data from a package.
    New-Item -ItemType Directory -Path $release | Out-Null
    Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $release -Recurse
    $null = Assert-Release $release
    foreach ($pair in @(@('App_Data','App_Data'), @('umbraco/Data','UmbracoData'), @('umbraco/Logs','Logs'), @('wwwroot/media','media'))) {
        $link = Join-Path $release $pair[0]
        if (Test-Path -LiteralPath $link) {
            if (@(Get-ChildItem -LiteralPath $link -Force).Count -gt 0) { throw 'Gói chứa thư mục dữ liệu không rỗng.' }
            Remove-Item -LiteralPath $link # Empty directory only; never recursive.
        }
        New-Item -ItemType Directory -Path (Split-Path $link -Parent) -Force | Out-Null
        New-Item -ItemType Junction -Path $link -Target (Join-Path $shared $pair[1]) | Out-Null
    }
    New-Item -ItemType File -Path $gate -Force | Out-Null
    if ($service) {
        Stop-Service -Name $ServiceName
        (Get-Service $ServiceName).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    }
    $stopped = $true
    if (!$Initialize) {
        & (Join-Path $release 'Umbraco.Web.UI.exe') --deployment-backup $appDb $cmsDb $backup
        if ($LASTEXITCODE -ne 0) { throw 'Sao lưu SQLite thất bại; không thay phiên bản.' }
        $backupComplete = $true
    }
    $environment.ASPNETCORE_ENVIRONMENT = 'Staging'
    $environment.DOTNET_ENVIRONMENT = 'Staging'
    $environment.ASPNETCORE_URLS = "http://127.0.0.1:$Port"
    $environment.ConnectionStrings__appDb = "Data Source=$appDb"
    $environment.ConnectionStrings__umbracoDbDSN = "Data Source=$cmsDb;Foreign Keys=True;Pooling=True"
    $environment.ConnectionStrings__umbracoDbDSN_ProviderName = 'Microsoft.Data.Sqlite'
    $environment.Deployment__ReleaseId = $version.releaseId
    $environment.Deployment__ImportStructure = 'true'
    $environment.Deployment__BootstrapContent = $(if ($Initialize -and $SeedContent) { 'true' } else { 'false' })
    $environment.Deployment__StatePath = Join-Path $shared 'Deployment'
    $environment.Deployment__DataProtectionKeysPath = Join-Path $shared 'Keys'
    $environment.Deployment__TrafficGatePath = $gate
    $environment.Umbraco__CMS__Logging__Directory = Join-Path $shared 'Logs'
    $environment.Umbraco__CMS__Unattended__InstallUnattended = $(if ($Initialize) { 'true' } else { 'false' })
    $binary = '"' + (Join-Path $release 'Umbraco.Web.UI.exe') + '" --contentRoot "' + $release + '"'
    if (!$service) { Invoke-Sc -Arguments @('create',$ServiceName,'binPath=',$binary,'start=','auto','obj=','NT AUTHORITY\LocalService') }
    else { Invoke-Sc -Arguments @('config',$ServiceName,'binPath=',$binary) }
    $switched = $true
    Set-ServiceEnvironment $ServiceName $environment
    Start-Service -Name $ServiceName
    Wait-Healthy "http://127.0.0.1:$Port/healthz" $version.releaseId $HealthTimeoutSeconds
    # Do not leave bootstrap credentials/automatic installation enabled after the first successful boot.
    $environment.Umbraco__CMS__Unattended__InstallUnattended = 'false'
    $environment.Deployment__BootstrapContent = 'false'
    $environment.Remove('Umbraco__CMS__Unattended__UnattendedUserPassword')
    $environment.Remove('Umbraco__CMS__Unattended__UnattendedUserEmail')
    Set-ServiceEnvironment $ServiceName $environment
    @{ releaseId=$version.releaseId; completedAtUtc=[DateTimeOffset]::UtcNow.ToString('O'); seconds=[math]::Round($timer.Elapsed.TotalSeconds,1); backup=$(if ($backupComplete) { $backup } else { $null }) } |
        ConvertTo-Json | Set-Content -LiteralPath $recordPath -Encoding utf8NoBOM
    Remove-Item -LiteralPath $gate
    Write-Host "Đã cập nhật $($version.releaseId), /healthz OK, $([math]::Round($timer.Elapsed.TotalSeconds,1)) giây."
    if ($timer.Elapsed.TotalSeconds -ge 300) { Write-Warning 'Thời gian thực tế vượt 5 phút; kiểm tra dung lượng CSDL/đĩa và thời gian nhập uSync.' }
}
catch {
    $failure = $_
    if ($stopped -and $previousPath) {
        Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
        (Get-Service $ServiceName).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
        if ($switched -and $backupComplete) {
            $failedData = Join-Path $backup 'failed-release-data'
            New-Item -ItemType Directory -Path $failedData | Out-Null
            foreach ($pair in @(@($appDb,'app.sqlite.db'), @($cmsDb,'Umbraco.sqlite.db'))) {
                foreach ($suffix in @('','-wal','-shm')) {
                    $file = $pair[0] + $suffix
                    if (Test-Path -LiteralPath $file) { Move-Item -LiteralPath $file -Destination (Join-Path $failedData ($pair[1]+$suffix)) }
                }
                Copy-Item -LiteralPath (Join-Path $backup $pair[1]) -Destination $pair[0]
            }
        }
        Invoke-Sc -Arguments @('config',$ServiceName,'binPath=',$previousPath)
        if ($null -ne $previousEnvironment) {
            New-ItemProperty -LiteralPath "HKLM:\SYSTEM\CurrentControlSet\Services\$ServiceName" -Name Environment -Value $previousEnvironment -PropertyType MultiString -Force | Out-Null
        } else {
            Remove-ItemProperty -LiteralPath "HKLM:\SYSTEM\CurrentControlSet\Services\$ServiceName" -Name Environment -ErrorAction SilentlyContinue
        }
        if ($null -ne $previousRecord) { $previousRecord | Set-Content -LiteralPath $recordPath -Encoding utf8NoBOM }
        Start-Service -Name $ServiceName
        if ($previousEnvironment) {
            $oldRelease = @($previousEnvironment | Where-Object { $_.StartsWith('Deployment__ReleaseId=') })
            $oldUrl = @($previousEnvironment | Where-Object { $_.StartsWith('ASPNETCORE_URLS=') })
            if ($oldRelease.Count -eq 1 -and $oldUrl.Count -eq 1) {
                Wait-Healthy ($oldUrl[0].Split('=',2)[1] + '/healthz') ($oldRelease[0].Split('=',2)[1]) $HealthTimeoutSeconds
                if (Test-Path -LiteralPath $gate) { Remove-Item -LiteralPath $gate }
            }
        }
        Write-Warning 'Đã khôi phục dịch vụ/bản cũ; dữ liệu của bản lỗi được giữ trong thư mục backup nếu đã chạy migration.'
    } elseif ($switched) { Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue }
    throw $failure
}
finally { $lock.Dispose() }
