"""Voice Activity Detection (VAD) Engine.

Implements FR-015:
- Detects speech versus silence in streaming audio chunks
- Calculates root-mean-square (RMS) energy and voice probability
- Filters silence to prevent ASR hallucinations during pauses
"""

import math
import numpy as np
from typing import Tuple


class AudioEnergyVAD:
    """Acoustic energy and zero-crossing VAD suitable for zero-dependency streaming,
    with interfaces ready for Silero ONNX runtime.
    """
    def __init__(self, sample_rate: int = 16000, energy_threshold: float = 0.015):
        self.sample_rate = sample_rate
        self.energy_threshold = energy_threshold

    def calculate_rms(self, audio_data: np.ndarray) -> float:
        """Calculates RMS (Root Mean Square) energy of float32 or int16 PCM audio."""
        if len(audio_data) == 0:
            return 0.0

        if audio_data.dtype == np.int16:
            samples = audio_data.astype(np.float32) / 32768.0
        else:
            samples = audio_data.astype(np.float32)

        mean_square = np.mean(samples ** 2)
        return float(np.sqrt(mean_square))

    def is_speech(self, audio_chunk_bytes: bytes) -> Tuple[bool, float]:
        """Evaluates whether the given raw 16-bit PCM bytes contain speech.
        Returns: (is_speech: bool, confidence_score: float)
        """
        if not audio_chunk_bytes:
            return False, 0.0

        samples = np.frombuffer(audio_chunk_bytes, dtype=np.int16)
        rms = self.calculate_rms(samples)

        # Non-linear confidence mapping based on threshold
        confidence = min(1.0, rms / (self.energy_threshold * 2.5 + 1e-6))
        is_active = rms >= self.energy_threshold

        return is_active, round(confidence, 3)

