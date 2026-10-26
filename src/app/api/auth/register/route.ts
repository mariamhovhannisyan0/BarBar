import { NextRequest, NextResponse } from "next/server";
import { User, syncDatabase } from "@/lib/db/models";
import { seedDatabaseIfEmpty } from "@/lib/db/seed";
import { hashPassword } from "@/lib/auth/password";
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
} from "@/lib/auth/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    await syncDatabase();
    await seedDatabaseIfEmpty();

    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Խնդրում ենք մուտքագրել Ձեր անունը (առնվազն 2 նիշ)։" },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Խնդրում ենք մուտքագրել վավեր էլ․ փոստի հասցե։" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Գաղտնաբառը պետք է պարունակի առնվազն 6 նիշ։" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Այս էլ․ փոստով օգտատեր արդեն գրանցված է։" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const user = await User.create({
      email,
      fullName,
      passwordHash,
      settings: {},
    });

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
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Գրանցման ժամանակ տեղի ունեցավ սխալ։" },
      { status: 500 }
    );
  }
}

