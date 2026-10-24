#!/usr/bin/env python3
"""Interactive Model Downloader with Real-time Progress Bar (%) for BarBar ASR."""

import os
import sys

MODEL_REPOS = {
    "tiny": "Systran/faster-whisper-tiny",
    "base": "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
    "medium": "Systran/faster-whisper-medium",
    "large-v3": "Systran/faster-whisper-large-v3",
}


def download(model_name: str = "small"):
    repo_id = MODEL_REPOS.get(model_name, model_name)

    print("\n" + "=" * 65)
    print(f"  [BarBar] 📥 Ներբեռնվում է Whisper '{model_name}' մոդելը...")
    print(f"  Repository: https://huggingface.co/{repo_id}")
    print("=" * 65 + "\n")

    try:
        import huggingface_hub

        # Allow standard tqdm progress bar with percentage (%) and download speed
        model_path = huggingface_hub.snapshot_download(
            repo_id=repo_id,
            allow_patterns=[
                "config.json",
                "preprocessor_config.json",
                "model.bin",
                "tokenizer.json",
                "vocabulary.*",
            ],
        )

        print("\n" + "=" * 65)
        print(f"  ✓ Whisper '{model_name}' մոդելը 100% հաջողությամբ պատրաստ է:")
        print(f"  {model_path}")
        print("=" * 65 + "\n")
        return model_path

    except Exception as e:
        print(f"\n❌ Ներբեռնման սխալ ({model_name}): {e}")
        if model_name != "base":
            print("\nՓորձում ենք ներբեռնել ավելի թեթև 'base' մոդելը (73 MB)...")
            return download("base")
        sys.exit(1)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "small"
    download(target)

