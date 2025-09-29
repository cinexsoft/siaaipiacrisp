import { getConfig } from "@/server/config";

export type ExtractResult = {
  name?: string;
  email?: string;
  phone?: string;
  questions?: Array<{ difficulty: "easy"|"medium"|"hard"; question: string }>;
};

export async function extractWithOpenAI(resumeText: string): Promise<ExtractResult> {
  const cfg = getConfig();
  const { apiKey, baseUrl, model } = cfg.openai;
  if (!apiKey) {
    return {};
  }
  const prompt = buildPrompt(resumeText);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are an ATS parser and interview question generator." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error("openai error");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const json = safeParse(content);
    return json || {};
  } catch {
    return {};
  }
}

function buildPrompt(text: string): string {
  return `You will receive a resume's plain text. Extract:
1) candidate_name
2) email
3) phone
4) questions: exactly 6 questions for a full-stack (React/Node) role: 2 easy (20s), 2 medium (60s), 2 hard (120s). Include at least one output-based coding question. Each item requires fields: difficulty in {easy,medium,hard}, question (string).
Return ONLY valid minified JSON in this exact shape:
{
  "name": "",
  "email": "",
  "phone": "",
  "questions": [
    {"difficulty":"easy","question":"..."},
    {"difficulty":"easy","question":"..."},
    {"difficulty":"medium","question":"..."},
    {"difficulty":"medium","question":"..."},
    {"difficulty":"hard","question":"..."},
    {"difficulty":"hard","question":"..."}
  ]
}
If data is missing, leave the field empty and do not hallucinate.

Resume text:
---
${text}
---`;
}

function safeParse<T = any>(s: string): T | undefined {
  try { return JSON.parse(s); } catch { return undefined; }
}


