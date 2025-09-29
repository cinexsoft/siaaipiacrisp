import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export type QA = {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answer: string;
  secondsAllocated: number;
  secondsUsed: number;
  score: number; // 0-10
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFileName?: string;
  createdAt: number;
  completed: boolean;
  finalScore: number;
  summary: string;
  qas: QA[];
};

type CandidatesState = {
  all: Record<string, Candidate>;
};

const initialState: CandidatesState = { all: {} };

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    upsertCandidate(
      state,
      action: PayloadAction<Partial<Candidate> & { id?: string }>
    ) {
      const id = action.payload.id ?? nanoid();
      const prev = state.all[id];
      const merged: Candidate = {
        id,
        name: "",
        email: "",
        phone: "",
        createdAt: prev?.createdAt ?? Date.now(),
        completed: prev?.completed ?? false,
        finalScore: prev?.finalScore ?? 0,
        summary: prev?.summary ?? "",
        qas: prev?.qas ?? [],
        ...action.payload,
      } as Candidate;
      state.all[id] = merged;
    },
    addQA(
      state,
      action: PayloadAction<{ candidateId: string; qa: Omit<QA, "id"> }>
    ) {
      const { candidateId, qa } = action.payload;
      const candidate = state.all[candidateId];
      if (!candidate) return;
      candidate.qas.push({ id: nanoid(), ...qa });
    },
    finalizeCandidate(
      state,
      action: PayloadAction<{ candidateId: string; finalScore: number; summary: string }>
    ) {
      const c = state.all[action.payload.candidateId];
      if (!c) return;
      c.finalScore = action.payload.finalScore;
      c.summary = action.payload.summary;
      c.completed = true;
    },
  },
});

export const { upsertCandidate, addQA, finalizeCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;


