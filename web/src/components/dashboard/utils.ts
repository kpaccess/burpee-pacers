import { endOfWeek, eachDayOfInterval, format, subMonths } from "date-fns";
import type { WorkoutLog } from "@/types";
import { toDateKey } from "@/lib/date";

export function countScheduledDaysInWeek(weekStart: Date, selectedWorkoutDays: number[]) {
  return eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart),
  }).filter((day) => selectedWorkoutDays.includes(day.getDay() + 1)).length;
}

export function getCompletedDates(workoutLogs: WorkoutLog[]) {
  return workoutLogs
    .filter((log) => log.completed)
    .map((log) => toDateKey(log.date))
    .sort();
}

export function getCurrentStreak(workoutLogs: WorkoutLog[], selectedWorkoutDays: number[], today: Date) {
  const completedDates = new Set(getCompletedDates(workoutLogs));
  const cursor = new Date(today);
  let streak = 0;

  while (cursor >= subMonths(today, 12)) {
    const weekday = cursor.getDay() + 1;
    if (selectedWorkoutDays.includes(weekday)) {
      const dateKey = format(cursor, "yyyy-MM-dd");
      if (completedDates.has(dateKey)) {
        streak += 1;
      } else if (cursor <= today) {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getLoggedLevelId(levelCompleted?: string): string | null {
  if (!levelCompleted) return null;

  if (levelCompleted === "1B(C)") {
    return "B1";
  }

  const match = levelCompleted.match(/^([0-9A-Za-z]+)\(([NCH])\)$/);
  return match ? match[1] : null;
}

export function getPaceLabel(goal: number, minutes = 20): string {
  if (goal <= 0) return "Set your level to see pacing";
  const secondsPerRep = Math.round((minutes * 60) / goal);
  return `1 rep every ${secondsPerRep} seconds`;
}

export function formatWorkoutLogLabel(levelCompleted: string | undefined, isBeginnerTrack: boolean): string | null {
  if (!levelCompleted) return null;

  const beginnerMatch = levelCompleted.match(/^B([1-6])\(C\)$/);
  if (beginnerMatch) {
    return `Beginner ${beginnerMatch[1]}`;
  }

  if (isBeginnerTrack && levelCompleted === "1B(C)") {
    return "Beginner 1";
  }

  const advancedMatch = levelCompleted.match(/^([0-9A-Za-z]+)\(([NCH])\)$/);
  if (advancedMatch) {
    const [, levelId, mode] = advancedMatch;
    return `${levelId}(${mode})`;
  }

  return levelCompleted;
}
