import { NextRequest, NextResponse } from "next/server";
import { User, syncDatabase } from "@/lib/db/models";
import { verifyPassword } from "@/lib/auth/password";
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    await syncDatabase();

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Խնդրում ենք լրացնել էլ․ փոստն ու գաղտնաբառը։" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "Սխալ էլ․ փոստ կամ գաղտնաբառ։" },
        { status: 401 }
      );
    }

    const userId = user.id || (user.get("id") as string);
    const token = await signSessionToken({
      id: userId,
      email: user.email,
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        settings: user.settings || {},
        createdAt: user.createdAt,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Մուտք գործելու ժամանակ տեղի ունեցավ սխալ։" },
      { status: 500 }
    );
  }
}

