import rawProgramConfig from "../config/program-config.json";

export type SharedWorkoutTier = "beginner" | "advanced";
export type ProgramWorkoutMode = "N" | "C" | "H";

export interface ProgramTrackConfig {
  id: SharedWorkoutTier;
  displayName: string;
  availableModes: ProgramWorkoutMode[];
}

export interface ProgramLevelConfig {
  id: string;
  track: SharedWorkoutTier;
  displayName: string;
  description: string;
  sealsGoal: number;
  fiveCountGoal: number;
  timeLimitMinutes: number;
}

export interface ProgramHybridPhaseConfig {
  mode: Exclude<ProgramWorkoutMode, "H">;
  label: string;
}

export interface SharedProgramConfig {
  version: number;
  access: {
    launchAccessEnabled: boolean;
  };
  tracks: ProgramTrackConfig[];
  levels: ProgramLevelConfig[];
  defaultModeByWeekday: Record<SharedWorkoutTier, Partial<Record<string, ProgramWorkoutMode>>>;
  hybridRules: {
    phaseDurationMinutes: number;
    goalSplit: "ceil_half";
    phases: [ProgramHybridPhaseConfig, ProgramHybridPhaseConfig];
  };
}

export interface LevelDescription {
  id: string;
  name: string;
  description: string;
  seals: number;
  sixCounts: number;
  timeLimitMintues: number;
}

function assertProgramConfig(value: unknown): asserts value is SharedProgramConfig {
  if (!value || typeof value !== "object") {
    throw new Error("Program config is missing");
  }

  const config = value as Partial<SharedProgramConfig>;
  if (typeof config.version !== "number") {
    throw new Error("Program config version is missing");
  }
  if (!Array.isArray(config.tracks) || config.tracks.length === 0) {
    throw new Error("Program config tracks are missing");
  }
  if (!Array.isArray(config.levels) || config.levels.length === 0) {
    throw new Error("Program config levels are missing");
  }
  if (!config.defaultModeByWeekday?.advanced || !config.defaultModeByWeekday?.beginner) {
    throw new Error("Program config weekday defaults are missing");
  }
  if (
    !config.hybridRules ||
    config.hybridRules.goalSplit !== "ceil_half" ||
    !Array.isArray(config.hybridRules.phases) ||
    config.hybridRules.phases.length !== 2
  ) {
    throw new Error("Program config hybrid rules are invalid");
  }
}

assertProgramConfig(rawProgramConfig);

export const PROGRAM_CONFIG: SharedProgramConfig = rawProgramConfig;
export const HYBRID_PHASE_DURATION_MINUTES = PROGRAM_CONFIG.hybridRules.phaseDurationMinutes;
export const HYBRID_PHASES = PROGRAM_CONFIG.hybridRules.phases;

function toLevelDescription(level: ProgramLevelConfig): LevelDescription {
  return {
    id: level.id,
    name: level.displayName,
    description: level.description,
    seals: level.sealsGoal,
    sixCounts: level.fiveCountGoal,
    timeLimitMintues: level.timeLimitMinutes,
  };
}

export const ADVANCED_LEVELS: LevelDescription[] = PROGRAM_CONFIG.levels
  .filter((level) => level.track === "advanced")
  .map(toLevelDescription);

export const BEGINNER_LEVELS: LevelDescription[] = PROGRAM_CONFIG.levels
  .filter((level) => level.track === "beginner")
  .map(toLevelDescription);

export const LEVELS: LevelDescription[] = ADVANCED_LEVELS;

export function getTrackModes(tier: SharedWorkoutTier): ProgramWorkoutMode[] {
  return PROGRAM_CONFIG.tracks.find((track) => track.id === tier)?.availableModes ?? [];
}

export function getDefaultWorkoutModeForWeekday(
  tier: SharedWorkoutTier,
  weekday: number,
): ProgramWorkoutMode {
  const configuredMode = PROGRAM_CONFIG.defaultModeByWeekday[tier]?.[String(weekday)];
  if (configuredMode) {
    return configuredMode;
  }

  return tier === "advanced" ? "N" : "C";
}

export function getHybridPhaseGoal(fullGoal: number): number {
  return Math.ceil(fullGoal / 2);
}

export function isLaunchAccessEnabled(): boolean {
  return PROGRAM_CONFIG.access.launchAccessEnabled;
}
