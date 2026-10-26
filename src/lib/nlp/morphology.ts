/**
 * Armenian Morphological Suffix Analyzer & Splitter (TypeScript implementation)
 */

export const IRREGULAR_DECLENSIONS: Record<string, Record<string, string>> = {
  հանդիպում: {
    ի: "հանդիպման",
    ից: "հանդիպումից",
    ով: "հանդիպումով",
    ում: "հանդիպումում",
    ը: "հանդիպումը",
    ն: "հանդիպումն",
    ներ: "հանդիպումներ",
    ները: "հանդիպումները",
    ների: "հանդիպումների",
    ներից: "հանդիպումներից",
    ներով: "հանդիպումներով",
  },
  հաշվետվություն: {
    ի: "հաշվետվության",
    ից: "հաշվետվությունից",
    ով: "հաշվետվությամբ",
    ում: "հաշվետվությունում",
    ը: "հաշվետվությունը",
    ն: "հաշվետվությունն",
    ներ: "հաշվետվություններ",
    ները: "հաշվետվությունները",
    ների: "հաշվետվությունների",
  },
  նամակ: {
    ի: "նամակի",
    ից: "նամակից",
    ով: "նամակով",
    ում: "նամակում",
    ը: "նամակը",
    ն: "նամակն",
    ներ: "նամակներ",
    ները: "նամակները",
  },
  նախագիծ: {
    ի: "նախագծի",
    ից: "նախագծից",
    ով: "նախագծով",
    ում: "նախագծում",
    ը: "նախագիծը",
    ն: "նախագիծն",
    ներ: "նախագծեր",
    ները: "նախագծերը",
  },
  վերջնաժամկետ: {
    ի: "վերջնաժամկետի",
    ից: "վերջնաժամկետից",
    ով: "վերջնաժամկետով",
    ում: "վերջնաժամկետում",
    ը: "վերջնաժամկետը",
    ն: "վերջնաժամկետն",
    ներ: "վերջնաժամկետներ",
    ները: "վերջնաժամկետները",
  },
  խնդիր: {
    ի: "խնդրի",
    ից: "խնդրից",
    ով: "խնդրով",
    ում: "խնդրում",
    ը: "խնդիրը",
    ն: "խնդիրն",
    ներ: "խնդիրներ",
    ները: "խնդիրները",
  },
  թիմ: {
    ի: "թիմի",
    ից: "թիմից",
    ով: "թիմով",
    ում: "թիմում",
    ը: "թիմը",
    ն: "թիմն",
    ներ: "թիմեր",
    ները: "թիմերը",
  },
};

const SUFFIX_PATTERNS = [
  /(-|–)?(ներին|ներից|ներով|ներում|ները|ներն)$/i,
  /(-|–)?(երին|երից|երով|երում|երը|երն)$/i,
  /(-|–)?(ների|ներ)$/i,
  /(-|–)?(երի|եր)$/i,
  /(-|–)?(ից|ով|ում)$/i,
  /(-|–)?(ի|վա|ան)$/i,
  /(-|–)?(ը|ն)$/i,
];

export function splitStemSuffix(token: string): {
  stem: string;
  suffix: string;
  hyphen?: string;
} {
  const clean = token.trim();

  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length === 2 && /^[ա-ֆԱ-Ֆ]+$/.test(parts[1])) {
      return { stem: parts[0], suffix: parts[1], hyphen: "-" };
    }
  }

  for (const pat of SUFFIX_PATTERNS) {
    const match = clean.match(pat);
    if (match && match.index && match.index > 0) {
      const stem = clean.slice(0, match.index);
      const suffix = match[2];
      const hyphen = match[1] || "";
      if (stem) {
        return { stem, suffix, hyphen };
      }
    }
  }

  return { stem: clean, suffix: "" };
}

export function inflectArmenianLemma(lemma: string, suffix: string): string {
  if (!suffix) return lemma;

  const cleanSuffix = suffix.replace(/^-/, "").trim();
  const cleanLemma = lemma.trim();

  // 1. Irregular forms
  if (IRREGULAR_DECLENSIONS[cleanLemma]?.[cleanSuffix]) {
    return IRREGULAR_DECLENSIONS[cleanLemma][cleanSuffix];
  }

  // 2. Regular rules
  const vowels = ["ա", "ե", "է", "ը", "ի", "ո", "ու", "օ"];
  const endsWithVowel = vowels.some((v) => cleanLemma.endsWith(v));

  if (cleanSuffix === "ը" || cleanSuffix === "ն") {
    return endsWithVowel ? `${cleanLemma}ն` : `${cleanLemma}ը`;
  }

  if (cleanSuffix === "ի") {
    if (cleanLemma.endsWith("ի")) {
      return `${cleanLemma.slice(0, -1)}ու`;
    }
    return `${cleanLemma}ի`;
  }

  if (cleanSuffix === "ից") return `${cleanLemma}ից`;
  if (cleanSuffix === "ով") return `${cleanLemma}ով`;
  if (cleanSuffix === "ում") return `${cleanLemma}ում`;

  return `${cleanLemma}${cleanSuffix}`;
}

