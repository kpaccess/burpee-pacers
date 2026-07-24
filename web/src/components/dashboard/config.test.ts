import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SECTIONS,
  DEFAULT_WORKOUT_DAYS,
  HEALTH_RECOVERY_CONFIG,
  PULLING_WORK_CONFIG,
  WEIGHTED_TRAINING_PLAN,
  WORKOUT_DAY_OPTIONS,
} from "./config";

describe("dashboard config", () => {
  it("exposes default workout days", () => {
    expect(DEFAULT_WORKOUT_DAYS).toEqual([2, 4, 6]);
  });

  it("keeps workout day options aligned to defaults", () => {
    const weekdays = WORKOUT_DAY_OPTIONS.map((item) => item.weekday);
    expect(weekdays).toEqual(DEFAULT_WORKOUT_DAYS);
  });

  it("defines sections for navigation", () => {
    expect(DASHBOARD_SECTIONS.map((s) => s.id)).toEqual([
      "dashboard",
      "workout",
      "calendar",
      "progress",
      "strength",
    ]);
  });

  it("contains warmup and cooldown routines", () => {
    expect(HEALTH_RECOVERY_CONFIG.warmup.exercises.length).toBeGreaterThan(0);
    expect(HEALTH_RECOVERY_CONFIG.cooldown.exercises.length).toBeGreaterThan(0);
  });

  it("contains friday pulling work options", () => {
    expect(PULLING_WORK_CONFIG.length).toBeGreaterThanOrEqual(2);
    expect(PULLING_WORK_CONFIG[0].exercises.length).toBeGreaterThan(0);
  });

  it("contains weighted training entries for mon/wed/fri", () => {
    expect(WEIGHTED_TRAINING_PLAN[1]).toBeDefined();
    expect(WEIGHTED_TRAINING_PLAN[3]).toBeDefined();
    expect(WEIGHTED_TRAINING_PLAN[5]).toBeDefined();
  });
});
