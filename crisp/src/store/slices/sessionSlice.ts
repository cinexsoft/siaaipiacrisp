import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export type InterviewProgress = {
  candidateId: string;
  stage: "collectingFields" | "interview" | "completed";
  requiredFields: { name: boolean; email: boolean; phone: boolean };
  // Question timing
  currentIndex: number; // 0..5
  currentDifficulty: "easy" | "medium" | "hard";
  startedAtMs?: number;
  deadlineMs?: number;
  // chat log ids for mapping if needed later
};

export type SessionState = {
  activeSessionId?: string;
  sessions: Record<string, InterviewProgress>;
  welcomeBackSeen: boolean;
};

const initialState: SessionState = {
  sessions: {},
  welcomeBackSeen: false,
};

function difficultyForIndex(index: number): "easy" | "medium" | "hard" {
  if (index < 2) return "easy";
  if (index < 4) return "medium";
  return "hard";
}

function secondsForDifficulty(d: "easy" | "medium" | "hard"): number {
  if (d === "easy") return 20;
  if (d === "medium") return 60;
  return 120;
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    startNewSession(state) {
      const id = nanoid();
      const candidateId = nanoid();
      state.activeSessionId = id;
      state.sessions[id] = {
        candidateId,
        stage: "collectingFields",
        requiredFields: { name: true, email: true, phone: true },
        currentIndex: 0,
        currentDifficulty: "easy",
      };
    },
    startSessionWithCandidate(state, action: PayloadAction<{ candidateId: string }>) {
      const id = nanoid();
      state.activeSessionId = id;
      state.sessions[id] = {
        candidateId: action.payload.candidateId,
        stage: "collectingFields",
        requiredFields: { name: true, email: true, phone: true },
        currentIndex: 0,
        currentDifficulty: "easy",
      };
    },
    restoreSession(state, action: PayloadAction<string>) {
      if (state.sessions[action.payload]) {
        state.activeSessionId = action.payload;
      }
    },
    markFieldProvided(
      state,
      action: PayloadAction<{ field: "name" | "email" | "phone" }>
    ) {
      const s = state.sessions[state.activeSessionId ?? ""];
      if (!s) return;
      s.requiredFields[action.payload.field] = false;
      const allDone = Object.values(s.requiredFields).every((v) => !v);
      if (allDone && s.stage === "collectingFields") {
        s.stage = "interview";
        s.currentIndex = 0;
        s.currentDifficulty = "easy";
        const secs = secondsForDifficulty(s.currentDifficulty);
        const now = Date.now();
        s.startedAtMs = now;
        s.deadlineMs = now + secs * 1000;
      }
    },
    tickToNextQuestion(state) {
      const s = state.sessions[state.activeSessionId ?? ""];
      if (!s) return;
      if (s.currentIndex >= 5) return; // handled by completeInterview
      s.currentIndex += 1;
      s.currentDifficulty = difficultyForIndex(s.currentIndex);
      const secs = secondsForDifficulty(s.currentDifficulty);
      const now = Date.now();
      s.startedAtMs = now;
      s.deadlineMs = now + secs * 1000;
    },
    restoreTiming(state) {
      const s = state.sessions[state.activeSessionId ?? ""];
      if (!s) return;
      const secs = secondsForDifficulty(difficultyForIndex(s.currentIndex));
      if (!s.startedAtMs || !s.deadlineMs) {
        const now = Date.now();
        s.startedAtMs = now;
        s.deadlineMs = now + secs * 1000;
      }
    },
    completeInterview(state) {
      const s = state.sessions[state.activeSessionId ?? ""];
      if (!s) return;
      s.stage = "completed";
    },
    setWelcomeBackSeen(state, action: PayloadAction<boolean>) {
      state.welcomeBackSeen = action.payload;
    },
  },
});

export const {
  startNewSession,
  startSessionWithCandidate,
  restoreSession,
  markFieldProvided,
  tickToNextQuestion,
  restoreTiming,
  completeInterview,
  setWelcomeBackSeen,
} = sessionSlice.actions;

export default sessionSlice.reducer;


