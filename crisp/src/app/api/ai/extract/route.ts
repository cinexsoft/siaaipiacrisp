import { NextRequest, NextResponse } from "next/server";
import { extractWithOpenAI } from "@/server/openai";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const fileName = file.name || "resume.pdf";
    const buf = await file.arrayBuffer();
    // naive text decode; ideally parse PDF/DOCX client-side and send text
    const text = new TextDecoder().decode(new Uint8Array(buf));
    const ai = await extractWithOpenAI(text);
    // Fallback: if AI missing keys, create demo defaults
    const result = {
      name: ai.name || "",
      email: ai.email || "",
      phone: ai.phone || "",
      resumeFileName: fileName,
      questions: ai.questions && ai.questions.length === 6 ? ai.questions : undefined,
    };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: "failed to extract" }, { status: 500 });
  }
}


