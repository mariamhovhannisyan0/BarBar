"""Armenian Morphological Inflection and Stem-Suffix Splitter.

Supports agglutinative Armenian declensions for loanwords and foreign terms.
Handles cases (Genitive/Dative, Ablative, Instrumental, Locative),
definite articles (-ը, -ն), and plural forms (-ներ, -եր).
"""

import re
from typing import Tuple, Optional, Dict, Any

# Ordered suffixes from longest to shortest to ensure maximal match
SUFFIXES_PATTERN = [
    # Plural + Cases + Article
    (r"(-|–)?(ներին|ներից|ներով|ներում|ները|ներն)$", "PLURAL_CASE_OR_DEF"),
    (r"(-|–)?(երին|երից|երով|երում|երը|երն)$", "PLURAL_CASE_OR_DEF"),
    (r"(-|–)?(ների|ներ)$", "PLURAL"),
    (r"(-|–)?(երի|եր)$", "PLURAL"),
    # Singular Cases + Article
    (r"(-|–)?(ից|ով|ում)$", "CASE"),
    (r"(-|–)?(ի|վա|ան)$", "GEN_DAT"),
    (r"(-|–)?(ը|ն)$", "DEF_ARTICLE"),
]

# Irregular Armenian lemma declensions
IRREGULAR_DECLENSIONS: Dict[str, Dict[str, str]] = {
    "հանդիպում": {
        "ի": "հանդիպման",
        "ից": "հանդիպումից",
        "ով": "հանդիպումով",
        "ում": "հանդիպումում",
        "ը": "հանդիպումը",
        "ն": "հանդիպումն",
        "ներ": "հանդիպումներ",
        "ները": "հանդիպումները",
        "ների": "հանդիպումների",
        "ներից": "հանդիպումներից",
        "ներով": "հանդիպումներով",
    },
    "հաշվետվություն": {
        "ի": "հաշվետվության",
        "ից": "հաշվետվությունից",
        "ով": "հաշվետվությամբ",
        "ում": "հաշվետվությունում",
        "ը": "հաշվետվությունը",
        "ն": "հաշվետվությունն",
        "ներ": "հաշվետվություններ",
        "ները": "հաշվետվությունները",
        "ների": "հաշվետվությունների",
    },
    "նամակ": {
        "ի": "նամակի",
        "ից": "նամակից",
        "ով": "նամակով",
        "ում": "նամակում",
        "ը": "նամակը",
        "ն": "նամակն",
        "ներ": "նամակներ",
        "ները": "նամակները",
        "ների": "նամակների",
    },
    "նախագիծ": {
        "ի": "նախագծի",
        "ից": "նախագծից",
        "ով": "նախագծով",
        "ում": "նախագծում",
        "ը": "նախագիծը",
        "ն": "նախագիծն",
        "ներ": "նախագծեր",
        "ները": "նախագծերը",
        "ների": "նախագծերի",
    },
    "վերջնաժամկետ": {
        "ի": "վերջնաժամկետի",
        "ից": "վերջնաժամկետից",
        "ով": "վերջնաժամկետով",
        "ում": "վերջնաժամկետում",
        "ը": "վերջնաժամկետը",
        "ն": "վերջնաժամկետն",
        "ներ": "վերջնաժամկետներ",
        "ները": "վերջնաժամկետները",
    },
    "խնդիր": {
        "ի": "խնդրի",
        "ից": "խնդրից",
        "ով": "խնդրով",
        "ում": "խնդրում",
        "ը": "խնդիրը",
        "ն": "խնդիրն",
        "ներ": "խնդիրներ",
        "ները": "խնդիրները",
    },
    "թիմ": {
        "ի": "թիմի",
        "ից": "թիմից",
        "ով": "թիմով",
        "ում": "թիմում",
        "ը": "թիմը",
        "ն": "թիմն",
        "ներ": "թիմեր",
        "ները": "թիմերը",
    }
}


def split_stem_suffix(token: str) -> Tuple[str, str, Optional[str]]:
    """Splits a token (e.g. 'meeting-ի', 'report-ը', 'call-ից') into stem and suffix.
    Returns: (stem, suffix, connector) where connector is '-' or empty.
    """
    clean_token = token.strip()
    
    # Check for explicit hyphenation like meeting-ի, report-ը
    if "-" in clean_token:
        parts = clean_token.rsplit("-", 1)
        if len(parts) == 2 and re.match(r"^[ա-ֆԱ-Ֆ]+$", parts[1]):
            return parts[0], parts[1], "-"
            
    # Check if foreign characters end with Armenian suffix
    # e.g., 'meetingի' or transliterated 'միթինգի'
    for pattern, _ in SUFFIXES_PATTERN:
        match = re.search(pattern, clean_token, re.IGNORECASE)
        if match:
            suffix = match.group(2)
            hyphen = match.group(1) or ""
            stem = clean_token[:match.start()]
            if stem:
                return stem, suffix, hyphen

    return clean_token, "", None


def inflect_armenian_lemma(armenian_lemma: str, suffix: str) -> str:
    """Applies the appropriate morphological inflection to an Armenian lemma
    given the extracted suffix from the loanword.
    """
    if not suffix:
        return armenian_lemma

    clean_suffix = suffix.lstrip("-").strip()
    clean_lemma = armenian_lemma.strip()

    # 1. Check irregular declension table
    if clean_lemma in IRREGULAR_DECLENSIONS:
        declensions = IRREGULAR_DECLENSIONS[clean_lemma]
        if clean_suffix in declensions:
            return declensions[clean_suffix]

    # 2. Regular Armenian declension rules
    # Vowel endings vs Consonant endings
    vowels = ("ա", "ե", "է", "ը", "ի", "ո", "ու", "օ")
    ends_with_vowel = clean_lemma.endswith(vowels)

    # Definite article rules (-ը after consonant, -ն after vowel)
    if clean_suffix in ("ը", "ն"):
        return f"{clean_lemma}ն" if ends_with_vowel else f"{clean_lemma}ը"

    # Dative/Genitive (-ի)
    if clean_suffix == "ի":
        if ends_with_vowel:
            return f"{clean_lemma[:-1]}ու" if clean_lemma.endswith("ի") else f"{clean_lemma}ի"
        return f"{clean_lemma}ի"

    # Ablative (-ից)
    if clean_suffix == "ից":
        return f"{clean_lemma}ից"

    # Instrumental (-ով)
    if clean_suffix == "ով":
        return f"{clean_lemma}ով"

    # Locative (-ում)
    if clean_suffix == "ում":
        return f"{clean_lemma}ում"

    # Direct attachment for composite suffixes
    return f"{clean_lemma}{clean_suffix}"

