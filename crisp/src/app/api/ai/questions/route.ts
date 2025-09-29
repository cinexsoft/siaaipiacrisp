import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const index = Number(body?.index ?? 0);
    const difficulty = index < 2 ? "easy" : index < 4 ? "medium" : "hard";
    const seconds = difficulty === "easy" ? 20 : difficulty === "medium" ? 60 : 120;
    const bank: Record<string, string[]> = {
      easy: [
        "Explain the difference between var, let, and const in JavaScript.",
        "What is JSX and why is it used in React?",
      ],
      medium: [
        "How does React reconciliation work and when do keys matter?",
        "Explain event loop in Node.js and how async I/O is handled.",
      ],
      hard: [
        "Design a scalable file upload service in Node.js with chunking and retries.",
        "How would you optimize a Next.js app for TTFB and LCP at scale?",
      ],
    };
    const q = bank[difficulty][index % 2];
    return NextResponse.json({ difficulty, seconds, question: q });
  } catch (e: any) {
    return NextResponse.json({ error: "failed to generate question" }, { status: 500 });
  }
}


