$ErrorActionPreference = 'Stop'
if ([Environment]::MachineName -ne 'PSCAP11') {
    throw 'This startup registration is intended for PSCAP11.'
}
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$pwshPath = (Get-Command pwsh.exe -ErrorAction Stop).Source
$scriptPath = Join-Path $PSScriptRoot 'start-windows.ps1'
$action = New-ScheduledTaskAction -Execute $pwshPath `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -File `"$scriptPath`"" `
    -WorkingDirectory (Split-Path $PSScriptRoot -Parent)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Orca Glass Bridge' -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings `
    -Description 'Start the Codex-only Orca Glass bridge hidden at Eugene sign-in and recover after failure.' `
    -Force | Select-Object TaskName, State
