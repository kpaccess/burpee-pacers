import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DashboardShell from "./DashboardShell";

vi.mock("@/components/BurpeeLogoIcon", () => ({
  default: () => <div data-testid="logo">logo</div>,
}));

describe("DashboardShell", () => {
  it("renders top navigation and triggers section navigation", () => {
    const onScrollToSection = vi.fn();
    render(
      <DashboardShell
        isMobile={false}
        activeSection="dashboard"
        isAdvancedTrack={true}
        userEmail="qa@test.com"
        canOpenAdmin={true}
        onOpenAdmin={vi.fn()}
        onLogout={vi.fn()}
        onScrollToSection={onScrollToSection}
        currentLevelName="Level 1"
      >
        <div>content</div>
      </DashboardShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Workout/i }));
    expect(onScrollToSection).toHaveBeenCalledWith("workout");
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
