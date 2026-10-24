"""Armenian Punctuation and Formatting Engine.

Implements FR-033, FR-034, FR-035:
- Western period ('.') converted to Armenian full stop ('։', U+0589)
- Question marks ('?') and Exclamation marks ('!') retained at sentence ends
- Proper Armenian capitalization on sentence starts (Ա-Ֆ)
- Spacing normalization
- Pause-based paragraph breaks
"""

import re
from typing import List, Dict, Any, Optional

ARMENIAN_LOWER_TO_UPPER = {
    chr(code): chr(code - 48) for code in range(0x0561, 0x0587)  # ա-ֆ -> Ա-Ֆ
}
ARMENIAN_LOWER_TO_UPPER["և"] = "Եվ"


def capitalize_armenian_char(char: str) -> str:
    """Capitalizes an Armenian lowercase character."""
    return ARMENIAN_LOWER_TO_UPPER.get(char, char.upper())


def capitalize_armenian_sentences(text: str) -> str:
    """Capitalizes the first character of sentences following Armenian full stop (։), ? or !."""
    if not text:
        return text

    # Capitalize the very first letter if it's Armenian lowercase
    chars = list(text)
    for i, ch in enumerate(chars):
        if ch.isalpha():
            chars[i] = capitalize_armenian_char(ch)
            break

    # Look for sentence boundaries: '։ ', '? ', '! ' or newline followed by space
    result_text = "".join(chars)
    
    def _cap_match(match):
        punct = match.group(1)
        space = match.group(2)
        letter = match.group(3)
        return f"{punct}{space}{capitalize_armenian_char(letter)}"

    pattern = r"([։\?!])(\s+)([ա-ֆa-zA-Z])"
    result_text = re.sub(pattern, _cap_match, result_text)
    return result_text


class ArmenianPunctuationEngine:
    def __init__(self, enabled: bool = True, pause_paragraph_threshold: float = 1.8):
        self.enabled = enabled
        self.pause_paragraph_threshold = pause_paragraph_threshold

    def format_text(self, text: str, ends_sentence: bool = False) -> str:
        """Applies Armenian punctuation conventions to a transcript segment."""
        if not self.enabled or not text.strip():
            return text

        formatted = text.strip()

        # 1. Replace ASCII period with Armenian full stop (։)
        formatted = re.sub(r"\.(?=\s|$)", "։", formatted)

        # 2. Fix spaces around Armenian punctuation: no space before '։', one space after
        formatted = re.sub(r"\s+։", "։", formatted)
        formatted = re.sub(r"։(?=[^\s։\?!])", "։ ", formatted)

        # 3. If it's a completed sentence that doesn't end with ։, ?, or !, add ։
        if ends_sentence and not re.search(r"[։\?!]$", formatted):
            formatted += "։"

        # 4. Capitalize sentence beginnings
        formatted = capitalize_armenian_sentences(formatted)

        return formatted

    def segment_with_paragraphs(
        self, segments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Synthesizes paragraph breaks between segments when the pause exceeds the threshold."""
        if not segments:
            return segments

        processed = []
        for i, seg in enumerate(segments):
            seg_copy = dict(seg)
            if i > 0:
                prev_end = segments[i - 1].get("endTime", 0.0)
                curr_start = seg.get("startTime", 0.0)
                pause = curr_start - prev_end
                if pause >= self.pause_paragraph_threshold:
                    seg_copy["isParagraphStart"] = True
            processed.append(seg_copy)

        return processed

