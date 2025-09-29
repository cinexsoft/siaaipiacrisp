import { NextRequest, NextResponse } from "next/server";
import { db, CandidateProfile, InterviewSession } from "@/server/db";
import { nanoid } from "@reduxjs/toolkit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // find or create candidate user
  let candidateUserId = db.usersByEmail.get(email);
  if (!candidateUserId) {
    const id = nanoid();
    db.users.set(id, { id, email, role: "candidate", password: "temp123" });
    db.usersByEmail.set(email, id);
    candidateUserId = id;
  }

  // ensure candidate profile exists
  let profile = [...db.candidates.values()].find((c) => c.userId === candidateUserId);
  if (!profile) {
    profile = {
      id: nanoid(),
      userId: candidateUserId,
      name: "",
      email,
      phone: "",
      qas: [],
      completed: false,
    } as CandidateProfile;
    db.candidates.set(profile.id, profile);
  }

  // create session
  const session: InterviewSession = {
    id: nanoid(),
    candidateUserId,
    stage: "collectingFields",
    currentIndex: 0,
    createdAt: Date.now(),
  };
  db.sessions.set(session.id, session);
  db.activeSessionByCandidate.set(candidateUserId, session.id);
  db.activeSessionByEmail.set(email, session.id);

  return NextResponse.json({ sessionId: session.id, candidateUserId, tempPassword: "temp123" });
}


