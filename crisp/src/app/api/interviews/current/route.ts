import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ session: null });
  const sid = db.activeSessionByEmail.get(email);
  if (!sid) return NextResponse.json({ session: null });
  const s = db.sessions.get(sid);
  return NextResponse.json({ session: s });
}


