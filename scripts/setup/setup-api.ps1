[CmdletBinding()]
param(
  [string]$EnvFile = ".env.docker",
  [switch]$SkipDocker,
  [switch]$SkipMigrate
)

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-SetupRepoRoot
$envFilePath = Join-Path $repoRoot $EnvFile
$templatePath = Join-Path $repoRoot ".env.docker.example"
$pythonPath = Get-Python313Path

if (Ensure-TemplateFile -TemplatePath $templatePath -TargetPath $envFilePath) {
  Write-SetupStep "Created $EnvFile from template"
}

$envConfig = Read-KeyValueFile $envFilePath
$dbUser = Get-ConfigValue -Map $envConfig -Key "ROCKASK_DB_USER" -DefaultValue "postgres"
$dbName = Get-ConfigValue -Map $envConfig -Key "ROCKASK_DB_NAME" -DefaultValue "rockask"

Push-Location $repoRoot
try {
  if (-not $SkipDocker) {
    Write-SetupStep "Starting postgres container"
    docker compose --env-file $EnvFile up -d postgres | Out-Null

    Write-SetupStep "Waiting for postgres healthcheck"
    Wait-DockerContainerHealthy -ContainerName "rockask-postgres"
  }

  Write-SetupStep "Syncing API dependencies"
  uv sync --project apps/api --python $pythonPath

  if (-not $SkipMigrate) {
    Write-SetupStep "Applying Alembic migration"
    Push-Location (Join-Path $repoRoot 'apps\api')
    try {
      .\.venv\Scripts\python.exe -m alembic upgrade head
    }
    finally {
      Pop-Location
    }
  }

  $alembicVersion = docker compose --env-file $EnvFile exec -T postgres psql -U $dbUser -d $dbName -t -A -c "SELECT version_num FROM alembic_version;"
  $alembicVersion = $alembicVersion.Trim()
  Write-SetupInfo "Alembic version: $alembicVersion"

  [pscustomobject]@{
    PythonPath = $pythonPath
    DatabaseContainer = "rockask-postgres"
    AlembicVersion = $alembicVersion
  }
}
finally {
  Pop-Location
}