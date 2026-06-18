"use client";

import React, { useState } from "react";
import { useUserData } from "../hooks/useUserData";
import Onboarding from "../components/Onboarding";
import Dashboard from "../components/Dashboard";
import MilestoneCheckin from "../components/MilestoneCheckin";
import LandingPage from "../components/LandingPage";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import StarIcon from "@mui/icons-material/Star";
import { WorkoutTier } from "../types";

// ── TrackSelector ─────────────────────────────────────────────────────────────
// Shown when a user has a Firestore document but no workoutTier stored
// (created before that field existed). Lets them choose their track without
// re-entering weight or photo. saveUserData merges, so existing data is safe.
function TrackSelector({ onSelect }: { onSelect: (tier: WorkoutTier) => void }) {
  const [selected, setSelected] = useState<WorkoutTier | null>(null);

  const tracks = [
    {
      tier: "beginner" as WorkoutTier,
      icon: <FitnessCenterIcon fontSize="large" />,
      label: "Beginner",
      badge: "Free",
      badgeColor: "success" as const,
      bullets: ["Structured 6-level progression", "No-pushup variant included", "Free during launch"],
    },
    {
      tier: "advanced" as WorkoutTier,
      icon: <StarIcon fontSize="large" />,
      label: "Advanced",
      badge: "Launch",
      badgeColor: "primary" as const,
      bullets: ["Premium multi-phase workouts", "Elite track included", "Free during launch"],
    },
  ] as const;

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", px: 2 }}>
      <Card sx={{ p: 4, maxWidth: 520, width: "100%" }}>
        <Typography variant="h4" gutterBottom align="center" color="primary" fontWeight={800}>
          Choose Your Track
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          We need to know which program you&apos;re following. This won&apos;t affect your existing workout history.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          {tracks.map(({ tier, icon, label, badge, badgeColor, bullets }) => {
            const isSelected = selected === tier;
            return (
              <Box
                key={tier}
                onClick={() => setSelected(tier)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  border: isSelected ? "2px solid" : "2px solid transparent",
                  borderColor: isSelected
                    ? tier === "beginner" ? "success.main" : "primary.main"
                    : "rgba(255,255,255,0.15)",
                  borderRadius: 2,
                  p: 2.5,
                  cursor: "pointer",
                  bgcolor: isSelected
                    ? tier === "beginner" ? "rgba(102,187,106,0.08)" : "rgba(144,202,249,0.08)"
                    : "rgba(255,255,255,0.03)",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: tier === "beginner" ? "success.main" : "primary.main",
                    bgcolor: tier === "beginner" ? "rgba(102,187,106,0.05)" : "rgba(144,202,249,0.05)",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, minWidth: 0 }}>
                  <Box sx={{ color: tier === "beginner" ? "success.main" : "primary.main", flexShrink: 0 }}>{icon}</Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {label}
                  </Typography>
                  <Chip label={badge} color={badgeColor} size="small" sx={{ flexShrink: 0 }} />
                </Stack>
                <Stack spacing={0.5}>
                  {bullets.map((b) => (
                    <Typography key={b} variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <span>•</span> {b}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <Button
          variant="contained"
          color={selected === "beginner" ? "success" : "primary"}
          size="large"
          fullWidth
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          sx={{ py: 1.5, fontSize: "1.1rem" }}
        >
          {selected ? `Continue with ${selected === "beginner" ? "Beginner" : "Advanced"} Track` : "Select a track above"}
        </Button>
      </Card>
    </Box>
  );
}

export default function Home() {
  const { userData, isLoaded, saveUserData, toggleWorkoutLog, syncError } =
    useUserData();
  const { user, loading: authLoading } = useAuth();
  const [showMilestoneCheckin, setShowMilestoneCheckin] = useState(false);

  if (!isLoaded || authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (syncError && userData === undefined) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card sx={{ p: 3, maxWidth: 520, width: "100%" }}>
          <Typography variant="h6" gutterBottom color="primary">
            Could not load your data
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {syncError}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This usually means Firestore read access failed for the current user
            or project.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </Box>
    );
  }

  if (!userData) {
    return <Onboarding onComplete={(d) => saveUserData(d)} />;
  }

  // User has a Firestore document but no track stored — show track selector
  // without wiping existing data (saveUserData merges).
  if (!userData.workoutTier) {
    return (
      <TrackSelector
        onSelect={(tier) =>
          saveUserData({
            workoutTier: tier,
            currentLevelId: userData.currentLevelId ?? (tier === "beginner" ? "B1" : "F"),
          })
        }
      />
    );
  }

  if (showMilestoneCheckin) {
    return (
      <MilestoneCheckin
        onComplete={(d) => {
          saveUserData(d);
          setShowMilestoneCheckin(false);
        }}
        onCancel={() => setShowMilestoneCheckin(false)}
      />
    );
  }

  return (
    <Dashboard
      userData={userData}
      onMilestoneCheckin={() => setShowMilestoneCheckin(true)}
      onToggleWorkout={toggleWorkoutLog}
      onUpdateData={saveUserData}
      syncError={syncError}
    />
  );
}
