import React from "react";
import { Box, Typography } from "@mui/material";
import { formatWorkoutTimerTime } from "../../lib/workoutTimer";
import PacingStrip from "./PacingStrip";

interface StandardDisplayProps {
  secondsLeft: number;
  currentRep: number;
  goal: number;
  isIdle: boolean;
  isActive: boolean;
  intervalSecs: number;
  goFlash: boolean;
  secondsToNextRep: number | null;
  restProgress: number;
}

export default function StandardDisplay({
  secondsLeft,
  currentRep,
  goal,
  isIdle,
  isActive,
  intervalSecs,
  goFlash,
  secondsToNextRep,
  restProgress,
}: StandardDisplayProps) {
  return (
    <>
      <Typography variant="h2" fontWeight={900} color="primary.main">
        {formatWorkoutTimerTime(secondsLeft)}
      </Typography>

      {goal > 0 ? (
        <Box sx={{ width: "100%", textAlign: "center" }}>
          <Typography variant="subtitle2" color="secondary.main" fontWeight={800}>
            REP {currentRep} / {goal}
          </Typography>

          {isIdle && intervalSecs > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
              Pace: 1 rep every {Math.round(intervalSecs)}s
            </Typography>
          )}

          {isActive && (
            <PacingStrip
              goFlash={goFlash}
              secondsToNextRep={secondsToNextRep}
              intervalSecs={intervalSecs}
              restProgress={restProgress}
              size="normal"
            />
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Beginner uses the selected level target for this 20-minute session.
        </Typography>
      )}
    </>
  );
}
