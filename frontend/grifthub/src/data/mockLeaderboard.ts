import type { Leaderboard } from "@/lib/api";

// Fake data so you can build the leaderboard before the backend is ready.
// It deliberately includes a tie (Priya and Marcus) and a user with 0 points,
// so you can see how the screen handles those cases.

export const LEADERBOARD_MOCK: Leaderboard = {
  weekStart: "2026-10-19",
  currentUserId: 99,
  entries: [
    { userId: 1, displayName: "Jordan Lee", points: 842, workouts: 9 },
    { userId: 2, displayName: "Priya Shah", points: 790, workouts: 8 },
    { userId: 3, displayName: "Marcus Bell", points: 790, workouts: 11 },
    { userId: 4, displayName: "Ana Ruiz", points: 655, workouts: 7 },
    { userId: 5, displayName: "Theo Kim", points: 610, workouts: 6 },
    { userId: 6, displayName: "Sam Okafor", points: 540, workouts: 6 },
    { userId: 7, displayName: "Lena Novak", points: 498, workouts: 5 },
    { userId: 8, displayName: "Chris Park", points: 430, workouts: 5 },
    { userId: 99, displayName: "You", points: 388, workouts: 4 },
    { userId: 9, displayName: "Maya Chen", points: 305, workouts: 4 },
    { userId: 10, displayName: "Dev Patel", points: 240, workouts: 3 },
    { userId: 11, displayName: "Riley Brooks", points: 156, workouts: 2 },
    { userId: 12, displayName: "Noah Grant", points: 0, workouts: 0 },
  ],
};

// To test the empty state, temporarily replace `entries` above with: entries: []
