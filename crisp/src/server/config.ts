import fs from "node:fs";
import path from "node:path";

type AppConfig = {
  openai: { apiKey: string; baseUrl: string; model: string };
  interview: { numQuestions: number; timers: { easy: number; medium: number; hard: number } };
};

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const file = path.join(process.cwd(), "config.json");
  const text = fs.readFileSync(file, "utf8");
  const json = JSON.parse(text);
  // overlay env if present
  if (process.env.OPENAI_API_KEY) json.openai.apiKey = process.env.OPENAI_API_KEY;
  cached = json as AppConfig;
  return cached;
}


