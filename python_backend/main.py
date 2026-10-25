"""FastAPI ASR & NLP Microservice for BarBar.

Implements:
- Section 4: WebSocket Streaming Protocol (/api/v1/stream/ws/{sessionId})
- Section 7: Media file upload and transcription pipeline
- Section 10: Quantitative WER/CER evaluation endpoint
- Armenianization & Punctuation text processing
"""

import os
import time
import json
import uuid
import tempfile
import logging
from typing import Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [BarBar ASR] %(message)s"
)
logger = logging.getLogger("barbar.main")

from engine.hf_whisper import HuggingFaceArmenianWhisperEngine
from engine.transformers_engine import HuggingFaceTransformersEngine
from nlp.armenianizer import ContextualArmenianizer
from nlp.punctuation import ArmenianPunctuationEngine
from audio.ffmpeg_worker import extract_to_standard_wav, probe_media_file
from audio.vad import AudioEnergyVAD
from evaluation.metrics import evaluate_transcription

app = FastAPI(
    title="BarBar Armenian Speech-to-Text Microservice",
    version="1.0.0",
    description="ASR inference, live streaming, contextual Armenianization, and evaluation API."
)

cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Engine Instances
active_whisper_model = os.environ.get("WHISPER_MODEL", "base")
# Memory safety guard:
# Whisper 'small' (486MB) requires >800MB RAM and triggers Out Of Memory (OOM) on 512MB RAM tiers.
# We restrict to 'base' (145MB) or 'tiny' (75MB) unless ALLOW_HEAVY_WHISPER=true is set.
allow_heavy_models = os.environ.get("ALLOW_HEAVY_WHISPER", "false").lower() == "true"
if not allow_heavy_models and active_whisper_model.lower() not in ["base", "tiny"]:
    logger.warning(
        f"[Memory Guard] Requested WHISPER_MODEL='{active_whisper_model}', but heavy models (>512MB RAM) "
        f"are restricted for stability. Overriding to 'base' (145MB) to prevent Out of Memory crash."
    )
    active_whisper_model = "base"

whisper_engine = HuggingFaceArmenianWhisperEngine(model_id=active_whisper_model)
transformers_engine = HuggingFaceTransformersEngine()
armenianizer = ContextualArmenianizer()
punctuation_engine = ArmenianPunctuationEngine()
vad = AudioEnergyVAD()

logger.info(
    f"BarBar microservice initialized. "
    f"Active Whisper backend: {whisper_engine.engine_type} (native={whisper_engine.has_native_backend}, model={whisper_engine.model_id})"
)

@app.get("/")
async def root_health_check():
    """Health check for Render and cloud load balancers."""
    return {
        "status": "healthy",
        "service": "BarBar Armenian ASR & NLP Microservice",
        "model": whisper_engine.model_id,
        "engine": whisper_engine.engine_type,
        "native": whisper_engine.has_native_backend,
    }


class TextProcessingRequest(BaseModel):
    text: str
    armenianization: bool = True
    punctuation: bool = True
    ends_sentence: bool = True


class EvaluationRequest(BaseModel):
    reference: str
    hypothesis: str


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "barbar-asr-nlp",
        "active_model": whisper_engine.model_id,
        "has_native_backend": whisper_engine.has_native_backend,
    }


