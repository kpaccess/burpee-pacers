"use client";

import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    layout: {
      dashboard: {
        heroCardPadding: {
          xs: number;
          md: number;
        };
        heroDescriptionMaxWidth: number;
        heroRingMinWidth: number;
        heroRingSize: {
          xs: number;
          md: number;
        };
        heroRingPadding: {
          xs: string;
          md: string;
        };
        heroWeeklyLabelMaxWidth: number;
        scheduleCardPadding: {
          xs: number;
          md: number;
        };
        scheduleIconSize: number;
        sectionCardPadding: number;
        recentWorkoutDateColumnWidth: number;
        progressBarHeight: number;
        surfaceBorder: string;
        surfaceBackground: string;
        emphasisBorder: string;
        heroBorder: string;
        heroGradient: string;
        weeklyRingTrack: string;
        progressTrack: string;
        weeklyDeltaBackground: string;
        weeklyDeltaBorder: string;
      };
    };
  }

  interface ThemeOptions {
    layout?: {
      dashboard?: {
        heroCardPadding?: {
          xs?: number;
          md?: number;
        };
        heroDescriptionMaxWidth?: number;
        heroRingMinWidth?: number;
        heroRingSize?: {
          xs?: number;
          md?: number;
        };
        heroRingPadding?: {
          xs?: string;
          md?: string;
        };
        heroWeeklyLabelMaxWidth?: number;
        scheduleCardPadding?: {
          xs?: number;
          md?: number;
        };
        scheduleIconSize?: number;
        sectionCardPadding?: number;
        recentWorkoutDateColumnWidth?: number;
        progressBarHeight?: number;
        surfaceBorder?: string;
        surfaceBackground?: string;
        emphasisBorder?: string;
        heroBorder?: string;
        heroGradient?: string;
        weeklyRingTrack?: string;
        progressTrack?: string;
        weeklyDeltaBackground?: string;
        weeklyDeltaBorder?: string;
      };
    };
  }
}

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: {
      main: "#FF3366",
    },
    secondary: {
      main: "#00E5FF",
    },
    success: {
      main: "#5FCB79",
    },
    warning: {
      main: "#F5B544",
    },
    background: {
      default: "#090909",
      paper: "#121212",
    },
    text: {
      primary: "#F7F7F2",
      secondary: "rgba(247, 247, 242, 0.68)",
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Avenir Next", "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
  },
  shape: {
    borderRadius: 16,
  },
  layout: {
    dashboard: {
      heroCardPadding: {
        xs: 2.5,
        md: 3.5,
      },
      heroDescriptionMaxWidth: 560,
      heroRingMinWidth: 168,
      heroRingSize: {
        xs: 128,
        md: 148,
      },
      heroRingPadding: {
        xs: "10px",
        md: "12px",
      },
      heroWeeklyLabelMaxWidth: 76,
      scheduleCardPadding: {
        xs: 2.5,
        md: 3,
      },
      scheduleIconSize: 18,
      sectionCardPadding: 3,
      recentWorkoutDateColumnWidth: 160,
      progressBarHeight: 10,
      surfaceBorder: "1px solid rgba(255,255,255,0.08)",
      surfaceBackground: "rgba(255,255,255,0.02)",
      emphasisBorder: "1px solid rgba(255,255,255,0.1)",
      heroBorder: "1px solid rgba(255,255,255,0.1)",
      heroGradient:
        "linear-gradient(135deg, rgba(255,51,102,0.14), rgba(20,20,20,0.96) 52%, rgba(0,229,255,0.08))",
      weeklyRingTrack: "rgba(255,255,255,0.08)",
      progressTrack: "rgba(255,255,255,0.08)",
      weeklyDeltaBackground: "rgba(255,51,102,0.06)",
      weeklyDeltaBorder: "1px solid rgba(255,51,102,0.16)",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
          padding: "10px 24px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: "none",
          backgroundColor: "rgba(18, 18, 18, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.22)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
