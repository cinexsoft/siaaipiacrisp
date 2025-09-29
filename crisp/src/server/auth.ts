import { cookies } from "next/headers";
import { db, User } from "@/server/db";
import { nanoid } from "@reduxjs/toolkit";

const COOKIE = "crisp_session";

type SessionValue = {
  userId: string;
};

export async function getCurrentUser(): Promise<User | undefined> {
  const store = await cookies();
  const cookie = store.get(COOKIE);
  if (!cookie?.value) return undefined;
  const value = safeParse<SessionValue>(cookie.value);
  if (!value) return undefined;
  const user = db.users.get(value.userId);
  return user;
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify({ userId } as SessionValue), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

function safeParse<T>(str: string): T | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

// Seed admin interviewer user once
if (!db.usersByEmail.has("admin")) {
  const id = nanoid();
  const user: User = { id, email: "admin", role: "interviewer", password: "admin" };
  db.users.set(id, user);
  db.usersByEmail.set(user.email, id);
}


