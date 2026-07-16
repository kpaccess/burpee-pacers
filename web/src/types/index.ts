import {
  ADVANCED_LEVELS,
  BEGINNER_LEVELS,
  LEVELS,
  type LevelDescription,
} from "@/lib/programConfig";

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

export type { LevelDescription };
export { ADVANCED_LEVELS, BEGINNER_LEVELS, LEVELS };
