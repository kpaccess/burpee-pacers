import React from "react";
import { Box, Typography } from "@mui/material";
import { formatWorkoutTimerTime, HybridPhaseConfig } from "../../lib/workoutTimer";
import PacingStrip from "./PacingStrip";

interface HybridDisplayProps {
  hybridState: {
    phaseIndex: number;
    totalPhases: number;
    phase: HybridPhaseConfig;
    phaseSecondsLeft: number;
    phaseSecondsToNextRep: number | null;
  };
  totalSecondsLeft: number;
  currentRep: number;
  isActive: boolean;
  goFlash: boolean;
  hybridIntervalSecs: number;
  hybridRestProgress: number;
}

export default function HybridDisplay({
  hybridState,
  totalSecondsLeft,
  currentRep,
  isActive,
  goFlash,
  hybridIntervalSecs,
  hybridRestProgress,
}: HybridDisplayProps) {
  return (
    <Box textAlign="center">
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={0.5}>
        Phase {hybridState.phaseIndex + 1} of {hybridState.totalPhases}:{" "}
        {hybridState.phase.label}
      </Typography>

      <Typography variant="h2" fontWeight={900} color="primary.main">
        {formatWorkoutTimerTime(hybridState.phaseSecondsLeft)}
      </Typography>

      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
        Total: {formatWorkoutTimerTime(totalSecondsLeft)} remaining
      </Typography>

      {hybridState.phase.goal > 0 && (
        <Box mt={0.5} sx={{ width: "100%" }}>
          <Typography variant="subtitle2" color="secondary.main" fontWeight={800}>
            REP {currentRep} / {hybridState.phase.goal}
          </Typography>

          {isActive && (
            <PacingStrip
              goFlash={goFlash}
              secondsToNextRep={hybridState.phaseSecondsToNextRep}
              intervalSecs={hybridIntervalSecs}
              restProgress={hybridRestProgress}
              size="compact"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
