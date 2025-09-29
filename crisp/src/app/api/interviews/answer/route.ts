import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  const { email, question, difficulty, answer, secondsAllocated, secondsUsed, score } = await req.json();
  const sid = db.activeSessionByEmail.get(email);
  if (!sid) return NextResponse.json({ error: "no session" }, { status: 400 });
  const session = db.sessions.get(sid)!;
  const profile = [...db.candidates.values()].find((c) => c.email === email)!;
  profile.qas.push({ question, difficulty, answer, secondsAllocated, secondsUsed, score });
  session.currentIndex += 1;
  if (session.currentIndex >= 6) {
    session.stage = "completed";
    const sum = profile.qas.reduce((a, b) => a + (b.score || 0), 0);
    profile.finalScore = Math.round((sum / (profile.qas.length * 10)) * 100);
    profile.summary = "Candidate demonstrated full-stack fundamentals.";
    profile.completed = true;
  }
  return NextResponse.json({ ok: true, stage: session.stage, currentIndex: session.currentIndex, finalScore: profile.finalScore, summary: profile.summary });
}


