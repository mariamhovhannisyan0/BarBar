"""Abstract Strategy Interface for Armenian Speech Recognition Engines.

Implements FR-024, FR-027:
- Standardized lifecycle and transcription contract
- Dynamic model exchange between fine-tuned Armenian checkpoints
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Generator


class ISpeechRecognitionEngine(ABC):
    @abstractmethod
    def load_hf_model(self, hf_repo_id: str, device: str = "cpu", compute_type: str = "int8") -> None:
        """Loads a model checkpoint from Hugging Face Hub or local cache."""
        pass

    @abstractmethod
    def transcribe_file(self, audio_path: str, options: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Transcribes a normalized 16 kHz audio file into timed Armenian segments.
        Returns:
            List of dicts: [
                {"start": float, "end": float, "text": str, "confidence": float}
            ]
        """
        pass

    @abstractmethod
    def transcribe_chunk(self, audio_bytes: bytes, sample_rate: int = 16000) -> str:
        """Transcribes a raw PCM audio chunk for real-time live streaming."""
        pass

