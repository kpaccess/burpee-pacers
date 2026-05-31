import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { WorkoutMode, WorkoutTimerModeConfig } from "../../lib/workoutTimer";

interface ModeSelectorProps {
  modes: WorkoutTimerModeConfig[];
  activeMode: WorkoutTimerModeConfig;
  onSelect: (mode: WorkoutMode) => void;
}

export default function ModeSelector({ modes, activeMode, onSelect }: ModeSelectorProps) {
  if (modes.length > 1) {
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {modes.map((entry) => (
          <Chip
            key={entry.mode}
            label={entry.label}
            color={activeMode.mode === entry.mode ? "primary" : "default"}
            onClick={() => onSelect(entry.mode)}
            sx={{ fontWeight: 700 }}
          />
        ))}
      </Stack>
    );
  }
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {activeMode.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {activeMode.description}
      </Typography>
    </Box>
  );
}
