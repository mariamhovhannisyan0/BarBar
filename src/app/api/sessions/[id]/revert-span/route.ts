import { NextRequest, NextResponse } from "next/server";
import {
  TranscriptionSegment,
  ArmenianizationSpan,
  syncDatabase,
} from "@/lib/db/models";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id: sessionId } = await params;
    const body = await req.json();
    const { spanId, segmentId } = body;

    if (!spanId) {
      return NextResponse.json({ success: false, error: "spanId is required" }, { status: 400 });
    }

    const span = await ArmenianizationSpan.findByPk(spanId);
    if (!span) {
      return NextResponse.json({ success: false, error: "Span not found" }, { status: 404 });
    }

    // Toggle state: if applied -> revert, if reverted -> re-apply
    const newState = span.state === "reverted" ? "applied" : "reverted";
    span.state = newState;
    await span.save();

    // Update segment text
    const segment = await TranscriptionSegment.findByPk(span.segmentId);
    if (segment) {
      if (newState === "reverted") {
        segment.finalizedText = segment.finalizedText.replace(
          span.replacementToken,
          span.originalToken
        );
      } else {
        segment.finalizedText = segment.finalizedText.replace(
          span.originalToken,
          span.replacementToken
        );
      }
      segment.isEdited = true;
      await segment.save();
    }

    return NextResponse.json({
      success: true,
      span,
      updatedFinalizedText: segment?.finalizedText,
    });
  } catch (error: any) {
    console.error("POST /api/sessions/[id]/revert-span error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

