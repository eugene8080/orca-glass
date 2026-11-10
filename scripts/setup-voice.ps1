# Install the upstream whisper.cpp engine locally, without changing PATH.
param([switch]$Multilingual)
$ErrorActionPreference = 'Stop'
if (-not $IsWindows -or [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne 'X64') {
    throw 'This installer requires Windows x64.'
}
$voiceDir = Join-Path $PSScriptRoot '../.local/voice'
New-Item -ItemType Directory -Force $voiceDir | Out-Null

function Get-VerifiedFile($Uri, $Destination, $Sha256) {
    if ((Test-Path -LiteralPath $Destination) -and ((Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash -eq $Sha256)) { return }
    $partial = "$Destination.partial"
    Invoke-WebRequest -Uri $Uri -OutFile $partial -TimeoutSec 180
    if ((Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash -ne $Sha256) {
        throw "Checksum failed: $Destination"
    }
    Move-Item -LiteralPath $partial -Destination $Destination -Force
}

$archive = Join-Path $voiceDir 'whisper-b5454-x64.zip'
Get-VerifiedFile 'https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip' $archive '6ba69e3482d7826214f90a6a9c84ca07782aec1e1d0c6a7c30c994fd5d816ccb'
Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $voiceDir 'unpacked') -Force
$engine = Get-ChildItem -LiteralPath (Join-Path $voiceDir 'unpacked') -Filter whisper-cli.exe -Recurse | Select-Object -First 1
if (-not $engine) { throw 'Release archive did not contain whisper-cli.exe' }
$binDir = Join-Path $voiceDir 'bin'
New-Item -ItemType Directory -Force $binDir | Out-Null
Get-ChildItem -LiteralPath $engine.DirectoryName -File | Copy-Item -Destination $binDir -Force
if ($Multilingual) {
    # Smaller opt-in model for Japanese (and other languages) without the 550MB turbo download.
    Get-VerifiedFile 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin?download=true' (Join-Path $voiceDir 'ggml-base.bin') '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe'
    Write-Output 'Multilingual voice engine ready (ggml-base.bin). English-only users should omit -Multilingual.'
} else {
    Get-VerifiedFile 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin?download=true' (Join-Path $voiceDir 'ggml-base.en.bin') 'a03779c86df3323075f5e796cb2ce5029f00ec8869eee3fdfb897afe36c6d002'
    Write-Output 'Local English voice engine ready. No PATH, proxy, or agent settings changed.'
}
# Silero voice-activity model: without it Whisper turns quiet microphone noise into
# 'you' / 'Thank you.'. The bridge enables --vad only when this file is present.
Get-VerifiedFile 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin?download=true' (Join-Path $voiceDir 'ggml-silero-v5.1.2.bin') '29940d98d42b91fbd05ce489f3ecf7c72f0a42f027e4875919a28fb4c04ea2cf'
