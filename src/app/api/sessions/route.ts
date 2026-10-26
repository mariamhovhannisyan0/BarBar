import { NextRequest, NextResponse } from "next/server";
import { TranscriptionSession, TranscriptionSegment } from "@/lib/db/models";
import { seedDatabaseIfEmpty } from "@/lib/db/seed";
import { getSessionFromRequest } from "@/lib/auth/session";
import { Op } from "sequelize";

export async function GET(req: NextRequest) {
  try {
    const authSession = await getSessionFromRequest(req);
    if (!authSession) {
      return NextResponse.json(
        { success: false, error: "Անհրաժեշտ է մուտք գործել համակարգ պատմությունը դիտելու համար։" },
        { status: 401 }
      );
    }

    await seedDatabaseIfEmpty();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "";

    const whereClause: any = {
      [Op.or]: [{ userId: authSession.userId }, { userId: null }],
    };

    if (query) {
      whereClause.title = { [Op.like]: `%${query}%` };
    }
    if (mode && ["audio_file", "video_file", "live_microphone"].includes(mode)) {
      whereClause.mode = mode;
    }

    const sessions = await TranscriptionSession.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: TranscriptionSegment,
          as: "segments",
          attributes: ["id", "sequenceOrder", "startTime", "endTime", "finalizedText"],
        },
      ],
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await seedDatabaseIfEmpty();
    const authSession = await getSessionFromRequest(req);
    const body = await req.json();

    const session = await TranscriptionSession.create({
      userId: authSession?.userId || null,
      title: body.title || "Անանուն սղագրություն",
      mode: body.mode || "audio_file",
      status: body.status || "idle",
      sourceFileName: body.sourceFileName,
      sourceFileUrl: body.sourceFileUrl,
      sourceMediaAvailable: true,
      durationSeconds: body.durationSeconds || 0,
      modelIdentifier: body.modelIdentifier || "taruma/whisper-small-armenian",
      armenianizationEnabled: body.armenianizationEnabled ?? true,
      punctuationEnabled: body.punctuationEnabled ?? true,
      hasUnsavedChanges: false,
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
