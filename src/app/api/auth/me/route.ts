import { NextRequest, NextResponse } from "next/server";
import { User, syncDatabase } from "@/lib/db/models";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: true, authenticated: false, user: null },
        { status: 200 }
      );
    }

    await syncDatabase();
    const user = await User.findByPk(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: true, authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        settings: user.settings || {},
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, authenticated: false, user: null, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Անհրաժեշտ է մուտք գործել համակարգ։" },
        { status: 401 }
      );
    }

    await syncDatabase();
    const user = await User.findByPk(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Օգտատերը չի գտնվել։" },
        { status: 404 }
      );
    }

    const body = await req.json();
    if (body.fullName && String(body.fullName).trim().length >= 2) {
      user.fullName = String(body.fullName).trim();
    }
    if (body.settings && typeof body.settings === "object") {
      user.settings = { ...(user.settings || {}), ...body.settings };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        settings: user.settings || {},
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

