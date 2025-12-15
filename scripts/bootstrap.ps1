<#
Bootstrap the entire kube-dev-sandbox stack after a reboot.

Usage examples:
  ./scripts/bootstrap.ps1
  ./scripts/bootstrap.ps1 -SkipBuild
  ./scripts/bootstrap.ps1 -AwsProfile tjprohammer -AwsRegion us-west-2

The script performs the following:
  1. Ensures minikube, kubectl, make, and (optionally) aws/python are available.
  2. Starts minikube if it is not already running.
  3. Applies the Contour Gateway quickstart manifest.
  4. Runs `make up` (unless -SkipBuild is supplied) to rebuild/load images and reapply manifests.
  5. Prompts the user to ensure `minikube tunnel` is running in an elevated shell.
  6. Starts a background `kubectl port-forward` for Postgres.
  7. Runs the S3 → Postgres pin migration script using the supplied AWS profile.

Press Ctrl+C at any time to abort. Background port-forward jobs started by this script can be stopped with `Stop-Job -Name bootstrap-postgres`.
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipMigration,
    [string]$AwsProfile = "tjprohammer",
    [string]$AwsRegion = "us-west-2"
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

function Require-Command {
    param([Parameter(Mandatory=$true)][string]$Name)
    if (-not (Get-Command -Name $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH. Install it and rerun the bootstrap script."
    }
}

function Invoke-Step {
    param(
        [Parameter(Mandatory=$true)][string]$Message,
        [Parameter(Mandatory=$true)][scriptblock]$ScriptBlock
    )
    Write-Host "[bootstrap] $Message" -ForegroundColor Cyan
    & $ScriptBlock
}

function Get-MinikubeStatus {
    try {
        $json = minikube status --output json | ConvertFrom-Json
        return $json
    } catch {
        return $null
    }
}

function Test-MinikubeTunnel {
    try {
        $ip = kubectl get svc envoy -n projectcontour -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
        return $ip -and $ip.Trim() -ne ""
    } catch {
        return $false
    }
}

Require-Command -Name "minikube"
Require-Command -Name "kubectl"
Require-Command -Name "make"
Require-Command -Name "aws"

$pythonPath = Join-Path (Resolve-Path ".") ".venv\\Scripts\\python.exe"
if (-not (Test-Path $pythonPath)) {
    try {
        $pythonPath = (Get-Command python -ErrorAction Stop).Source
    } catch {
        throw "Unable to find python. Activate .venv or install Python before running the bootstrap script."
    }
}

Invoke-Step "Ensuring minikube is running" {
    $status = Get-MinikubeStatus
    if (-not $status -or $status.Host -ne "Running") {
        minikube start
    } else {
        Write-Host "minikube is already running" -ForegroundColor DarkGray
    }
}

Invoke-Step "Applying Contour Gateway quickstart" {
    kubectl apply -f https://projectcontour.io/quickstart/contour-gateway.yaml | Out-Default
}

if (-not $SkipBuild) {
    Invoke-Step "Building images and applying manifests (make up)" {
        make up | Out-Default
    }
} else {
    Write-Host "[bootstrap] Skipping make up per -SkipBuild flag" -ForegroundColor Yellow
}

if (-not (Test-MinikubeTunnel)) {
    Write-Warning "minikube tunnel does not appear to be running. Open an elevated PowerShell window and execute 'minikube tunnel', then press ENTER to continue."
    Read-Host "Press ENTER once 'minikube tunnel' is active"
} else {
    Write-Host "[bootstrap] minikube tunnel already active" -ForegroundColor DarkGray
}

$postgresJob = Get-Job -Name "bootstrap-postgres" -ErrorAction SilentlyContinue
if (-not $postgresJob) {
    Invoke-Step "Starting Postgres port-forward (background job 'bootstrap-postgres')" {
        Start-Job -Name "bootstrap-postgres" -ScriptBlock {
            kubectl port-forward svc/postgresql -n sandbox-app 5432:5432
        } | Out-Null
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "[bootstrap] Existing Postgres port-forward job detected" -ForegroundColor DarkGray
}

if (-not $SkipMigration) {
    Invoke-Step "Migrating pins from S3 into Postgres" {
        $env:DATABASE_URL = "postgresql+psycopg://devuser:devpassword@localhost:5432/locations"
        & $pythonPath services/locations/migrate_from_s3.py --profile $AwsProfile --region $AwsRegion --truncate | Out-Default
    }
} else {
    Write-Host "[bootstrap] Skipping pin migration per -SkipMigration flag" -ForegroundColor Yellow
}

Write-Host "Bootstrap complete. Active jobs:" -ForegroundColor Green
Get-Job -Name "bootstrap-postgres" -ErrorAction SilentlyContinue | Format-Table Id, Name, State
Write-Host "Use 'Stop-Job -Name bootstrap-postgres' to stop the port-forward when you are done." -ForegroundColor DarkGray
