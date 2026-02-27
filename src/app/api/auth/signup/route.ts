import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const emailTrim = email.trim().toLowerCase();
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({
      where: { email: emailTrim },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: emailTrim,
        name: (name && String(name).trim()) || emailTrim.split("@")[0],
        passwordHash,
      },
    });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
