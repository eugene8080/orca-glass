# Hidden Task Scheduler entrypoint; keep logs outside source control.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$localDirectory = Join-Path $repoRoot '.local'
$null = New-Item -ItemType Directory -Path $localDirectory -Force
$lock = [Threading.Mutex]::new($false, 'Local\OrcaGlassStartup')
$acquired = $false
try {
    try { $acquired = $lock.WaitOne(0) }
    catch [Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { exit 0 }
    # Do not start a competing server if the manually launched bridge is running.
    $listener = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        Add-Content (Join-Path $localDirectory 'startup.log') "$(Get-Date -Format o) Port8787 already occupied; startup skipped."
        exit 0
    }
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    Set-Location -LiteralPath $repoRoot
    $env:HOST = '127.0.0.1'
    $env:PORT = '8787'
    Add-Content (Join-Path $localDirectory 'startup.log') "$(Get-Date -Format o) Starting Orca Glass."
    $process = Start-Process -FilePath $nodePath -ArgumentList 'scripts/start.mjs' `
        -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $localDirectory 'custom-output.log') `
        -RedirectStandardError (Join-Path $localDirectory 'custom-error.log')
    Set-Content (Join-Path $localDirectory 'custom.pid') $process.Id
    $process.WaitForExit()
    Add-Content (Join-Path $localDirectory 'startup.log') "$(Get-Date -Format o) Supervisor exited ($($process.ExitCode))."
    # Even an unexpected clean exit should trigger Task Scheduler recovery.
    exit 1
} catch {
    Add-Content (Join-Path $localDirectory 'startup.log') "$(Get-Date -Format o) $($_.Exception.Message)"
    exit 1
} finally {
    if ($acquired) { $lock.ReleaseMutex() }
    $lock.Dispose()
}
