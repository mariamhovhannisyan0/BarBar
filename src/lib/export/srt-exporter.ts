/**
 * SRT (SubRip) Subtitle Exporter
 * Implements FR-012, FR-039, Section 8.1
 */

export interface TimedSegmentInput {
  startTime: number;
  endTime: number;
  text: string;
}

export function formatSrtTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);

  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  const mmm = millis.toString().padStart(3, "0");

  return `${hh}:${mm}:${ss},${mmm}`;
}

export function exportToSrt(segments: TimedSegmentInput[]): {
  content: string;
  mimeType: string;
} {
  const blocks: string[] = [];

  segments.forEach((seg, index) => {
    const cueIndex = index + 1;
    const startTs = formatSrtTimestamp(seg.startTime);
    const endTs = formatSrtTimestamp(seg.endTime);
    const text = seg.text.trim();

    blocks.push(`${cueIndex}\n${startTs} --> ${endTs}\n${text}\n`);
  });

  return {
    content: blocks.join("\n"),
    mimeType: "text/plain;charset=utf-8",
  };
}

