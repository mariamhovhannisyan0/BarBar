import { NextRequest, NextResponse } from "next/server";

function normalizeArmenian(text: string): string {
  if (!text) return "";
  let lowered = text.toLowerCase().replace(/և/g, "եվ");
  lowered = lowered.replace(/[։\?!\.,;:\-\(\)\[\]\{\}\"\'«»`՛՜՞՝…]+/g, " ");
  return lowered.replace(/\s+/g, " ").trim();
}

function levenshtein(seq1: string[], seq2: string[]) {
  const m = seq1.length;
  const n = seq2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Del
          dp[i][j - 1] + 1, // Ins
          dp[i - 1][j - 1] + 1 // Sub
        );
      }
    }
  }

  let i = m;
  let j = n;
  let s = 0;
  let d = 0;
  let ins = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && seq1[i - 1] === seq2[j - 1]) {
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      s++;
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      d++;
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ins++;
      j--;
    } else {
      break;
    }
  }

  return { s, d, ins, total: m };
}

export async function POST(req: NextRequest) {
  try {
    const { reference, hypothesis } = await req.json();

    const refNorm = normalizeArmenian(reference || "");
    const hypNorm = normalizeArmenian(hypothesis || "");

    const refWords = refNorm ? refNorm.split(" ") : [];
    const hypWords = hypNorm ? hypNorm.split(" ") : [];

    const wordLev = levenshtein(refWords, hypWords);
    const wer = wordLev.total > 0 ? (wordLev.s + wordLev.d + wordLev.ins) / wordLev.total : 0;

    const refChars = refNorm.replace(/\s/g, "").split("");
    const hypChars = hypNorm.replace(/\s/g, "").split("");

    const charLev = levenshtein(refChars, hypChars);
    const cer = charLev.total > 0 ? (charLev.s + charLev.d + charLev.ins) / charLev.total : 0;

    return NextResponse.json({
      success: true,
      referenceNormalized: refNorm,
      hypothesisNormalized: hypNorm,
      wer: Math.round(wer * 10000) / 10000,
      werPercent: Math.round(wer * 1000) / 10,
      cer: Math.round(cer * 10000) / 10000,
      cerPercent: Math.round(cer * 1000) / 10,
      details: {
        word: {
          substitutions: wordLev.s,
          deletions: wordLev.d,
          insertions: wordLev.ins,
          total: wordLev.total,
        },
        char: {
          substitutions: charLev.s,
          deletions: charLev.d,
          insertions: charLev.ins,
          total: charLev.total,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

