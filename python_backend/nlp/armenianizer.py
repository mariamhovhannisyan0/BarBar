"""Contextual Armenianization Subsystem for BarBar.

Implements FR-028 - FR-032:
- Detects foreign words (Latin, Cyrillic, transliterated loanwords)
- Protects brand names, proper names, and user-defined protected terms
- Applies contextual glossary lookup with morphological inflection
- Produces ArmenianizationSpan metadata records supporting one-click revert
"""

import re
import uuid
from typing import List, Dict, Any, Optional, Set
from .morphology import split_stem_suffix, inflect_armenian_lemma


# Default Curated Glossary for Armenian Technical and Everyday Terms
DEFAULT_GLOSSARY: Dict[str, Dict[str, Any]] = {
    "meeting": {"lemma": "հանդիպում", "category": "business", "confidence": 0.95},
    "report": {"lemma": "հաշվետվություն", "category": "business", "confidence": 0.95},
    "call": {"lemma": "զանգ", "category": "everyday", "confidence": 0.90},
    "email": {"lemma": "նամակ", "category": "technology", "confidence": 0.95},
    "mail": {"lemma": "նամակ", "category": "technology", "confidence": 0.90},
    "project": {"lemma": "նախագիծ", "category": "business", "confidence": 0.95},
    "task": {"lemma": "առաջադրանք", "category": "business", "confidence": 0.92},
    "deadline": {"lemma": "վերջնաժամկետ", "category": "business", "confidence": 0.95},
    "team": {"lemma": "թիմ", "category": "business", "confidence": 0.90},
    "presentation": {"lemma": "շնորհանդես", "category": "business", "confidence": 0.92},
    "client": {"lemma": "հաճախորդ", "category": "business", "confidence": 0.92},
    "customer": {"lemma": "հաճախորդ", "category": "business", "confidence": 0.90},
    "feedback": {"lemma": "արձագանք", "category": "business", "confidence": 0.92},
    "update": {"lemma": "թարմացում", "category": "technology", "confidence": 0.90},
    "link": {"lemma": "հղում", "category": "technology", "confidence": 0.92},
    "file": {"lemma": "ֆայլ", "category": "technology", "confidence": 0.85},
    "document": {"lemma": "փաստաթուղթ", "category": "office", "confidence": 0.95},
    "message": {"lemma": "հաղորդագրություն", "category": "technology", "confidence": 0.92},
    "chat": {"lemma": "զրույց", "category": "technology", "confidence": 0.88},
    "bug": {"lemma": "խնդիր", "category": "technology", "confidence": 0.90},
    "developer": {"lemma": "ծրագրավորող", "category": "technology", "confidence": 0.92},
    "designer": {"lemma": "դիզայներ", "category": "creative", "confidence": 0.85},
    "manager": {"lemma": "կառավարիչ", "category": "business", "confidence": 0.88},
    "interview": {"lemma": "հարցազրույց", "category": "business", "confidence": 0.95},
    "office": {"lemma": "գրասենյակ", "category": "business", "confidence": 0.92},
    "schedule": {"lemma": "ժամանակացույց", "category": "business", "confidence": 0.92},
    "vacation": {"lemma": "արձակուրդ", "category": "everyday", "confidence": 0.90},
}

# Transliterated Armenian loanwords map
TRANSLITERATED_LOANWORDS: Dict[str, str] = {
    "միթինգ": "meeting",
    "միթինգի": "meeting-ի",
    "ռեպորտ": "report",
    "ռեպորտը": "report-ը",
    "թասք": "task",
    "դեդլայն": "deadline",
    "ֆիդբեք": "feedback",
    "ֆայլ": "file",
}

# Default Special Terms (Brands, Companies, Technologies, Personal Names - Strict Non-Translation)
DEFAULT_SPECIAL_TERMS: Set[str] = {
    "google", "apple", "microsoft", "amazon", "meta",
    "whatsapp", "zoom", "slack", "github", "gitlab", "docker",
    "python", "javascript", "typescript", "react", "nextjs", "next.js", "node",
    "nodejs", "postgres", "postgresql", "sqlite", "fastapi", "linux", "windows", "android", "ios", "barbar", "whisper", "openai",
}

