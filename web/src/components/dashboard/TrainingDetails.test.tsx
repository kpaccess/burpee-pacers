import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  FridayStrengthCard,
  HealthRecoveryCard,
  WeightedTrainingCardWeb,
  WorkoutCalendarCard,
} from "./TrainingDetails";

describe("TrainingDetails", () => {
  it("toggles health routines content", () => {
    const onToggleOpen = vi.fn();
    render(
      <HealthRecoveryCard
        healthSectionOpen={false}
        healthActiveTab="warmup"
        onToggleOpen={onToggleOpen}
        onTabChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Show Routines/i }));
    expect(onToggleOpen).toHaveBeenCalled();
  });

  it("renders friday strength only when advanced friday is active", () => {
    const { rerender } = render(
      <FridayStrengthCard
        isFridayAdvanced={false}
        pullingWorkUnlocked={false}
        pullingWorkExpanded={false}
        onToggleExpanded={vi.fn()}
      />,
    );
    expect(screen.queryByText("Friday Strength Work")).not.toBeInTheDocument();

    rerender(
      <FridayStrengthCard
        isFridayAdvanced={true}
        pullingWorkUnlocked={true}
        pullingWorkExpanded={false}
        onToggleExpanded={vi.fn()}
      />,
    );
    expect(screen.getByText("Friday Strength Work")).toBeInTheDocument();
  });

  it("expands weighted training card", () => {
    render(
      <WeightedTrainingCardWeb
        day={{
          title: "Day 1",
          focus: "Back",
          exercises: [{ name: "Row", sets: 3, reps: "10" }],
        }}
      />,
    );

    fireEvent.click(screen.getByText("Day 1"));
    expect(screen.getByText("Row")).toBeInTheDocument();
  });

  it("renders workout calendar and handles month navigation", () => {
    const onPrevMonth = vi.fn();
    const onNextMonth = vi.fn();

    render(
      <WorkoutCalendarCard
        currentMonth={new Date("2026-07-01T00:00:00")}
        trackingDays={["2026-07-01"]}
        todayStr="2026-07-01"
        startDate={new Date("2026-06-01T00:00:00")}
        syncError={null}
        selectedWorkoutDays={[2, 4, 6]}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        getWorkoutLogForDate={() => null}
        getWorkoutLabelForWeekday={() => "Workout"}
        formatWorkoutLogLabel={() => "Workout"}
        onToggleWorkoutCheckbox={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Prev/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(onPrevMonth).toHaveBeenCalled();
    expect(onNextMonth).toHaveBeenCalled();
  });
});
