#!/usr/bin/env bash
# Install whisper.cpp locally (or use Homebrew) and verify model checksums.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VOICE="$ROOT/.local/voice"
MULTILINGUAL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --multilingual) MULTILINGUAL=1 ;;
    -h|--help) echo "Usage: $0 [--multilingual]"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
mkdir -p "$VOICE/bin"

verified_download() {
  local url="$1" dest="$2" hash="$3"
  if [ -f "$dest" ] && [ "$(shasum -a 256 "$dest" | awk '{print $1}')" = "$hash" ]; then
    return 0
  fi
  local partial="${dest}.partial"
  curl -L --fail -o "$partial" "$url"
  if [ "$(shasum -a 256 "$partial" | awk '{print $1}')" != "$hash" ]; then
    echo "Checksum failed: $dest" >&2
    exit 1
  fi
  mv -f "$partial" "$dest"
}

if command -v brew >/dev/null 2>&1 && brew list whisper-cpp >/dev/null 2>&1; then
  echo "Using Homebrew whisper-cpp binaries on PATH."
elif command -v brew >/dev/null 2>&1; then
  echo "Install whisper-cpp with: brew install whisper-cpp"
  echo "Falling back to a local macOS binary download when available."
fi

ARCH="$(uname -m)"
if [ ! -x "$VOICE/bin/whisper-cli" ]; then
  ZIP="$VOICE/whisper-b5454.zip"
  if [ "$ARCH" = "arm64" ]; then
    URL='https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-AppleSilicon.zip'
    SHA='0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5'
  else
    URL='https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip'
    SHA='6ba69e3482d7826214f90a6a9c84ca07782aec1e1d0c6a7c30c994fd5d816ccb'
  fi
  verified_download "$URL" "$ZIP" "$SHA"
  rm -rf "$VOICE/unpacked"
  unzip -qo "$ZIP" -d "$VOICE/unpacked"
  CLI="$(find "$VOICE/unpacked" -name whisper-cli -type f | head -n 1)"
  if [ -z "$CLI" ]; then
    echo "Release archive did not contain whisper-cli" >&2
    exit 1
  fi
  cp -f "$(dirname "$CLI")"/whisper-* "$VOICE/bin/" 2>/dev/null || cp -f "$CLI" "$VOICE/bin/whisper-cli"
  chmod +x "$VOICE/bin/"whisper-* 2>/dev/null || true
fi

if [ "$MULTILINGUAL" -eq 1 ]; then
  verified_download 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin?download=true' \
    "$VOICE/ggml-base.bin" '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe'
  echo "Multilingual voice model ready (ggml-base.bin)."
else
  verified_download 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin?download=true' \
    "$VOICE/ggml-base.en.bin" 'a03779c86df3323075f5e796cb2ce5029f00ec8869eee3fdfb897afe36c6d002'
  echo "English voice model ready (ggml-base.en.bin)."
fi

verified_download 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin?download=true' \
  "$VOICE/ggml-silero-v5.1.2.bin" '29940d98d42b91fbd05ce489f3ecf7c72f0a42f027e4875919a28fb4c04ea2cf'
echo "Silero VAD model ready."
