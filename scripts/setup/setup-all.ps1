[CmdletBinding()]
param(
  [switch]$SkipWeb
)

. (Join-Path $PSScriptRoot "common.ps1")

Write-SetupStep "Running preflight"
$null = & (Join-Path $PSScriptRoot 'preflight.ps1')

Write-SetupStep "Running API setup"
$apiSetup = & (Join-Path $PSScriptRoot 'setup-api.ps1')

Write-SetupStep "Running API health check"
$apiHealth = & (Join-Path $PSScriptRoot 'check-api-health.ps1')

if (-not $SkipWeb) {
  Write-SetupStep "Running web setup"
  $null = & (Join-Path $PSScriptRoot 'setup-web.ps1') -ApiBaseUrl $apiHealth.Url
}

[pscustomobject]@{
  PythonPath = $apiSetup.PythonPath
  AlembicVersion = $apiSetup.AlembicVersion
  ApiPort = $apiHealth.Port
  ApiBaseUrl = $apiHealth.Url
  WebPrepared = (-not $SkipWeb)
}