import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  HeroCard,
  ProgressionCard,
  RecentWorkoutsCard,
  ScheduleCard,
} from "./DashboardCards";

describe("DashboardCards", () => {
  it("renders HeroCard and handles action", () => {
    const onOpenWorkout = vi.fn();
    render(
      <HeroCard
        hasCompletedToday={false}
        nextScheduledLabel="Monday - Navy Seals"
        scheduledToday={true}
        nextWorkoutLabel="Navy Seals"
        weeklyRingValue={50}
        weeklyCompletionPercent={50}
        currentStreak={2}
        currentWeekCompleted={1}
        scheduledDaysThisWeek={2}
        currentLevelName="Foundation"
        programDayLabel="Day 10"
        onOpenWorkout={onOpenWorkout}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Open workout timer/i }),
    );
    expect(onOpenWorkout).toHaveBeenCalled();
  });

  it("renders ScheduleCard and toggles weighted training", () => {
    const onToggleWeightedTraining = vi.fn();
    render(
      <ScheduleCard
        selectedWorkoutDays={[2, 4, 6]}
        workoutDayOptions={[
          { weekday: 2, short: "Mon" },
          { weekday: 4, short: "Wed" },
          { weekday: 6, short: "Fri" },
        ]}
        weightedTrainingEnabled={false}
        nextScheduledLabel="Monday - Navy Seals"
        onToggleWorkoutDay={vi.fn()}
        onToggleWeightedTraining={onToggleWeightedTraining}
        onOpenCalendarDetails={vi.fn()}
        onOpenWarmupRecovery={vi.fn()}
        getWorkoutLabelForWeekday={() => "Workout"}
        canEditWorkoutDays={true}
      />,
    );

    fireEvent.click(screen.getByText("Off"));
    expect(onToggleWeightedTraining).toHaveBeenCalled();
  });

  it("renders RecentWorkoutsCard workout rows", () => {
    render(
      <RecentWorkoutsCard
        recentWorkouts={[
          {
            date: "2026-07-21",
            completed: true,
            levelCompleted: "1(N)",
            repsCompleted: 30,
          },
        ]}
        onOpenProgressDetails={vi.fn()}
        formatWorkoutLogLabel={() => "1(N)"}
        getWorkoutLabelForWeekday={() => "Navy Seals"}
      />,
    );

    expect(screen.getByText("Recent workouts")).toBeInTheDocument();
    expect(screen.getByText("1(N)")).toBeInTheDocument();
  });

  it("renders ProgressionCard and action buttons", () => {
    const onOpenLevelChange = vi.fn();
    render(
      <ProgressionCard
        currentLevel={{
          id: "1",
          name: "Level 1",
          description: "desc",
          seals: 20,
          sixCounts: 50,
          timeLimitMintues: 20,
        }}
        currentLevelIndex={1}
        levelsCount={5}
        currentLevelQualifyingSessions={3}
        qualifyingSessionsRequired={5}
        nextLevel={{
          id: "2",
          name: "Level 2",
          description: "next",
          seals: 40,
          sixCounts: 100,
          timeLimitMintues: 20,
        }}
        hasEnoughHistoryForComparison={true}
        currentWeekCompleted={2}
        previousWeekCompleted={1}
        onOpenLevelChange={onOpenLevelChange}
        onOpenTrackSwitch={vi.fn()}
        onOpenDetailedProgress={vi.fn()}
        isAdvancedTrack={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Update Level/i }));
    expect(onOpenLevelChange).toHaveBeenCalled();
  });
});
