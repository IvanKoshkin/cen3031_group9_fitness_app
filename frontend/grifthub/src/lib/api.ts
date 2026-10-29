// Everything that talks to the Django backend lives in this file.
// Screens call these functions; they never call fetch() directly.
//
// RIGHT NOW the backend doesn't have sign-up or leaderboard endpoints yet,
// so USE_MOCK is true and these functions return fake data after a short delay.
// When the backend team adds the endpoints, set USE_MOCK = false and
// fix the URLs below to match what they built.

import { LEADERBOARD_MOCK } from "@/data/mockLeaderboard";

export const USE_MOCK = false;

// Django's dev server. On a phone running Expo Go, "localhost" means the
// phone itself, so replace this with your computer's IP (e.g. http://192.168.1.20:8000).
export const API_BASE = "http://localhost:8000";

// ---------- Types: the shape of the data we expect back ----------

export type LeaderboardEntry = {
  userId: number;
  displayName: string;
  points: number; // points this week
  workouts: number; // workouts logged this week
};

export type Leaderboard = {
  weekStart: string; // "2026-10-19" — weeks start Monday (see backend models.py)
  currentUserId: number;
  entries: LeaderboardEntry[]; // sorted, highest points first
};

export type SignUpInput = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

// ---------- Helpers ----------

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Django usually sends {"field": ["message"]} or {"detail": "message"}.
    throw new Error(body.detail ?? "Something went wrong. Please try again.");
  }
  return body as T;
}

// ---------- The actual API calls ----------

export async function signUp(input: SignUpInput): Promise<{ userId: number }> {
  if (USE_MOCK) {
    await wait(800);
    if (input.username.toLowerCase() === "taken") {
      throw new Error("That username is already taken.");
    }
    return { userId: 99 };
  }
  return request("/api/auth/register/", { method: "POST", body: JSON.stringify(input) });
}

export async function logIn(username: string, password: string): Promise<{ userId: number }> {
  if (USE_MOCK) {
    await wait(600);
    if (password.length < 8) throw new Error("Incorrect username or password.");
    return { userId: 99 };
  }
  return request("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getLeaderboard(): Promise<Leaderboard> {
  if (USE_MOCK) {
    await wait(700);
    return LEADERBOARD_MOCK;
  }
  return request("/leaderboard/weekly/");
}
