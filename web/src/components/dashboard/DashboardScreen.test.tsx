import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import DashboardScreen from "./DashboardScreen";
import theme from "@/theme";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "qa@test.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/WorkoutTimer", () => ({
  default: () => <div data-testid="workout-timer">WorkoutTimer</div>,
}));

describe("DashboardScreen", () => {
  it("renders dashboard headline and timer section", () => {
    render(
      <ThemeProvider theme={theme}>
        <DashboardScreen
          userData={{
            startWeight: 180,
            startPictureUrl: null,
            workoutTier: "advanced",
            currentLevelId: "F",
            workoutLogs: [],
          }}
          onMilestoneCheckin={vi.fn()}
          onToggleWorkout={vi.fn()}
          onUpdateData={vi.fn()}
          syncError={null}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("TODAY'S TRAINING")).toBeInTheDocument();
    expect(screen.getByTestId("workout-timer")).toBeInTheDocument();
  });
});
