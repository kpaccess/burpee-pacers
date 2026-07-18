"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VideocamIcon from "@mui/icons-material/Videocam";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { buildWorkoutTimerConfig, WorkoutMode } from "../../lib/workoutTimer";
import { useWorkoutTimer } from "../../hooks/useWorkoutTimer";
import { WorkoutTier } from "../../types";
import ModeSelector from "./ModeSelector";
import PrepareCountdown from "./PrepareCountdown";
import HybridDisplay from "./HybridDisplay";
import StandardDisplay from "./StandardDisplay";
import WarmupPrompt from "./WarmupPrompt";
import TimerControls from "./TimerControls";
import CooldownBanner from "./CooldownBanner";

const TUTORIAL_VIDEO_URLS: Partial<Record<WorkoutMode, string>> = {
  N: "https://www.youtube.com/shorts/aF3CTHJwyww",
  C: "https://www.youtube.com/shorts/iXkZUM1HupY",
};
const BEGINNER_TUTORIAL_VIDEO_URL = "https://www.youtube.com/shorts/Hj-mrGYW_Uo";

interface WorkoutTimerProps {
  tier: WorkoutTier;
  sealsGoal?: number;
  sixCountsGoal?: number;
  defaultMode?: WorkoutMode;
  onFinish?: (repsCompleted: number, mode: string) => void;
  onShowWarmup?: () => void;
  onShowCooldown?: () => void;
}

