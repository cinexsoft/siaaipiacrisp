// Simple in-memory DB. Replace with MongoDB adapter later.

export type Role = "interviewer" | "candidate";

export type User = {
  id: string;
  email: string;
  role: Role;
  password: string; // demo only; replace with hash
};

export type InterviewSession = {
  id: string;
  candidateUserId: string;
  stage: "collectingFields" | "interview" | "completed";
  currentIndex: number;
  createdAt: number;
};

export type CandidateProfile = {
  id: string;
  userId: string; // candidate user
  name: string;
  email: string;
  phone: string;
  resumeFileName?: string;
  qas: Array<{
    difficulty: "easy" | "medium" | "hard";
    question: string;
    answer: string;
    secondsAllocated: number;
    secondsUsed: number;
    score: number;
  }>;
  finalScore?: number;
  summary?: string;
  completed: boolean;
};

class InMemoryDB {
  users = new Map<string, User>();
  usersByEmail = new Map<string, string>();
  candidates = new Map<string, CandidateProfile>();
  sessions = new Map<string, InterviewSession>();
  // userId -> sessionId
  activeSessionByCandidate = new Map<string, string>();
  // email -> sessionId for anonymous mode
  activeSessionByEmail = new Map<string, string>();
}

// Singleton across server runtime
export const db = globalThis.__CRISP_DB__ || new InMemoryDB();
(globalThis as any).__CRISP_DB__ = db;

// Backfill fields if the singleton was created before fields were added
if (!(db as any).activeSessionByEmail) {
  (db as any).activeSessionByEmail = new Map<string, string>();
}


