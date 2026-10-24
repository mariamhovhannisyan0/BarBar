"""Unit tests for BarBar ASR & Armenian NLP pipeline.

Verifies:
- FR-028, FR-029: Contextual Armenianization of loan words
- FR-030: Special terms stay unmodified
- FR-033, FR-034: Armenian punctuation and sentence capitalization
- AC-004: WER / CER quantitative calculation
"""

import unittest
import os
import sys

# Ensure python_backend is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from nlp.armenianizer import ContextualArmenianizer
from nlp.punctuation import ArmenianPunctuationEngine
from evaluation.metrics import evaluate_transcription


class TestBarBarPipeline(unittest.TestCase):
    def setUp(self):
        self.armenianizer = ContextualArmenianizer()
        self.punctuation = ArmenianPunctuationEngine()

    def test_armenianization(self):
        text = "վաղը պետք է գնամ meeting-ի, հետո ուղարկեմ report-ը"
        result = self.armenianizer.process_text(text)
        disp = result["display_text"]
        self.assertIn("հանդիպման", disp)
        self.assertIn("հաշվետվությունը", disp)

    def test_special_terms_unmodified(self):
        text = "Ես օգտագործում եմ Google, Python և Docker համակարգերը"
        result = self.armenianizer.process_text(text)
        disp = result["display_text"]
        self.assertIn("Google", disp)
        self.assertIn("Python", disp)
        self.assertIn("Docker", disp)

    def test_armenian_punctuation(self):
        text = "բարև ձեզ. ինչպե՞ս եք."
        formatted = self.punctuation.format_text(text, ends_sentence=True)
        self.assertTrue(formatted.startswith("Բարև"))
        self.assertTrue(formatted.endswith("։"))

    def test_wer_cer_metrics(self):
        ref = "բարև ձեզ հարգելի գործընկերներ"
        hyp = "բարև ձեզ հարգելի ընկերներ"
        res = evaluate_transcription(ref, hyp)
        self.assertGreater(res["wer"], 0.0)
        self.assertLess(res["wer"], 1.0)
        self.assertIn("cer", res)


if __name__ == "__main__":
    unittest.main()

