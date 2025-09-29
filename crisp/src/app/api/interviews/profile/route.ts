import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  const { name, email, phone, resumeFileName } = await req.json();
  const profile = [...db.candidates.values()].find((c) => c.email === email);
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (name !== undefined) profile.name = name;
  if (email !== undefined) profile.email = email;
  if (phone !== undefined) profile.phone = phone;
  if (resumeFileName !== undefined) profile.resumeFileName = resumeFileName;
  return NextResponse.json({ ok: true, profile });
}


