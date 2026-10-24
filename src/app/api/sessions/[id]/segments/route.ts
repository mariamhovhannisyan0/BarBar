import { NextRequest, NextResponse } from "next/server";
import {
  TranscriptionSession,
  TranscriptionSegment,
  ArmenianizationSpan,
  syncDatabase,
} from "@/lib/db/models";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id: sessionId } = await params;
    const body = await req.json();

    const session = await TranscriptionSession.findByPk(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    // Segment creation or update
    if (body.segmentId) {
      // Update existing segment
      const segment = await TranscriptionSegment.findByPk(body.segmentId);
      if (segment) {
        if (body.finalizedText !== undefined) {
          segment.finalizedText = body.finalizedText;
          segment.isEdited = true;
        }
        await segment.save();
        return NextResponse.json({ success: true, segment });
      }
    }

    // Determine sequence order
    const count = await TranscriptionSegment.count({ where: { sessionId } });

    const segment = await TranscriptionSegment.create({
      sessionId,
      sequenceOrder: body.sequenceOrder ?? count + 1,
      startTime: body.startTime ?? 0.0,
      endTime: body.endTime ?? 0.0,
      rawText: body.rawText || "",
      finalizedText: body.finalizedText || "",
      isEdited: body.isEdited ?? false,
      confidence: body.confidence ?? 0.95,
    });

    // If replacement spans were provided
    if (Array.isArray(body.replacements)) {
      for (const rep of body.replacements) {
        await ArmenianizationSpan.create({
          segmentId: segment.id,
          originalToken: rep.originalToken,
          replacementToken: rep.replacedWith || rep.replacementToken,
          lemma: rep.lemma,
          startCharIndex: rep.startIndex ?? 0,
          endCharIndex: rep.endIndex ?? 0,
          confidence: rep.confidence ?? 0.9,
          state: rep.state || "applied",
        });
      }
    }

    return NextResponse.json({ success: true, segment });
  } catch (error: any) {
    console.error("POST /api/sessions/[id]/segments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

