import { NextRequest, NextResponse } from "next/server";
import {
  TranscriptionSession,
  TranscriptionSegment,
  ArmenianizationSpan,
  syncDatabase,
} from "@/lib/db/models";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id } = await params;

    const session = await TranscriptionSession.findByPk(id, {
      include: [
        {
          model: TranscriptionSegment,
          as: "segments",
          include: [
            {
              model: ArmenianizationSpan,
              as: "replacements",
            },
          ],
        },
      ],
      order: [[{ model: TranscriptionSegment, as: "segments" }, "sequenceOrder", "ASC"]],
    });

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const body = await req.json();

    const session = await TranscriptionSession.findByPk(id);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    if (body.title !== undefined) session.title = body.title;
    if (body.status !== undefined) session.status = body.status;
    if (body.durationSeconds !== undefined) session.durationSeconds = body.durationSeconds;
    if (body.hasUnsavedChanges !== undefined) session.hasUnsavedChanges = body.hasUnsavedChanges;
    if (body.sourceMediaAvailable !== undefined) session.sourceMediaAvailable = body.sourceMediaAvailable;

    await session.save();

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("PATCH /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await syncDatabase();
    const { id } = await params;

    const session = await TranscriptionSession.findByPk(id);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    await session.destroy();

    return NextResponse.json({ success: true, message: "Session deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

