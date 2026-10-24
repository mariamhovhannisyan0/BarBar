/**
 * TXT Exporter
 * Implements FR-038, A-013:
 * - Lossless UTF-8 export
 * - Optional Byte Order Mark (\uFEFF) to guarantee correct rendering on Windows Notepad / Office
 */

export function exportToTxt(
  title: string,
  transcriptText: string,
  options: { includeBom?: boolean } = { includeBom: true }
): { content: string; mimeType: string } {
  const bom = options.includeBom ? "\uFEFF" : "";
  const header = `BarBar — ${title}\n${"=".repeat(40)}\n\n`;
  const fullContent = bom + header + transcriptText + "\n";

  return {
    content: fullContent,
    mimeType: "text/plain;charset=utf-8",
  };
}

