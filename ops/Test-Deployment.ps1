#Requires -Version 7.2
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Deployment.Common.ps1')
function Expect-Failure([scriptblock]$Action) {
    $failed = $false
    try { & $Action | Out-Null } catch { $failed = $true }
    if (!$failed) { throw 'Expected validation to reject the fixture.' }
}
foreach ($script in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1') {
    $tokens = $null; $errors = $null
    $null = [Management.Automation.Language.Parser]::ParseFile($script.FullName,[ref]$tokens,[ref]$errors)
    if ($errors.Count -gt 0) { throw "Syntax error: $($script.Name)" }
}
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('antc-deployment-fixture-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture | Out-Null
try {
    foreach ($folder in @('Views','uSync/v18/ContentTypes','wwwroot')) { New-Item -ItemType Directory -Path (Join-Path $fixture $folder) -Force | Out-Null }
    'synthetic file - never executed' | Set-Content -LiteralPath (Join-Path $fixture 'Umbraco.Web.UI.exe')
    @{ releaseId='test-release'; configuration='Release'; selfContained=$true; runtime='win-x64' } |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture 'version.json')
    $manifest = @(Get-ChildItem -LiteralPath $fixture -File | ForEach-Object {
        @{path=$_.Name; sha256=(Get-FileHash -LiteralPath $_.FullName).Hash}
    })
    ConvertTo-Json -InputObject $manifest | Set-Content -LiteralPath (Join-Path $fixture 'manifest.json')
    if ((Assert-Release $fixture).releaseId -ne 'test-release') { throw 'Valid fixture rejected.' }
    'tamper' | Add-Content -LiteralPath (Join-Path $fixture 'Umbraco.Web.UI.exe')
    Expect-Failure { Assert-Release $fixture }
    'synthetic file - never executed' | Set-Content -LiteralPath (Join-Path $fixture 'Umbraco.Web.UI.exe')
    'private data' | Set-Content -LiteralPath (Join-Path $fixture 'private.db')
    Expect-Failure { Assert-Release $fixture }
    $environment = Join-Path $fixture 'test.environment.json'
    @{Contest__IpHashSalt=('x' * 32); Administration__AllowedNetworks__0='10.20.0.0/16'} | ConvertTo-Json | Set-Content -LiteralPath $environment
    $null = Read-ServiceEnvironment $environment
    @{Contest__IpHashSalt='__REPLACE_SECRET__'; Administration__AllowedNetworks__0='10.20.0.0/16'} | ConvertTo-Json | Set-Content -LiteralPath $environment
    Expect-Failure { Read-ServiceEnvironment $environment }
    Expect-Failure { Get-InstallPath ([IO.Path]::GetPathRoot($fixture)) }
    Write-Host 'Deployment script checks passed: syntax, SHA-256, extra data file, environment placeholders, broad target rejection.'
}
finally {
    $absolute = [IO.Path]::GetFullPath($fixture)
    if ([IO.Path]::GetDirectoryName($absolute).TrimEnd('\') -ne [IO.Path]::GetTempPath().TrimEnd('\') -or
        [IO.Path]::GetFileName($absolute) -notlike 'antc-deployment-fixture-*') { throw 'Unsafe fixture cleanup target.' }
    [IO.Directory]::Delete($absolute, $true)
}
