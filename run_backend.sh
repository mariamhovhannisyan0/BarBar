#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/python_backend"

if [ ! -d "venv" ]; then
    echo "[BarBar] Creating Python virtual environment in python_backend/venv..."
    python3.13 -m venv venv || python3 -m venv venv
    echo "[BarBar] Installing requirements..."
    ./venv/bin/pip install -r requirements.txt
fi

echo "=========================================================="
echo "          BarBar Armenian Speech-to-Text Microservice     "
echo "=========================================================="

# Check FFmpeg
if command -v ffmpeg >/dev/null 2>&1; then
    echo "✓ FFmpeg found: $(which ffmpeg)"
else
    echo "⚠️  WARNING: FFmpeg not found in PATH! Audio/Video extraction may fail."
fi

rm -f ~/.cache/huggingface/hub/models--Systran--faster-whisper-*/blobs/*.incomplete 2>/dev/null || true

# Pre-download Whisper model with interactive progress bar (%)
./venv/bin/python3 download_model.py small

echo "=========================================================="
echo "Starting Uvicorn server on http://127.0.0.1:8000 ..."
echo "Neural ASR: ACTIVE (Press Ctrl+C to stop)"
echo "=========================================================="

./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
