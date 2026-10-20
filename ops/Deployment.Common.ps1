Set-StrictMode -Version Latest

function Get-InstallPath([string]$Root) {
    $full = [IO.Path]::GetFullPath($Root).TrimEnd('\')
    if ($full -eq [IO.Path]::GetPathRoot($full).TrimEnd('\') -or $full -eq $env:USERPROFILE -or $full -eq $env:WINDIR) {
        throw 'InstallRoot phải là thư mục riêng của ứng dụng.'
    }
    return $full
}
function Assert-Release([string]$Path) {
    $root = [IO.Path]::GetFullPath($Path)
    $version = Get-Content -LiteralPath (Join-Path $root 'version.json') -Raw | ConvertFrom-Json
    if ($version.releaseId -notmatch '^[a-zA-Z0-9-]{1,100}$' -or $version.configuration -ne 'Release' -or !$version.selfContained -or $version.runtime -notin @('win-x64','win-arm64')) {
        throw 'Thông tin phiên bản phát hành không hợp lệ.'
    }
    $manifest = @(Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json)
    $listed = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($item in $manifest) {
        if ($item.path -match '^App_Data/|^umbraco/(Data|Logs)/|^wwwroot/media/|\.db($|-wal$|-shm$)|appsettings\.Local' -or
            [IO.Path]::IsPathRooted($item.path) -or $item.path -match '(^|[/\\])\.\.([/\\]|$)') { throw 'Manifest chứa đường dẫn không hợp lệ.' }
        $file = [IO.Path]::GetFullPath((Join-Path $root $item.path))
        if (!$file.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or
            !(Test-Path -LiteralPath $file -PathType Leaf) -or
            (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $item.sha256) { throw 'Kiểm tra SHA-256 gói phát hành thất bại.' }
        if (!$listed.Add($item.path.Replace('\','/'))) { throw 'Manifest bị lặp đường dẫn.' }
    }
    foreach ($file in Get-ChildItem -LiteralPath $root -Recurse -Force) {
        if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Gói phát hành không được chứa symlink/junction.' }
        $relative = [IO.Path]::GetRelativePath($root,$file.FullName).Replace('\','/')
        if (!$file.PSIsContainer -and $relative -ne 'manifest.json' -and !$listed.Contains($relative)) { throw 'Gói có tệp ngoài manifest.' }
    }
    foreach ($required in @('Umbraco.Web.UI.exe','version.json','Views','uSync/v18/ContentTypes','wwwroot')) {
        if (!(Test-Path -LiteralPath (Join-Path $root $required))) { throw "Thiếu $required" }
    }
    return $version
}
function Read-ServiceEnvironment([string]$File) {
    $values = Get-Content -LiteralPath $File -Raw | ConvertFrom-Json -AsHashtable
    foreach ($required in @('Contest__IpHashSalt','Administration__AllowedNetworks__0')) {
        if (!$values.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($values[$required]) -or $values[$required] -match '__REPLACE') { throw "Thiếu cấu hình môi trường: $required" }
    }
    if ([string]$values.Contest__IpHashSalt -match '[\r\n]' -or ([string]$values.Contest__IpHashSalt).Length -lt 32) { throw 'Muối băm phải ít nhất 32 ký tự, không chứa xuống dòng.' }
    foreach ($key in $values.Keys) {
        if ($key -notmatch '^[A-Za-z_][A-Za-z0-9_]*$' -or $values[$key] -isnot [string] -or $values[$key] -match '[\r\n]|__REPLACE') { throw 'Tệp môi trường không hợp lệ hoặc còn giá trị mẫu chưa thay.' }
        if ($key.StartsWith('Administration__AllowedNetworks__')) {
            if ($values[$key].Contains('/')) { $null = [System.Net.IPNetwork]::Parse($values[$key]) }
            else { $null = [System.Net.IPAddress]::Parse($values[$key]) }
        }
    }
    return $values
}
function Set-ServiceEnvironment([string]$Name, [hashtable]$Values) {
    $key = "HKLM:\SYSTEM\CurrentControlSet\Services\$Name"
    [string[]]$lines = @($Values.GetEnumerator() | ForEach-Object { $_.Key + '=' + $_.Value })
    New-ItemProperty -LiteralPath $key -Name Environment -Value $lines -PropertyType MultiString -Force | Out-Null
}
function Invoke-Sc([string[]]$Arguments) {
    & sc.exe @Arguments | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Thao tác Windows Service thất bại.' }
}
function Wait-Healthy([string]$Url, [string]$ReleaseId, [int]$Seconds) {
    $watch = [Diagnostics.Stopwatch]::StartNew()
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -MaximumRedirection 0
            if ($response.StatusCode -eq 200 -and $response.Headers['X-ANTC-Release'] -eq $ReleaseId -and
                ($response.Content | ConvertFrom-Json).status -eq 'ok') { return }
        } catch { }
        Start-Sleep -Seconds 1
    } while ($watch.Elapsed.TotalSeconds -lt $Seconds)
    throw 'HEALTH_CHECK_FAILED: bản mới chưa sẵn sàng trong thời gian chờ.'
}
function Protect-DeploymentDirectory([string]$Path) {
    & icacls.exe $Path /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-19:(OI)(CI)M' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Không đặt được quyền thư mục triển khai.' }
}