export default function WorkoutTimer({
  tier,
  sealsGoal = 0,
  sixCountsGoal = 0,
  defaultMode,
  onFinish,
  onShowWarmup,
  onShowCooldown,
}: WorkoutTimerProps) {
  const timerConfig = useMemo(
    () => buildWorkoutTimerConfig({ tier, sealsGoal, sixCountsGoal, defaultMode }),
    [sealsGoal, sixCountsGoal, tier, defaultMode],
  );

  // ── GO! flash ─────────────────────────────────────────────────────────────
  const [goFlash, setGoFlash] = useState(false);
  const goFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRepBoundary = useCallback(() => {
    setGoFlash(true);
    if (goFlashTimerRef.current) clearTimeout(goFlashTimerRef.current);
    goFlashTimerRef.current = setTimeout(() => setGoFlash(false), 1500);
  }, []);

  const {
    activeMode,
    modes,
    secondsLeft,
    isActive,
    currentRep,
    secondsToNextRep,
    phase,
    prepareSecondsLeft,
    hybridState,
    toggleTimer,
    resetTimer,
    selectMode,
  } = useWorkoutTimer({ config: timerConfig, onFinish, onRepBoundary: handleRepBoundary });

  // ── Warmup gate ───────────────────────────────────────────────────────────
  const [warmupChecked, setWarmupChecked] = useState(false);
  const [showWarmupPrompt, setShowWarmupPrompt] = useState(false);

  const isPreparing = phase === "prepare";
  const isDone = phase === "done";
  const isHybridMode = activeMode.mode === "H";
  const isIdle = phase === "idle";

  const tutorialVideoUrl =
    tier === "beginner" ? BEGINNER_TUTORIAL_VIDEO_URL : TUTORIAL_VIDEO_URLS[activeMode.mode];
  const shouldShowTutorialButton = tier === "beginner" || !isHybridMode;
  const workoutTitle =
    tier === "beginner"
      ? "Beginner Burpees"
      : activeMode.mode === "N"
        ? "Navy Seals"
        : activeMode.mode === "C"
          ? "5-Count Pushups"
          : "Hybrid";
  const workoutSubtitle =
    tier === "beginner"
      ? `${sixCountsGoal} burpees · No push-ups`
      : activeMode.mode === "H"
        ? `${Math.ceil(sealsGoal / 2)} Navy Seals + ${Math.ceil(sixCountsGoal / 2)} 5-count pushups`
        : `${activeMode.goal} reps · ${activeMode.description}`;

  // ── Pacing values ─────────────────────────────────────────────────────────
  const totalWorkoutSeconds = timerConfig.initialMinutes * 60;
  const intervalSecs = activeMode.goal > 0 ? totalWorkoutSeconds / activeMode.goal : 0;
  const restProgress =
    intervalSecs > 0 && secondsToNextRep !== null
      ? Math.round((secondsToNextRep / intervalSecs) * 100)
      : 0;

  const hybridIntervalSecs =
    hybridState && hybridState.phase.goal > 0 ? (10 * 60) / hybridState.phase.goal : 0;
  const hybridRestProgress =
    hybridIntervalSecs > 0 && hybridState?.phaseSecondsToNextRep != null
      ? Math.round((hybridState.phaseSecondsToNextRep / hybridIntervalSecs) * 100)
      : 0;

  // Clear GO flash on reset / mode switch
  useEffect(() => {
    if (phase === "idle") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoFlash(false);
      if (goFlashTimerRef.current) {
        clearTimeout(goFlashTimerRef.current);
        goFlashTimerRef.current = null;
      }
    }
  }, [phase]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartClick = useCallback(() => {
    if (!warmupChecked && !isActive && !isPreparing && phase !== "done") {
      setShowWarmupPrompt(true);
      return;
    }
    toggleTimer();
  }, [warmupChecked, isActive, isPreparing, phase, toggleTimer]);

  const handleConfirmWarmup = useCallback(() => {
    setWarmupChecked(true);
    setShowWarmupPrompt(false);
    toggleTimer();
  }, [toggleTimer]);

  const handleShowWarmupFromPrompt = useCallback(() => {
    setShowWarmupPrompt(false);
    onShowWarmup?.();
  }, [onShowWarmup]);

  const handleResetTimer = useCallback(() => {
    setWarmupChecked(false);
    setShowWarmupPrompt(false);
    setGoFlash(false);
    if (goFlashTimerRef.current) {
      clearTimeout(goFlashTimerRef.current);
      goFlashTimerRef.current = null;
    }
    resetTimer();
  }, [resetTimer]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3.5 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap" alignItems="flex-start">
        <Box>
          <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.18em", fontWeight: 800 }}>
            TODAY&apos;S WORKOUT
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
            {workoutTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            {workoutSubtitle}
          </Typography>
        </Box>
        <Chip icon={<TimerOutlinedIcon />} label="20:00" color="secondary" variant="outlined" sx={{ fontWeight: 800 }} />
      </Box>

      <ModeSelector modes={modes} activeMode={activeMode} onSelect={selectMode} />

      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          textAlign: "center",
        }}
      >
        {isPreparing ? (
          <PrepareCountdown secondsLeft={prepareSecondsLeft} />
        ) : isHybridMode && hybridState ? (
          <HybridDisplay
            hybridState={hybridState}
            totalSecondsLeft={secondsLeft}
            currentRep={currentRep}
            isActive={isActive}
            goFlash={goFlash}
            hybridIntervalSecs={hybridIntervalSecs}
            hybridRestProgress={hybridRestProgress}
          />
        ) : (
          <StandardDisplay
            secondsLeft={secondsLeft}
            currentRep={currentRep}
            goal={activeMode.goal}
            isIdle={isIdle}
            isActive={isActive}
            intervalSecs={intervalSecs}
            goFlash={goFlash}
            secondsToNextRep={secondsToNextRep}
            restProgress={restProgress}
          />
        )}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
        <Chip
          label={
            activeMode.goal > 0
              ? `Rep ${currentRep} of ${activeMode.goal}`
              : "Set your level to see rep target"
          }
          variant="outlined"
        />
        <Chip
          label={activeMode.goal > 0 ? `Pace: 1 rep every ${Math.round((20 * 60) / activeMode.goal)} seconds` : "Pacing appears after level selection"}
          variant="outlined"
        />
      </Stack>

      {isIdle && !showWarmupPrompt && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontStyle: "italic", display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <FitnessCenterIcon sx={{ fontSize: 14 }} />
          Warm up first. Train smart.
        </Typography>
      )}

      {showWarmupPrompt ? (
        <WarmupPrompt onConfirm={handleConfirmWarmup} onShowWarmup={handleShowWarmupFromPrompt} />
      ) : (
        <TimerControls
          isPreparing={isPreparing}
          isActive={isActive}
          phase={phase}
          onStart={handleStartClick}
          onReset={handleResetTimer}
        />
      )}

      {isDone && !showWarmupPrompt && <CooldownBanner onShowCooldown={onShowCooldown} />}

      {shouldShowTutorialButton &&
        (tutorialVideoUrl ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={onShowWarmup} startIcon={<FitnessCenterIcon />}>
              Warm-up
            </Button>
            <Button
              variant="text"
              component="a"
              href={tutorialVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<VideocamIcon />}
              sx={{ color: "secondary.main" }}
            >
              Watch Tutorial Video
            </Button>
          </Stack>
        ) : (
          <Button
            variant="text"
            startIcon={<VideocamIcon />}
            disabled
            sx={{ color: "text.secondary" }}
          >
            Coming Soon — Tutorial videos launching soon
          </Button>
        ))}
    </Card>
  );
}
