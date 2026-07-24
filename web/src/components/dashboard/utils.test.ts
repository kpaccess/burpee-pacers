import { describe, expect, it } from "vitest";
import {
  countScheduledDaysInWeek,
  formatWorkoutLogLabel,
  getCurrentStreak,
  getLoggedLevelId,
  getPaceLabel,
} from "./utils";

describe("dashboard utils", () => {
  it("counts scheduled workout days in a week", () => {
    const monday = new Date("2026-07-20T00:00:00");
    const count = countScheduledDaysInWeek(monday, [2, 4, 6]);
    expect(count).toBe(3);
  });

  it("calculates streak from scheduled days", () => {
    const logs = [
      { date: "2026-07-20", completed: true },
      { date: "2026-07-22", completed: true },
    ];
    const streak = getCurrentStreak(logs, [2, 4, 6], new Date("2026-07-22T00:00:00"));
    expect(streak).toBe(2);
  });

  it("maps legacy logged level id", () => {
    expect(getLoggedLevelId("1B(C)")).toBe("B1");
    expect(getLoggedLevelId("3(N)")).toBe("3");
    expect(getLoggedLevelId(undefined)).toBeNull();
  });

  it("builds pace label", () => {
    expect(getPaceLabel(40)).toBe("1 rep every 30 seconds");
    expect(getPaceLabel(0)).toContain("Set your level");
  });

  it("formats workout log label by track", () => {
    expect(formatWorkoutLogLabel("B3(C)", true)).toBe("Beginner 3");
    expect(formatWorkoutLogLabel("4(H)", false)).toBe("4(H)");
    expect(formatWorkoutLogLabel(undefined, false)).toBeNull();
  });
});
