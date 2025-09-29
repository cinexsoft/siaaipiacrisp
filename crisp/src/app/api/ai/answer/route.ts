import { NextRequest, NextResponse } from "next/server";

function scoreAnswer(ans: string, diff: "easy"|"medium"|"hard"): number {
  if (!ans.trim()) return 0;
  const base = ans.length > 20 ? 6 : 3;
  const bonus = /react|node|next|typescript|optimization/i.test(ans) ? 3 : 1;
  const diffBonus = diff === "hard" ? 2 : diff === "medium" ? 1 : 0;
  return Math.min(10, base + bonus + diffBonus);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answer, difficulty, allScores } = body as {
      answer: string;
      difficulty: "easy"|"medium"|"hard";
      allScores?: number[];
    };
    const score = scoreAnswer(answer || "", difficulty);
    const scores = [...(allScores || []), score];
    const done = scores.length >= 6;
    const finalScore = done ? Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) * 100) : undefined;
    const summary = done ? "Candidate demonstrated solid full-stack fundamentals." : undefined;
    return NextResponse.json({ score, done, finalScore, summary });
  } catch (e: any) {
    return NextResponse.json({ error: "failed to score" }, { status: 500 });
  }
}


