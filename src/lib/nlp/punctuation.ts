/**
 * Armenian Punctuation and Formatting Engine (Client / TypeScript)
 * Implements FR-033, FR-034, FR-035, A-007
 */

const ARMENIAN_LOWER_START = 0x0561; // ա
const ARMENIAN_LOWER_END = 0x0586; // ֆ

export function toUpperArmenianChar(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= ARMENIAN_LOWER_START && code <= ARMENIAN_LOWER_END) {
    return String.fromCharCode(code - 48); // ա -> Ա
  }
  if (char === "և") return "Եվ";
  return char.toUpperCase();
}

export function formatArmenianPunctuation(text: string, endsSentence: boolean = false): string {
  if (!text || !text.trim()) return text;

  let formatted = text.trim();

  // 1. Replace ASCII period with Armenian full stop (։)
  formatted = formatted.replace(/\.(?=\s|$)/g, "։");

  // 2. Normalize spacing: remove space before ։, ensure space after ։ if followed by word
  formatted = formatted.replace(/\s+։/g, "։");
  formatted = formatted.replace(/։(?=[^\s։\?!])/g, "։ ");

  // 3. Sentence boundary terminal punctuation
  if (endsSentence && !/[։\?!]$/.test(formatted)) {
    formatted += "։";
  }

  // 4. Capitalize first letter of string
  const chars = Array.from(formatted);
  for (let i = 0; i < chars.length; i++) {
    if (/[a-zA-Zա-ֆԱ-Ֆ]/.test(chars[i])) {
      chars[i] = toUpperArmenianChar(chars[i]);
      break;
    }
  }

  // 5. Capitalize letters following ։, ?, !
  let result = chars.join("");
  result = result.replace(/([։\?!])(\s+)([ա-ֆa-zA-Z])/g, (_, p1, p2, letter) => {
    return `${p1}${p2}${toUpperArmenianChar(letter)}`;
  });

  return result;
}

