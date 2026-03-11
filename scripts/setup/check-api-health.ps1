[CmdletBinding()]
param(
  [int]$PreferredPort = 8000,
  [int]$FallbackPort = 18000
)

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-SetupRepoRoot
$apiDir = Join-Path $repoRoot 'apps\api'
$pythonPath = Join-Path $apiDir '.venv\Scripts\python.exe'

if (-not (Test-Path $pythonPath)) {
  Fail-Setup "The API virtualenv was not found. Run setup-api.ps1 or uv sync first."
}

$portsToTry = @($PreferredPort, $FallbackPort) | Select-Object -Unique
$lastErrorOutput = $null

foreach ($port in $portsToTry) {
  Write-SetupStep "Checking API health on port $port"

  $stdoutLog = Join-Path $env:TEMP "rockask-api-$port.stdout.log"
  $stderrLog = Join-Path $env:TEMP "rockask-api-$port.stderr.log"
  Remove-Item $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue

  $proc = Start-Process -FilePath $pythonPath -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$port" -WorkingDirectory $apiDir -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru

  try {
    $response = $null
    for ($i = 0; $i -lt 20; $i++) {
      Start-Sleep -Seconds 2
      try {
        $response = Invoke-RestMethod -Uri "$(Get-ApiBaseUrl -Port $port)/api/v1/health" -Method Get -TimeoutSec 5
        break
      }
      catch {
        if ($proc.HasExited) {
          break
        }
      }
    }

    if ($response) {
      Write-SetupInfo "API health OK on port $port"
      return [pscustomobject]@{
        Port = $port
        Url = (Get-ApiBaseUrl -Port $port)
        Health = $response
      }
    }

    if (Test-Path $stderrLog) {
      $lastErrorOutput = Get-Content $stderrLog -Raw
    }
  }
  finally {
    if ($proc -and -not $proc.HasExited) {
      Stop-Process -Id $proc.Id -Force
    }
  }
}

if ($lastErrorOutput) {
  Fail-Setup "API health check failed. Last error:`n$lastErrorOutput"
}

Fail-Setup "API health check failed on all candidate ports."