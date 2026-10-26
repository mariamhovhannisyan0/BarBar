const ARMENIAN_LOWER_START = 0x0561;
const ARMENIAN_LOWER_END = 0x0586;

export function toUpperArmenianChar(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= ARMENIAN_LOWER_START && code <= ARMENIAN_LOWER_END) {
    return String.fromCharCode(code - 48);
  }
  if (char === "և") return "Եվ";
  return char.toUpperCase();
}

export function formatArmenianPunctuation(text: string, endsSentence: boolean = false): string {
  if (!text || !text.trim()) return text;

  let formatted = text.trim();

  formatted = formatted.replace(/\.(?=\s|$)/g, "։");
  formatted = formatted.replace(/\s+։/g, "։");
  formatted = formatted.replace(/։(?=[^\s։\?!])/g, "։ ");

  if (endsSentence && !/[։\?!]$/.test(formatted)) {
    formatted += "։";
  }

  const chars = Array.from(formatted);
  for (let i = 0; i < chars.length; i++) {
    if (/[a-zA-Zա-ֆԱ-Ֆ]/.test(chars[i])) {
      chars[i] = toUpperArmenianChar(chars[i]);
      break;
    }
  }

  let result = chars.join("");
  result = result.replace(/([։\?!])(\s+)([ա-ֆa-zA-Z])/g, (_, p1, p2, letter) => {
    return `${p1}${p2}${toUpperArmenianChar(letter)}`;
  });

  return result;
}