# Backward compatibility alias
DEFAULT_PROTECTED_TERMS = DEFAULT_SPECIAL_TERMS


class ContextualArmenianizer:
    def __init__(
        self,
        glossary: Optional[Dict[str, Dict[str, Any]]] = None,
        special_terms: Optional[Set[str]] = None,
        protected_terms: Optional[Set[str]] = None,
        enabled: bool = True
    ):
        self.glossary = glossary or dict(DEFAULT_GLOSSARY)
        self.special_terms = set(special_terms or protected_terms or DEFAULT_SPECIAL_TERMS)
        self.protected_terms = self.special_terms
        self.enabled = enabled

    def add_glossary_term(self, foreign_stem: str, armenian_lemma: str, category: str = "custom", confidence: float = 0.95):
        self.glossary[foreign_stem.lower().strip()] = {
            "lemma": armenian_lemma.strip(),
            "category": category,
            "confidence": confidence
        }

    def add_special_term(self, term: str):
        self.special_terms.add(term.lower().strip())

    def add_protected_term(self, term: str):
        self.add_special_term(term)

    def remove_special_term(self, term: str):
        self.special_terms.discard(term.lower().strip())

    def remove_protected_term(self, term: str):
        self.remove_special_term(term)

    def is_special(self, token: str) -> bool:
        clean = re.sub(r"[^\w\.-]", "", token).lower()
        # Stem check
        stem, _, _ = split_stem_suffix(clean)
        return stem.lower() in self.special_terms or clean in self.special_terms

    def is_protected(self, token: str) -> bool:
        return self.is_special(token)

    def process_text(self, text: str) -> Dict[str, Any]:
        """Processes raw text and applies contextual Armenianization.
        Returns:
            {
                "raw_text": str,
                "display_text": str,
                "replacements": List[Dict[str, Any]]
            }
        """
        if not self.enabled or not text.strip():
            return {
                "raw_text": text,
                "display_text": text,
                "replacements": []
            }

        # Token pattern matching words, numbers, and punctuation
        tokens_matches = list(re.finditer(r"(\S+)", text))
        replacements = []
        result_chars = list(text)

        # Track offset difference between raw text and transformed text
        offset_shift = 0

        for match in tokens_matches:
            original_token = match.group(0)
            raw_start = match.start()
            raw_end = match.end()

            # Separate attached trailing punctuation like comma or Armenian full stop
            punct_match = re.search(r"([,\.։\?!;]+)$", original_token)
            trailing_punct = ""
            core_token = original_token
            if punct_match:
                trailing_punct = punct_match.group(1)
                core_token = original_token[:punct_match.start()]

            # Check if token is protected
            if self.is_protected(core_token):
                continue

            # Check transliterated form
            lower_core = core_token.lower()
            if lower_core in TRANSLITERATED_LOANWORDS:
                core_token = TRANSLITERATED_LOANWORDS[lower_core]

            # Split stem and suffix
            stem, suffix, _ = split_stem_suffix(core_token)
            lookup_key = stem.lower()

            if lookup_key in self.glossary:
                entry = self.glossary[lookup_key]
                lemma = entry["lemma"]
                confidence = entry.get("confidence", 0.9)

                # Decline Armenian lemma with the extracted suffix
                replacement = inflect_armenian_lemma(lemma, suffix)
                final_replacement = replacement + trailing_punct

                span_id = f"span-{uuid.uuid4().hex[:8]}"

                # Store replacement metadata
                replacement_info = {
                    "spanId": span_id,
                    "originalToken": original_token,
                    "replacedWith": final_replacement,
                    "lemma": lemma,
                    "stem": stem,
                    "suffix": suffix,
                    "startIndex": raw_start + offset_shift,
                    "endIndex": raw_start + offset_shift + len(final_replacement),
                    "confidence": confidence,
                    "category": entry.get("category", "general"),
                    "state": "applied"
                }
                replacements.append(replacement_info)

                # Splice into result
                curr_start = raw_start + offset_shift
                curr_end = raw_end + offset_shift
                result_chars[curr_start:curr_end] = list(final_replacement)
                offset_shift += len(final_replacement) - len(original_token)

        display_text = "".join(result_chars)

        return {
            "raw_text": text,
            "display_text": display_text,
            "replacements": replacements
        }

