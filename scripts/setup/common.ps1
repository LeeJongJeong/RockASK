Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-SetupRepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Write-SetupStep([string]$Message) {
  Write-Host "[setup] $Message" -ForegroundColor Cyan
}

function Write-SetupInfo([string]$Message) {
  Write-Host "[info] $Message" -ForegroundColor DarkGray
}

function Write-SetupWarn([string]$Message) {
  Write-Warning $Message
}

function Fail-Setup([string]$Message) {
  throw $Message
}

function Test-SetupCommand([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Write-Utf8NoBomFile([string]$Path, [string]$Content) {
  $directory = Split-Path -Parent $Path
  if ($directory) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
  }

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Ensure-TemplateFile([string]$TemplatePath, [string]$TargetPath) {
  if (Test-Path $TargetPath) {
    return $false
  }

  Copy-Item $TemplatePath $TargetPath
  return $true
}

function Read-KeyValueFile([string]$Path) {
  $values = @{}
  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed.Split("=", 2)
    if ($parts.Count -eq 2) {
      $values[$parts[0].Trim()] = $parts[1].Trim()
    }
  }

  return $values
}

function Get-ConfigValue($Map, [string]$Key, [string]$DefaultValue) {
  if ($Map.ContainsKey($Key) -and $Map[$Key]) {
    return [string]$Map[$Key]
  }

  return $DefaultValue
}

function Get-Python313Path {
  if (Test-SetupCommand "py") {
    $pyPath = & py -3.13 -c "import sys; print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $pyPath) {
      return $pyPath.Trim()
    }
  }

  if (Test-Path "C:\Python\python.exe") {
    $version = & "C:\Python\python.exe" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
    if ($LASTEXITCODE -eq 0 -and $version.Trim() -eq "3.13") {
      return "C:\Python\python.exe"
    }
  }

  if (Test-SetupCommand "python") {
    $pythonOutput = @(& python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}'); print(sys.executable)" 2>$null)
    if ($LASTEXITCODE -eq 0 -and $pythonOutput.Count -ge 2 -and $pythonOutput[0].Trim() -eq "3.13") {
      return $pythonOutput[1].Trim()
    }
  }

  Fail-Setup "Python 3.13 was not found. Install it so that py -3.13 or C:\\Python\\python.exe works."
}

function Wait-DockerContainerHealthy([string]$ContainerName, [int]$Attempts = 30, [int]$DelaySeconds = 2) {
  for ($i = 0; $i -lt $Attempts; $i++) {
    $status = docker inspect -f '{{.State.Health.Status}}' $ContainerName 2>$null
    if ($LASTEXITCODE -eq 0 -and $status -eq "healthy") {
      return
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  Fail-Setup "Container '$ContainerName' did not become healthy in time."
}

function Test-LocalPortInUse([int]$Port) {
  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
    return $connections.Count -gt 0
  }
  catch {
    return $false
  }
}

function Get-ApiBaseUrl([int]$Port) {
  return "http://127.0.0.1:$Port"
}

function Get-PnpmRunner {
  if (Test-SetupCommand "pnpm") {
    return "pnpm"
  }

  if (Test-SetupCommand "corepack") {
    return "corepack"
  }

  Fail-Setup "Neither pnpm nor corepack is available."
}

function Invoke-Pnpm([string[]]$Arguments, [string]$WorkingDirectory) {
  $runner = Get-PnpmRunner

  Push-Location $WorkingDirectory
  try {
    if ($runner -eq "pnpm") {
      & pnpm @Arguments
    }
    else {
      & corepack pnpm @Arguments
    }

    if ($LASTEXITCODE -ne 0) {
      Fail-Setup "The pnpm command failed."
    }
  }
  finally {
    Pop-Location
  }
}