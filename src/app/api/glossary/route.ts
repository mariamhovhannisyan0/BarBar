import { NextRequest, NextResponse } from "next/server";
import { GlossaryTerm, syncDatabase } from "@/lib/db/models";
import { seedDatabaseIfEmpty } from "@/lib/db/seed";

export async function GET() {
  try {
    await seedDatabaseIfEmpty();
    const terms = await GlossaryTerm.findAll({
      order: [["isSystem", "DESC"], ["foreignStem", "ASC"]],
    });
    return NextResponse.json({ success: true, terms });
  } catch (error: any) {
    console.error("GET /api/glossary error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncDatabase();
    const body = await req.json();

    if (!body.foreignStem || !body.armenianLemma) {
      return NextResponse.json(
        { success: false, error: "foreignStem and armenianLemma are required" },
        { status: 400 }
      );
    }

    const term = await GlossaryTerm.create({
      foreignStem: body.foreignStem.trim().toLowerCase(),
      armenianLemma: body.armenianLemma.trim(),
      category: body.category || "custom",
      confidence: body.confidence || 0.95,
      isSystem: false,
    });

    return NextResponse.json({ success: true, term });
  } catch (error: any) {
    console.error("POST /api/glossary error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await syncDatabase();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const term = await GlossaryTerm.findByPk(id);
    if (!term) {
      return NextResponse.json({ success: false, error: "Term not found" }, { status: 404 });
    }

    await term.destroy();
    return NextResponse.json({ success: true, message: "Glossary term deleted" });
  } catch (error: any) {
    console.error("DELETE /api/glossary error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