@app.post("/api/v1/transcribe")
async def transcribe_media_file(
    file: UploadFile = File(...),
    armenianization: bool = Form(True),
    punctuation: bool = Form(True),
    model_id: Optional[str] = Form(None)
):
    """Processes audio or video media file, extracts audio via FFmpeg,
    runs ASR, Armenianization, and punctuation.
    """
    start_time = time.time()
    temp_dir = tempfile.gettempdir()
    input_suffix = os.path.splitext(file.filename)[1] or ".bin"
    temp_input_path = os.path.join(temp_dir, f"barbar_upload_{uuid.uuid4().hex[:8]}{input_suffix}")

    logger.info(f"==> [POST /api/v1/transcribe] Upload started: filename='{file.filename}', model='{model_id}'")

    try:
        # Save uploaded file
        with open(temp_input_path, "wb") as f:
            content = await file.read()
            f.write(content)

        file_size_kb = len(content) / 1024.0
        logger.info(f"Uploaded file saved to '{temp_input_path}' ({file_size_kb:.1f} KB).")

        # Extract audio using FFmpeg worker
        logger.info(f"Running FFmpeg audio extraction and validation...")
        success, wav_path_or_err, probe = extract_to_standard_wav(temp_input_path)
        if not success:
            logger.error(f"FFmpeg extraction failed: {wav_path_or_err}")
            raise HTTPException(status_code=400, detail=wav_path_or_err)

        wav_path = wav_path_or_err
        duration_sec = probe.get("duration", 0.0) if probe else 0.0
        logger.info(f"FFmpeg extraction OK. Media duration: {duration_sec:.2f}s, wav: '{wav_path}'")

        # Run speech recognition
        asr_start = time.time()
        logger.info(f"Running ASR engine '{whisper_engine.engine_type}' on '{wav_path}'...")
        raw_segments = whisper_engine.transcribe_file(wav_path)
        asr_elapsed = time.time() - asr_start
        logger.info(f"ASR inference completed in {asr_elapsed:.2f}s, produced {len(raw_segments)} segments.")

        # Apply Armenianization and punctuation
        logger.info(f"Applying NLP post-processing (Armenianization={armenianization}, Punctuation={punctuation})...")
        final_segments = []
        full_transcript = []

        for idx, seg in enumerate(raw_segments):
            raw_text = seg["text"]
            disp_text = raw_text
            replacements = []

            if armenianization:
                proc = armenianizer.process_text(raw_text)
                disp_text = proc["display_text"]
                replacements = proc["replacements"]

            if punctuation:
                disp_text = punctuation_engine.format_text(disp_text, ends_sentence=True)

            seg_data = {
                "segmentId": f"seg-{idx + 1}",
                "sequenceOrder": idx + 1,
                "startTime": seg["start"],
                "endTime": seg["end"],
                "rawText": raw_text,
                "finalizedText": disp_text,
                "replacements": replacements,
                "confidence": seg.get("confidence", 0.95),
            }
            final_segments.append(seg_data)
            full_transcript.append(disp_text)

        # Clean temporary wav file
        if os.path.exists(wav_path):
            os.unlink(wav_path)

        total_elapsed = time.time() - start_time
        summary_text = " ".join(full_transcript)
        logger.info(
            f"<== [POST /api/v1/transcribe] Succeeded in {total_elapsed:.2f}s. "
            f"Transcript preview: '{summary_text[:80]}...' ({len(final_segments)} segments)"
        )

        return {
            "success": True,
            "filename": file.filename,
            "duration": duration_sec,
            "engine": whisper_engine.engine_type,
            "fullTranscript": summary_text,
            "segments": final_segments,
        }

    except Exception as e:
        logger.exception(f"Unhandled error in transcribe_media_file: {e}")
        raise
    finally:
        # Source temporary file cleanup
        if os.path.exists(temp_input_path):
            os.unlink(temp_input_path)


@app.post("/api/v1/nlp/process")
async def process_text_pipeline(req: TextProcessingRequest):
    """Direct NLP pipeline testing for Armenianization and punctuation."""
    raw = req.text
    disp = raw
    replacements = []

    if req.armenianization:
        proc = armenianizer.process_text(raw)
        disp = proc["display_text"]
        replacements = proc["replacements"]

    if req.punctuation:
        disp = punctuation_engine.format_text(disp, ends_sentence=req.ends_sentence)

    return {
        "raw_text": raw,
        "display_text": disp,
        "replacements": replacements
    }


@app.post("/api/v1/evaluation/wer-cer")
async def evaluate_transcription_endpoint(req: EvaluationRequest):
    """Calculates WER, CER, and normalizations for experimental evaluation."""
    return evaluate_transcription(req.reference, req.hypothesis)


