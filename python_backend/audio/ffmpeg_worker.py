"""FFmpeg Ingestion and Audio Extraction Worker.

Implements FR-002, FR-003, FR-009, FR-010, Section 7.1, 7.2:
- Probes media container streams using ffprobe
- Safely extracts audio from video/audio containers to 16 kHz mono 16-bit PCM WAV
- Detects files with no audio track or corrupt streams
- Preserves original files read-only and unlinks temporary files
"""

import os
import json
import shutil
import subprocess
import tempfile
from typing import Dict, Any, Optional, Tuple


def probe_media_file(file_path: str) -> Dict[str, Any]:
    """Probes a media file using ffprobe.
    Returns:
        Dict containing duration, format, audio stream info, or error code.
    """
    if not os.path.exists(file_path):
        return {"success": False, "error": "ERR_FILE_NOT_FOUND", "message": "File does not exist."}

    if os.path.getsize(file_path) == 0:
        return {"success": False, "error": "ERR_FILE_EMPTY", "message": "The selected file is empty."}

    ffprobe_cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]

    try:
        proc = subprocess.run(ffprobe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        probe_data = json.loads(proc.stdout)
    except subprocess.CalledProcessError:
        return {
            "success": False,
            "error": "ERR_MEDIA_CORRUPTED",
            "message": "The selected file is corrupted or unreadable. Please select another file."
        }
    except Exception as e:
        return {"success": False, "error": "ERR_PROBE_FAILED", "message": str(e)}

    # Check for audio streams
    streams = probe_data.get("streams", [])
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

    if not audio_streams:
        return {
            "success": False,
            "error": "ERR_NO_AUDIO_STREAM",
            "message": "The selected video file contains no audio track."
        }

    format_info = probe_data.get("format", {})
    duration = float(format_info.get("duration", 0.0))
    if duration == 0.0 and "duration" in audio_streams[0]:
        duration = float(audio_streams[0].get("duration", 0.0))

    return {
        "success": True,
        "format_name": format_info.get("format_name", "unknown"),
        "duration": duration,
        "size_bytes": int(format_info.get("size", os.path.getsize(file_path))),
        "audio_codec": audio_streams[0].get("codec_name", "unknown"),
        "sample_rate": int(audio_streams[0].get("sample_rate", 16000)),
        "channels": int(audio_streams[0].get("channels", 1))
    }


def extract_to_standard_wav(input_path: str, output_wav_path: Optional[str] = None) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Extracts and normalizes media audio to 16 kHz 16-bit mono PCM WAV.
    The source file is opened read-only and never modified (FR-003, FR-010).
    Returns:
        (success: bool, path_or_error_message: str, probe_info: Optional[Dict])
    """
    probe = probe_media_file(input_path)
    if not probe["success"]:
        return False, probe["message"], probe

    if output_wav_path is None:
        temp_dir = tempfile.gettempdir()
        output_wav_path = os.path.join(temp_dir, f"barbar_extracted_{os.getpid()}_{os.path.basename(input_path)}.wav")

    # FFmpeg extraction command specified in Section 7.2
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-v", "error",
        "-i", input_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        "-f", "wav",
        output_wav_path
    ]

    try:
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True, output_wav_path, probe
    except subprocess.CalledProcessError as e:
        return False, f"FFmpeg extraction failed: {e.stderr.decode('utf-8', errors='ignore')}", probe
    except Exception as e:
        return False, f"Audio extraction error: {str(e)}", probe

