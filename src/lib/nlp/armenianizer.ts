import { splitStemSuffix, inflectArmenianLemma } from "./morphology";

export interface ArmenianizationReplacement {
  spanId: string;
  originalToken: string;
  replacedWith: string;
  lemma: string;
  stem: string;
  suffix: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  category: string;
  state: "applied" | "reverted" | "customized";
}

export interface ArmenianizationResult {
  rawText: string;
  displayText: string;
  replacements: ArmenianizationReplacement[];
}

export const CLIENT_GLOSSARY: Record<string, { lemma: string; category: string; confidence: number }> = {
  meeting: { lemma: "հանդիպում", category: "business", confidence: 0.95 },
  report: { lemma: "հաշվետվություն", category: "business", confidence: 0.95 },
  call: { lemma: "զանգ", category: "everyday", confidence: 0.9 },
  email: { lemma: "նամակ", category: "technology", confidence: 0.95 },
  mail: { lemma: "նամակ", category: "technology", confidence: 0.9 },
  project: { lemma: "նախագիծ", category: "business", confidence: 0.95 },
  task: { lemma: "առաջադրանք", category: "business", confidence: 0.92 },
  deadline: { lemma: "վերջնաժամկետ", category: "business", confidence: 0.95 },
  team: { lemma: "թիմ", category: "business", confidence: 0.9 },
  presentation: { lemma: "շնորհանդես", category: "business", confidence: 0.92 },
  client: { lemma: "հաճախորդ", category: "business", confidence: 0.92 },
  customer: { lemma: "հաճախորդ", category: "business", confidence: 0.9 },
  feedback: { lemma: "արձագանք", category: "business", confidence: 0.92 },
  update: { lemma: "թարմացում", category: "technology", confidence: 0.9 },
  link: { lemma: "հղում", category: "technology", confidence: 0.92 },
  document: { lemma: "փաստաթուղթ", category: "office", confidence: 0.95 },
  message: { lemma: "հաղորդագրություն", category: "technology", confidence: 0.92 },
  bug: { lemma: "խնդիր", category: "technology", confidence: 0.9 },
  developer: { lemma: "ծրագրավորող", category: "technology", confidence: 0.92 },
  interview: { lemma: "հարցազրույց", category: "business", confidence: 0.95 },
  schedule: { lemma: "ժամանակացույց", category: "business", confidence: 0.92 },
};

export const CLIENT_SPECIAL_TERMS = new Set([
  "google",
  "apple",
  "microsoft",
  "amazon",
  "meta",
  "facebook",
  "instagram",
  "whatsapp",
  "telegram",
  "zoom",
  "slack",
  "github",
  "docker",
  "python",
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "next.js",
  "node",
  "postgres",
  "postgresql",
  "sqlite",
  "fastapi",
  "linux",
  "windows",
  "barbar",
  "whisper",
]);

export const CLIENT_PROTECTED_TERMS = CLIENT_SPECIAL_TERMS;

export function processArmenianization(
  text: string,
  options: {
    enabled?: boolean;
    customGlossary?: Record<string, { lemma: string; category?: string; confidence?: number }>;
    specialTerms?: Set<string>;
    protectedTerms?: Set<string>;
  } = {}
): ArmenianizationResult {
  if (options.enabled === false || !text.trim()) {
    return { rawText: text, displayText: text, replacements: [] };
  }

  const glossary = { ...CLIENT_GLOSSARY, ...(options.customGlossary || {}) };
  const specialSet = options.specialTerms || options.protectedTerms || CLIENT_SPECIAL_TERMS;

  const replacements: ArmenianizationReplacement[] = [];
  const words = text.split(/(\s+)/);
  let charCursor = 0;
  const processedSegments: string[] = [];

  for (const part of words) {
    if (/^\s+$/.test(part)) {
      processedSegments.push(part);
      charCursor += part.length;
      continue;
    }

    const punctMatch = part.match(/([,\.։\?!;]+)$/);
    const trailingPunct = punctMatch ? punctMatch[1] : "";
    const coreToken = punctMatch ? part.slice(0, punctMatch.index) : part;

    const lowerCore = coreToken.toLowerCase().replace(/[^\w-]/g, "");
    const { stem, suffix } = splitStemSuffix(coreToken);
    const stemLower = stem.toLowerCase().replace(/[^\w-]/g, "");

    if (specialSet.has(lowerCore) || specialSet.has(stemLower)) {
      processedSegments.push(part);
      charCursor += part.length;
      continue;
    }

    if (glossary[stemLower]) {
      const entry = glossary[stemLower];
      const inflected = inflectArmenianLemma(entry.lemma, suffix);
      const replacementText = inflected + trailingPunct;
      const spanId = `span-${Math.random().toString(36).substring(2, 9)}`;

      replacements.push({
        spanId,
        originalToken: part,
        replacedWith: replacementText,
        lemma: entry.lemma,
        stem,
        suffix,
        startIndex: charCursor,
        endIndex: charCursor + replacementText.length,
        confidence: entry.confidence || 0.92,
        category: entry.category || "general",
        state: "applied",
      });

      processedSegments.push(replacementText);
      charCursor += replacementText.length;
    } else {
      processedSegments.push(part);
      charCursor += part.length;
    }
  }

  return {
    rawText: text,
    displayText: processedSegments.join(""),
    replacements,
  };
}

