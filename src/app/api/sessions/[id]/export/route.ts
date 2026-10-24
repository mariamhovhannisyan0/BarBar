import { NextRequest, NextResponse } from "next/server";
import { TranscriptionSession, TranscriptionSegment, syncDatabase } from "@/lib/db/models";
import { exportToTxt } from "@/lib/export/txt-exporter";
import { exportToDocx } from "@/lib/export/docx-exporter";
import { exportToSrt } from "@/lib/export/srt-exporter";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") || "txt";

    const session = await TranscriptionSession.findByPk(id, {
      include: [
        {
          model: TranscriptionSegment,
          as: "segments",
        },
      ],
      order: [[{ model: TranscriptionSegment, as: "segments" }, "sequenceOrder", "ASC"]],
    });

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const segments: any[] = (session as any).segments || [];
    const safeTitle = session.title.replace(/[\/\\?%*:|"<>]/g, "_") || "transcript";

    if (format === "txt") {
      const fullText = segments.map((s) => s.finalizedText).join(" ");
      const { content, mimeType } = exportToTxt(session.title, fullText);

      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(safeTitle)}.txt"`,
        },
      });
    }

    if (format === "docx") {
      const docxSegments = segments.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.finalizedText,
      }));

      const docxBuffer = await exportToDocx(session.title, docxSegments, {
        duration: session.durationSeconds,
        mode: session.mode,
        createdAt: session.createdAt,
        sourceFileName: session.sourceFileName,
      });

      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(safeTitle)}.docx"`,
        },
      });
    }

    if (format === "srt") {
      const hasTimestamps = segments.length > 0 && segments.some((s) => s.endTime > 0);
      if (!hasTimestamps) {
        return NextResponse.json(
          {
            success: false,
            error: "SRT export requires timed segments. Timestamps are missing in this transcript.",
          },
          { status: 400 }
        );
      }

      const srtSegments = segments.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.finalizedText,
      }));

      const { content, mimeType } = exportToSrt(srtSegments);

      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(safeTitle)}.srt"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported export format" }, { status: 400 });
  } catch (error: any) {
    console.error("GET /api/sessions/[id]/export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
