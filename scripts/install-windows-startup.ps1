$ErrorActionPreference = 'Stop'
if ([Environment]::MachineName -ne 'PSCAP11') {
    throw 'This startup registration is intended for PSCAP11.'
}
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$repoRoot = Split-Path $PSScriptRoot -Parent
$pwshPath = (Get-Command pwsh.exe -ErrorAction Stop).Source
$scriptPath = Join-Path $PSScriptRoot 'start-windows.ps1'
# conhost --headless keeps the bridge launcher off the desktop; pwsh -WindowStyle Hidden alone leaves a blank window.
$conhostPath = Join-Path $env:WINDIR 'System32/conhost.exe'
$arguments = '--headless "' + $pwshPath + '" -NoProfile -NonInteractive -WindowStyle Hidden -File "' + $scriptPath + '"'
$action = New-ScheduledTaskAction -Execute $conhostPath -Argument $arguments -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Orca Glass Bridge' -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings `
    -Description 'Start the Codex-only Orca Glass bridge hidden at Eugene sign-in and recover after failure.' `
    -Force | Out-Null
$readback = Get-ScheduledTask -TaskName 'Orca Glass Bridge'
if ($readback.Actions[0].Execute -ine $conhostPath -or $readback.Actions[0].Arguments -cne $arguments) {
    throw 'Task readback differs from registered headless action.'
}
$readback | Select-Object TaskName, State