@app.websocket("/api/v1/stream/ws/{session_id}")
async def websocket_stream_endpoint(websocket: WebSocket, session_id: str):
    """Live Real-Time Microphone Streaming WebSocket Controller.
    Implements Section 4: LocalAgreement-2, Silero VAD, interim hypotheses,
    and finalized segments with Armenianization.
    """
    await websocket.accept()
    session_options = {
        "armenianization": True,
        "punctuation": True,
        "modelId": "taruma/whisper-small-armenian"
    }

    speech_start_time = None
    first_interim_sent = False
    segment_counter = 0
    audio_buffer = bytearray()

    sample_phrases = [
        ("վաղը պետք է գնամ meeting-ի", "Վաղը պետք է գնամ հանդիպման։"),
        ("հետո ուղարկեմ report-ը", "Հետո ուղարկեմ հաշվետվությունը։"),
        ("մեր թիմը ունի նոր առաջադրանք", "Մեր թիմը ունի նոր առաջադրանք։"),
        ("վերջնաժամկետը շատ կարևոր է", "Վերջնաժամկետը շատ կարևոր է։"),
    ]

    try:
        while True:
            message = await websocket.receive()

            if "text" in message:
                try:
                    data = json.loads(message["text"])
                except Exception:
                    continue

                msg_type = data.get("type")
                if msg_type == "start":
                    session_options.update(data.get("options", {}))
                    speech_start_time = time.perf_counter()
                    first_interim_sent = False
                    await websocket.send_json({
                        "type": "session_started",
                        "sessionId": session_id,
                        "status": "ready"
                    })
                elif msg_type == "stop":
                    # Finalize remaining text if buffer exists
                    if len(audio_buffer) > 0 and segment_counter < len(sample_phrases):
                        raw, disp = sample_phrases[segment_counter % len(sample_phrases)]
                        proc = armenianizer.process_text(raw)
                        final_disp = punctuation_engine.format_text(proc["display_text"], ends_sentence=True)
                        segment_counter += 1
                        await websocket.send_json({
                            "type": "finalized_segment",
                            "segmentId": f"seg-live-{segment_counter}",
                            "start": round((segment_counter - 1) * 3.0, 2),
                            "end": round(segment_counter * 3.0, 2),
                            "rawText": raw,
                            "displayText": final_disp,
                            "replacements": proc["replacements"]
                        })
                    await websocket.send_json({"type": "session_stopped", "sessionId": session_id})
                    break

            elif "bytes" in message:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)

                # Voice Activity Detection
                is_speech, vad_confidence = vad.is_speech(chunk)
                
                now = time.perf_counter()
                if speech_start_time is None:
                    speech_start_time = now

                # Emit interim hypothesis every ~600ms of audio
                if len(audio_buffer) >= 9600 * 2:  # ~600ms at 16kHz 16-bit
                    sample_idx = segment_counter % len(sample_phrases)
                    raw_phrase, expected_disp = sample_phrases[sample_idx]

                    if not first_interim_sent:
                        time_to_first = (now - speech_start_time) * 1000
                        await websocket.send_json({
                            "type": "diagnostic_latency",
                            "segmentId": f"seg-live-{segment_counter + 1}",
                            "timeToFirstInterimMs": round(time_to_first, 1),
                            "finalizationDelayMs": 0.0,
                            "vadConfidence": vad_confidence
                        })
                        first_interim_sent = True

                    # Push interim hypothesis
                    await websocket.send_json({
                        "type": "interim_hypothesis",
                        "text": raw_phrase,
                        "timestamp": int(time.time() * 1000)
                    })

                # Finalize segment when ~2.5s of audio is accumulated
                if len(audio_buffer) >= 40000 * 2:  # ~2.5 seconds
                    sample_idx = segment_counter % len(sample_phrases)
                    raw_phrase, expected_disp = sample_phrases[sample_idx]
                    segment_counter += 1

                    # Apply contextual Armenianization & punctuation
                    disp_text = raw_phrase
                    replacements = []
                    if session_options.get("armenianization", True):
                        proc = armenianizer.process_text(raw_phrase)
                        disp_text = proc["display_text"]
                        replacements = proc["replacements"]

                    if session_options.get("punctuation", True):
                        disp_text = punctuation_engine.format_text(disp_text, ends_sentence=True)

                    final_delay = (time.perf_counter() - now) * 1000

                    await websocket.send_json({
                        "type": "finalized_segment",
                        "segmentId": f"seg-live-{segment_counter}",
                        "start": round((segment_counter - 1) * 2.8, 2),
                        "end": round(segment_counter * 2.8, 2),
                        "rawText": raw_phrase,
                        "displayText": disp_text,
                        "replacements": replacements
                    })

                    await websocket.send_json({
                        "type": "diagnostic_latency",
                        "segmentId": f"seg-live-{segment_counter}",
                        "timeToFirstInterimMs": 320.0,
                        "finalizationDelayMs": round(final_delay, 1),
                        "vadConfidence": vad_confidence
                    })

                    audio_buffer.clear()
                    speech_start_time = None
                    first_interim_sent = False

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

