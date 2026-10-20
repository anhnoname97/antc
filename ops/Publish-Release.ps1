#Requires -Version 7.2
[CmdletBinding()]
param(
    [ValidateSet('win-x64','win-arm64')][string]$Runtime = 'win-x64',
    [string]$OutputDirectory,
    [switch]$RequireClean,
    [switch]$Deploy,
    [string]$EnvironmentFile,
    [string]$InstallRoot = 'C:\AntcStaging'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repository = Split-Path $PSScriptRoot -Parent
$project = Join-Path $repository 'src/ANTC.Portal.App/Umbraco.Web.UI/Umbraco.Web.UI.csproj'
$commit = (& git -C $repository rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Không đọc được commit Git.' }
$dirty = [bool](& git -C $repository status --porcelain)
if ($RequireClean -and $dirty) { throw 'Worktree chưa sạch; hãy commit trước khi phát hành.' }
$built = [DateTimeOffset]::UtcNow
$releaseId = $built.ToString('yyyyMMddHHmmssfff') + '-' + $commit.Substring(0,12) + $(if ($dirty) { '-dirty' })
if (!$OutputDirectory) { $OutputDirectory = Join-Path $repository "artifacts/releases/$releaseId" }
$output = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $output) { throw 'Thư mục phát hành đã tồn tại. Chọn thư mục mới để tránh ghi đè.' }
New-Item -ItemType Directory -Path $output | Out-Null
$timer = [Diagnostics.Stopwatch]::StartNew()
& dotnet publish $project -c Release -r $Runtime --self-contained true -o $output -p:PublishSingleFile=false -p:PublishTrimmed=false -p:PublishReadyToRun=false
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish thất bại; không triển khai gói này.' }
$allFiles = @(Get-ChildItem -LiteralPath $output -File -Recurse)
foreach ($file in $allFiles) {
    $relative = [IO.Path]::GetRelativePath($output, $file.FullName).Replace('\','/')
    if ($relative -match '^App_Data/|^umbraco/(Data|Logs)/|^wwwroot/media/|\.db($|-wal$|-shm$)|appsettings\.Local') {
        throw "Gói publish chứa dữ liệu/cấu hình riêng: $relative. Không triển khai gói này."
    }
}
foreach ($required in @('Umbraco.Web.UI.exe','Umbraco.Web.UI.runtimeconfig.json','Views','uSync/v18/ContentTypes','wwwroot')) {
    if (!(Test-Path -LiteralPath (Join-Path $output $required))) { throw "Gói thiếu thành phần bắt buộc: $required" }
}
@{ releaseId=$releaseId; commit=$commit; dirty=$dirty; builtAtUtc=$built.ToString('O'); runtime=$Runtime; configuration='Release'; selfContained=$true } |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $output 'version.json') -Encoding utf8NoBOM
$manifest = @(Get-ChildItem -LiteralPath $output -File -Recurse | ForEach-Object {
    @{ path=[IO.Path]::GetRelativePath($output,$_.FullName).Replace('\','/'); sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
})
ConvertTo-Json -InputObject $manifest -Depth 4 | Set-Content -LiteralPath (Join-Path $output 'manifest.json') -Encoding utf8NoBOM
Write-Host "Phát hành xong: $output ($([math]::Round($timer.Elapsed.TotalSeconds,1)) giây)."
if ($Deploy) {
    if (!$EnvironmentFile) { throw 'Cần EnvironmentFile khi dùng -Deploy.' }
    & (Join-Path $PSScriptRoot 'Update-Staging.ps1') -ReleasePath $output -InstallRoot $InstallRoot -EnvironmentFile $EnvironmentFile
}
