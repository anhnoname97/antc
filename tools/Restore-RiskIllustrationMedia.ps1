param(
    [string]$AppRoot = (Join-Path $PSScriptRoot '../src/ANTC.Portal.App/Umbraco.Web.UI')
)

$ErrorActionPreference = 'Stop'
$resolvedApp = (Resolve-Path -LiteralPath $AppRoot).Path
$webRoot = Join-Path $resolvedApp 'wwwroot'
$mediaRoot = [IO.Path]::GetFullPath((Join-Path $webRoot 'media'))
$mediaPrefix = $mediaRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$mediaExport = Join-Path $resolvedApp 'uSync/v18/Media'
$samples = @(
    @{ Key = '960e0d43-6428-4126-97cd-1021d38ad201'; File = 'lua-dao.jpg' },
    @{ Key = '1fb2df3a-1eb2-4726-a87d-bb1a0b967f46'; File = 'vay-va-no.jpg' },
    @{ Key = 'ca67ac2b-43d6-4bbf-bceb-de7c9a9453e9'; File = 'dau-tu.jpg' },
    @{ Key = '48ed79c4-4a5a-48c2-890f-d12f3b68dbbb'; File = 'du-lieu-ca-nhan.jpg' },
    @{ Key = '141709a0-916f-4e22-aada-a08b81229e5c'; File = 'bao-hiem-va-tiet-kiem.jpg' }
)
$exports = @(Get-ChildItem -LiteralPath $mediaExport -Filter '*.config' | ForEach-Object {
    [xml]$document = Get-Content -LiteralPath $_.FullName -Encoding UTF8 -Raw
    $document
})

# Restore only the five supplied mockup samples, never replace an existing media file.
foreach ($sample in $samples) {
    $matches = @($exports | Where-Object { $_.Media.Key -eq $sample.Key })
    if ($matches.Count -ne 1) { throw "Expected one media export for $($sample.Key)" }
    $raw = $matches[0].Media.Properties.umbracoFile.InnerText
    $mediaUrl = if ($raw.TrimStart().StartsWith('{')) { ($raw | ConvertFrom-Json).src } else { $raw }
    if (!$mediaUrl.StartsWith('/media/') -or $mediaUrl.Contains('?') -or $mediaUrl.Contains('#')) {
        throw "Unsupported local media path for $($sample.Key)"
    }
    $target = [IO.Path]::GetFullPath((Join-Path $webRoot $mediaUrl.TrimStart('/')))
    if (!$target.StartsWith($mediaPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Media path escapes the intended media directory: $($sample.Key)"
    }
    $source = Join-Path $webRoot ('assets/images/risk-v2/' + $sample.File)
    if (!(Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing source image: $source" }
    if (Test-Path -LiteralPath $target) {
        Write-Output "Kept existing media: $($sample.File)"
        continue
    }
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
    [IO.File]::Copy($source, $target, $false)
    Write-Output "Restored missing media: $($sample.File)"
}
