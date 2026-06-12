export interface WorkoutLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  levelCompleted?: string;
  /**
   * Workout variant completed that day.
   * - with_pushups: Navy Seal or 5-count pushup workout
   * - no_pushups: beginner burpees only
   */
  workoutType?: "with_pushups" | "no_pushups";
  notes?: string;
  repsCompleted?: number; // only set when auto-logged via the session timer
}

export type WorkoutTier = "beginner" | "advanced";

export interface UserData {
  userId?: string;
  /**
   * Set when the user completes their first 20-minute workout, not at signup.
   * Until then, the program hasn't "started" yet.
   */
  startDate?: string;
  startWeight: number;
  startPictureUrl: string | null;
  workoutTier?: WorkoutTier;
  /**
   * Selected weekly workout days using iOS Calendar weekday values:
   * Sunday=1, Monday=2, ... Saturday=7.
   */
  workoutDays?: number[];
  trialEndsAt?: string; // ISO timestamp

  endDate?: string;
  endWeight?: number;
  endPictureUrl?: string | null;

  isGraduated?: boolean;
  workoutLogs?: WorkoutLog[];
  workoutStats?: {
    workoutsCompleted: number;
    timerVerified: number;
  };
  currentLevelId?: string;

  // Stripe subscription
  isPro?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing";
}

export interface LevelDescription {
  id: string;
  name: string;
  description: string;
  seals: number;
  sixCounts: number;
  timeLimitMintues: number;
}

export const ADVANCED_LEVELS: LevelDescription[] = [
  {
    id: "F",
    name: "Foundation",
    description: "15 Navy Seals in 20 min, 40 5-count pushups in 20 min.",
    seals: 15,
    sixCounts: 40,
    timeLimitMintues: 20,
  },
  {
    id: "1",
    name: "Level 1",
    description: "30 Navy Seals in 20 min, 75 5-count pushups in 20 min.",
    seals: 30,
    sixCounts: 75,
    timeLimitMintues: 20,
  },
  {
    id: "2",
    name: "Level 2",
    description: "50 Navy Seals in 20 min, 125 5-count pushups in 20 min.",
    seals: 50,
    sixCounts: 125,
    timeLimitMintues: 20,
  },
  {
    id: "3",
    name: "Level 3",
    description: "70 Navy Seals in 20 min, 175 5-count pushups in 20 min.",
    seals: 70,
    sixCounts: 175,
    timeLimitMintues: 20,
  },
  {
    id: "4",
    name: "Level 4",
    description: "90 Navy Seals in 20 min, 225 5-count pushups in 20 min.",
    seals: 90,
    sixCounts: 225,
    timeLimitMintues: 20,
  },
  {
    id: "E",
    name: "Elite",
    description: "120 Navy Seals in 20 min, 300 5-count pushups in 20 min.",
    seals: 120,
    sixCounts: 300,
    timeLimitMintues: 20,
  },
];

export const BEGINNER_LEVELS: LevelDescription[] = [
  {
    id: "B1",
    name: "Beginner 1",
    description: "20 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 20,
    timeLimitMintues: 20,
  },
  {
    id: "B2",
    name: "Beginner 2",
    description: "40 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 40,
    timeLimitMintues: 20,
  },
  {
    id: "B3",
    name: "Beginner 3",
    description: "55 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 55,
    timeLimitMintues: 20,
  },
  {
    id: "B4",
    name: "Beginner 4",
    description: "70 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 70,
    timeLimitMintues: 20,
  },
  {
    id: "B5",
    name: "Beginner 5",
    description: "90 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 90,
    timeLimitMintues: 20,
  },
  {
    id: "B6",
    name: "Beginner 6",
    description: "110 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 110,
    timeLimitMintues: 20,
  },
];

export const LEVELS: LevelDescription[] = ADVANCED_LEVELS;
