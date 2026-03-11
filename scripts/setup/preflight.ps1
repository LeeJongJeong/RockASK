[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-SetupRepoRoot

Write-SetupStep "Checking Docker engine"
if (-not (Test-SetupCommand "docker")) {
  Fail-Setup "The docker command was not found. Install Docker Desktop first."
}
docker info | Out-Null
Write-SetupInfo "Docker engine OK"

Write-SetupStep "Checking uv"
if (-not (Test-SetupCommand "uv")) {
  Fail-Setup "The uv command was not found."
}
$uvVersion = (& uv --version).Trim()
Write-SetupInfo "uv: $uvVersion"

Write-SetupStep "Checking Python 3.13"
$pythonPath = Get-Python313Path
Write-SetupInfo "Python 3.13: $pythonPath"

Write-SetupStep "Checking Node.js"
if (-not (Test-SetupCommand "node")) {
  Fail-Setup "The node command was not found."
}
$nodeVersion = (& node --version).Trim()
Write-SetupInfo "Node.js: $nodeVersion"

Write-SetupStep "Checking pnpm/corepack availability"
$pnpmRunner = Get-PnpmRunner
Write-SetupInfo "Package runner: $pnpmRunner"

Write-SetupStep "Checking setup templates"
foreach ($requiredPath in @(
  (Join-Path $repoRoot '.env.docker.example'),
  (Join-Path $repoRoot 'apps\api\.env.example'),
  (Join-Path $repoRoot 'apps\web\.env.example')
)) {
  if (-not (Test-Path $requiredPath)) {
    Fail-Setup "Required file is missing: $requiredPath"
  }
}

docker compose --env-file .env.docker.example config | Out-Null
Write-SetupInfo "docker-compose.yml OK"

foreach ($port in @(5432, 8000)) {
  if (Test-LocalPortInUse $port) {
    Write-SetupWarn "Local port $port is already in use. You may need a fallback port."
  }
}

[pscustomobject]@{
  RepoRoot = $repoRoot
  PythonPath = $pythonPath
  NodeVersion = $nodeVersion
  UvVersion = $uvVersion
  PackageRunner = $pnpmRunner
}