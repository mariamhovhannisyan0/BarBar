"""Word Error Rate (WER) and Character Error Rate (CER) Evaluation Framework.

Implements Section 10.1, AC-004, AC-005:
- Armenian text normalization (lowercasing, punctuation stripping, whitespace collapse)
- Levenshtein-based WER and CER calculation
"""

import re
from typing import Dict, Any, List, Tuple


def normalize_armenian_text(text: str) -> str:
    """Standardizes Armenian text before evaluation:
    - Lowercase Armenian alphabet (U+0531-U+0556 -> U+0561-U+0586)
    - Strips punctuation marks (։, `, ՞, ՜, ՛, ?, !, ,, ., -, etc.)
    - Normalizes ligatures and multiple whitespaces
    """
    if not text:
        return ""

    lowered = text.lower()
    # Normalize Armenian ligature և
    lowered = lowered.replace("և", "եվ")
    
    # Strip punctuation and special symbols
    cleaned = re.sub(r"[։\?!\.,;:\-\(\)\[\]\{\}\"\'«»`՛՜՞՝…]+", " ", lowered)
    
    # Collapse consecutive spaces
    normalized = re.sub(r"\s+", " ", cleaned).strip()
    return normalized


def compute_levenshtein(seq1: List[Any], seq2: List[Any]) -> Tuple[int, int, int, int]:
    """Computes substitutions, deletions, insertions, and total reference elements.
    Returns: (substitutions, deletions, insertions, reference_length)
    """
    m, n = len(seq1), len(seq2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(
                    dp[i - 1][j] + 1,      # Deletion
                    dp[i][j - 1] + 1,      # Insertion
                    dp[i - 1][j - 1] + 1   # Substitution
                )

    # Backtracking to count S, D, I
    i, j = m, n
    substitutions = 0
    deletions = 0
    insertions = 0

    while i > 0 or j > 0:
        if i > 0 and j > 0 and seq1[i - 1] == seq2[j - 1]:
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            substitutions += 1
            i -= 1
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            deletions += 1
            i -= 1
        elif j > 0 and dp[i][j] == dp[i][j - 1] + 1:
            insertions += 1
            j -= 1
        else:
            break

    return substitutions, deletions, insertions, m


def calculate_wer(reference: str, hypothesis: str) -> Dict[str, Any]:
    """Calculates Word Error Rate (WER).
    WER = (S + D + I) / N
    """
    ref_norm = normalize_armenian_text(reference)
    hyp_norm = normalize_armenian_text(hypothesis)

    ref_words = ref_norm.split()
    hyp_words = hyp_norm.split()

    if not ref_words:
        return {
            "wer": 0.0 if not hyp_words else 1.0,
            "substitutions": 0,
            "deletions": 0,
            "insertions": len(hyp_words),
            "ref_length": 0,
            "hyp_length": len(hyp_words)
        }

    s, d, i, n = compute_levenshtein(ref_words, hyp_words)
    wer = (s + d + i) / n if n > 0 else 0.0

    return {
        "wer": round(wer, 4),
        "wer_percent": round(wer * 100, 2),
        "substitutions": s,
        "deletions": d,
        "insertions": i,
        "ref_length": n,
        "hyp_length": len(hyp_words)
    }


def calculate_cer(reference: str, hypothesis: str) -> Dict[str, Any]:
    """Calculates Character Error Rate (CER).
    CER = (S_c + D_c + I_c) / N_c
    """
    ref_norm = normalize_armenian_text(reference).replace(" ", "")
    hyp_norm = normalize_armenian_text(hypothesis).replace(" ", "")

    ref_chars = list(ref_norm)
    hyp_chars = list(hyp_norm)

    if not ref_chars:
        return {
            "cer": 0.0 if not hyp_chars else 1.0,
            "substitutions": 0,
            "deletions": 0,
            "insertions": len(hyp_chars),
            "ref_length": 0,
            "hyp_length": len(hyp_chars)
        }

    s, d, i, n = compute_levenshtein(ref_chars, hyp_chars)
    cer = (s + d + i) / n if n > 0 else 0.0

    return {
        "cer": round(cer, 4),
        "cer_percent": round(cer * 100, 2),
        "substitutions": s,
        "deletions": d,
        "insertions": i,
        "ref_length": n,
        "hyp_length": len(hyp_chars)
    }


def evaluate_transcription(reference: str, hypothesis: str) -> Dict[str, Any]:
    """Runs combined WER & CER benchmark on Armenian text."""
    wer_res = calculate_wer(reference, hypothesis)
    cer_res = calculate_cer(reference, hypothesis)

    return {
        "reference_normalized": normalize_armenian_text(reference),
        "hypothesis_normalized": normalize_armenian_text(hypothesis),
        "wer": wer_res["wer"],
        "wer_percent": wer_res["wer_percent"],
        "cer": cer_res["cer"],
        "cer_percent": cer_res["cer_percent"],
        "details": {
            "word": wer_res,
            "char": cer_res
        }
    }

