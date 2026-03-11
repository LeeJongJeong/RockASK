[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://127.0.0.1:8000",
  [switch]$SkipInstall,
  [switch]$ForceEnv
)

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-SetupRepoRoot
$webDir = Join-Path $repoRoot 'apps\web'
$envTarget = Join-Path $webDir '.env.local'

if ($ForceEnv -or -not (Test-Path $envTarget)) {
  Write-SetupStep "Writing apps/web/.env.local"
  Write-Utf8NoBomFile -Path $envTarget -Content "API_BASE_URL=$ApiBaseUrl`n"
}
else {
  $lines = @()
  $updated = $false

  foreach ($line in Get-Content $envTarget) {
    if ($line -match '^API_BASE_URL=') {
      $lines += "API_BASE_URL=$ApiBaseUrl"
      $updated = $true
    }
    else {
      $lines += $line
    }
  }

  if (-not $updated) {
    $lines += "API_BASE_URL=$ApiBaseUrl"
  }

  Write-SetupStep "Updating API_BASE_URL in apps/web/.env.local"
  Write-Utf8NoBomFile -Path $envTarget -Content (($lines -join "`n") + "`n")
}

if ($SkipInstall) {
  return [pscustomobject]@{
    ApiBaseUrl = $ApiBaseUrl
    EnvFile = $envTarget
    Installed = $false
  }
}

Write-SetupStep "Installing web dependencies"
Invoke-Pnpm -Arguments @('install') -WorkingDirectory $repoRoot

[pscustomobject]@{
  ApiBaseUrl = $ApiBaseUrl
  EnvFile = $envTarget
  Installed = $true
}