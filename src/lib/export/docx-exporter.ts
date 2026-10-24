import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";

export interface DocxSegmentInput {
  startTime?: number;
  endTime?: number;
  text: string;
}

export async function exportToDocx(
  title: string,
  segments: DocxSegmentInput[],
  metadata: {
    duration?: number;
    mode?: string;
    createdAt?: Date | string;
    sourceFileName?: string;
  } = {}
): Promise<Buffer> {
  const dateStr = metadata.createdAt
    ? new Date(metadata.createdAt).toLocaleString("hy-AM", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString();

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Ամսաթիվ: ${dateStr}  |  Տևողություն: ${
            metadata.duration ? Math.round(metadata.duration) + "վ" : "—"
          }  |  Ռեժիմ: ${metadata.mode || "Audio"}`,
          italics: true,
          color: "666666",
          size: 20,
          font: "Noto Sans Armenian",
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const seg of segments) {
    const timecodePrefix =
      seg.startTime !== undefined && seg.endTime !== undefined
        ? `[${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}] `
        : "";

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: timecodePrefix,
            bold: true,
            color: "4f46e5",
            size: 20,
            font: "Noto Sans Armenian",
          }),
          new TextRun({
            text: seg.text,
            size: 24,
            font: "Noto Sans Armenian",
          }),
        ],
        spacing: { after: 240, line: 360 }, // 1.25 line spacing
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

