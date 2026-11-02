$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$localDirectory = Join-Path $repoRoot '.local'
$null = New-Item -ItemType Directory -Path $localDirectory -Force
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$simulator = Join-Path $repoRoot 'app/node_modules/@evenrealities/sim-win32-x64/bin/evenhub-simulator.exe'
if (-not (Test-Path -LiteralPath $simulator)) { throw 'Install the Windows x64 simulator with npm --prefix app ci first.' }
if (-not (Get-NetTCPConnection -LocalPort 8791 -State Listen -ErrorAction SilentlyContinue)) {
    $fixture = Start-Process -FilePath $nodePath -ArgumentList 'scripts/simulator-fixture.mjs' `
        -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $localDirectory 'sim-fixture-output.log') `
        -RedirectStandardError (Join-Path $localDirectory 'sim-fixture-error.log')
    Set-Content (Join-Path $localDirectory 'simulator-fixture.pid') $fixture.Id
    Start-Sleep -Seconds 2
}
if (Get-NetTCPConnection -LocalPort 9898 -State Listen -ErrorAction SilentlyContinue) {
    throw 'A simulator automation server already uses port9898. Keep that instance or close it first.'
}
$process = Start-Process -FilePath $simulator -ArgumentList 'http://127.0.0.1:8791/?code=demo&lang=en', '--automation-port', '9898' `
    -WorkingDirectory $localDirectory -WindowStyle Normal -PassThru `
    -RedirectStandardOutput (Join-Path $localDirectory 'sim-output.log') `
    -RedirectStandardError (Join-Path $localDirectory 'sim-error.log')
Set-Content (Join-Path $localDirectory 'simulator.pid') $process.Id
Write-Output 'Simulator opened with isolated fake sessions. Automation: http://127.0.0.1:9898'
