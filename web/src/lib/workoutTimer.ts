import {
  HYBRID_PHASES,
  HYBRID_PHASE_DURATION_MINUTES,
  getHybridPhaseGoal,
  type SharedWorkoutTier,
} from "./programConfig";

/** "N" = Navy Seals, "C" = 5-Count Pushups, "H" = Hybrid (Phase 1 N → Phase 2 C) */
export type WorkoutMode = "N" | "C" | "H";

/**
 * Configuration for a single phase within a Hybrid workout.
 * The total workout is 20 min split across two HybridPhaseConfigs.
 */
export interface HybridPhaseConfig {
  mode: "N" | "C";
  label: string;
  durationMinutes: number;
  goal: number;
}

export interface WorkoutTimerModeConfig {
  mode: WorkoutMode;
  label: string;
  shortLabel: string;
  description: string;
  /** 0 for Hybrid mode — use hybridPhases for per-phase goals */
  goal: number;
  /** Only present when mode === "H". Exactly two phases: [NavySeals, FiveCount] */
  hybridPhases?: [HybridPhaseConfig, HybridPhaseConfig];
}

export interface WorkoutTimerConfig {
  tier: SharedWorkoutTier;
  initialMinutes: number;
  defaultMode: WorkoutMode;
  modes: WorkoutTimerModeConfig[];
}

interface BuildWorkoutTimerConfigOptions {
  tier: SharedWorkoutTier;
  initialMinutes?: number;
  sealsGoal?: number;
  sixCountsGoal?: number;
  /** Override the computed default mode (e.g. "H" on Fridays for advanced track) */
  defaultMode?: WorkoutMode;
}

export function buildWorkoutTimerConfig({
  tier,
  initialMinutes = 20,
  sealsGoal = 0,
  sixCountsGoal = 0,
  defaultMode,
}: BuildWorkoutTimerConfigOptions): WorkoutTimerConfig {
  if (tier === "beginner") {
    const beginnerGoal = sixCountsGoal > 0 ? sixCountsGoal : initialMinutes;

    return {
      tier,
      initialMinutes,
      defaultMode: "C",
      modes: [
        {
          mode: "C",
          label: "Beginner Session",
          shortLabel: "B",
          description: `${beginnerGoal} burpees (no pushups) in ${initialMinutes} minutes`,
          goal: beginnerGoal,
        },
      ],
    };
  }

  // ── Advanced track ─────────────────────────────────────────────────────────
  // Hybrid targets are defined by the shared program config.
  const hybridSealsGoal = getHybridPhaseGoal(sealsGoal);
  const hybridFiveCountGoal = getHybridPhaseGoal(sixCountsGoal);
  const [firstHybridPhase, secondHybridPhase] = HYBRID_PHASES;

  return {
    tier,
    initialMinutes,
    // Use caller-supplied defaultMode if provided (e.g. "H" on Fridays), else "N"
    defaultMode: defaultMode ?? "N",
    modes: [
      {
        mode: "N",
        label: "Navy Seals",
        shortLabel: "N",
        description: "Full range burpees",
        goal: sealsGoal,
      },
      {
        mode: "C",
        label: "5-Count Pushups",
        shortLabel: "C",
        description: "Strict 5-count pushup burpees",
        goal: sixCountsGoal,
      },
      // ── Hybrid mode (Friday): 10 min Navy Seals → 10 min 5-Count Pushups ──
      {
        mode: "H",
        label: "Hybrid",
        shortLabel: "H",
        description: `${hybridSealsGoal} ${firstHybridPhase.label} (${HYBRID_PHASE_DURATION_MINUTES} min) + ${hybridFiveCountGoal} ${secondHybridPhase.label} (${HYBRID_PHASE_DURATION_MINUTES} min)`,
        goal: 0, // per-phase goals live in hybridPhases
        hybridPhases: [
          {
            mode: firstHybridPhase.mode,
            label: firstHybridPhase.label,
            durationMinutes: HYBRID_PHASE_DURATION_MINUTES,
            goal: hybridSealsGoal,
          },
          {
            mode: secondHybridPhase.mode,
            label: secondHybridPhase.label,
            durationMinutes: HYBRID_PHASE_DURATION_MINUTES,
            goal: hybridFiveCountGoal,
          },
        ],
      },
    ],
  };
}

export function formatWorkoutTimerTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
