import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { addMonths, format, isSameMonth } from "date-fns";
import type { WorkoutLog } from "@/types";
import {
  HEALTH_RECOVERY_CONFIG,
  PULLING_WORK_CONFIG,
  WEIGHTED_TRAINING_PLAN,
  type WeightedTrainingDay,
} from "./config";

type HealthRecoveryCardProps = {
  healthSectionOpen: boolean;
  healthActiveTab: "warmup" | "cooldown";
  onToggleOpen: () => void;
  onTabChange: (tab: "warmup" | "cooldown") => void;
};

export function HealthRecoveryCard({
  healthSectionOpen,
  healthActiveTab,
  onToggleOpen,
  onTabChange,
}: HealthRecoveryCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: 3,
        mb: 4,
        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
        background: alpha(theme.palette.success.main, 0.04),
      })}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <HealthAndSafetyIcon color="success" />
          <Typography variant="h6" fontWeight={700} color="success.main">
            Warm-up, Cool-down and Recovery
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="success"
          size="small"
          endIcon={healthSectionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={onToggleOpen}
          sx={{ whiteSpace: "nowrap" }}
        >
          {healthSectionOpen ? "Hide" : "Show Routines"}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        A 5-minute warm-up reduces injury risk. A 5-10 minute cool-down speeds recovery. Build the habit - it compounds over 6 months.
      </Typography>

      <Collapse in={healthSectionOpen} timeout="auto" unmountOnExit>
        <Box mt={2.5}>
          <Tabs
            value={healthActiveTab}
            onChange={(_, val: "warmup" | "cooldown") => onTabChange(val)}
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: "currentColor" } }}
            sx={(theme) => ({
              mb: 2,
              color: "success.main",
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Tab label="Warm-up (5-8 min)" value="warmup" sx={{ fontWeight: 700, fontSize: "0.8rem" }} />
            <Tab label="Cool-down (5-10 min)" value="cooldown" sx={{ fontWeight: 700, fontSize: "0.8rem" }} />
          </Tabs>

          {(["warmup", "cooldown"] as const).map((tab) => (
            <Box key={tab} hidden={healthActiveTab !== tab}>
              {healthActiveTab === tab && (
                <Stack spacing={1.5}>
                  {HEALTH_RECOVERY_CONFIG[tab].exercises.map((ex, i) => (
                    <Box
                      key={ex.name}
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
                        background: theme.layout.dashboard.surfaceBackground,
                      })}
                    >
                      <Typography variant="caption" color="success.main" fontWeight={700} sx={{ minWidth: 18, lineHeight: 1.8 }}>
                        {i + 1}.
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{ex.name}</Typography>
                        <Typography variant="caption" color="secondary.main" sx={{ display: "block" }}>{ex.duration}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic" }}>{ex.cue}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          ))}

          <Divider sx={{ my: 2.5, borderColor: "divider" }} />

          <Box
            sx={(theme) => ({
              p: 1.5,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              background: alpha(theme.palette.secondary.main, 0.04),
              mb: 2,
            })}
          >
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
              RECOVERY TIP (OPTIONAL)
            </Typography>
            <Typography variant="body2" color="text.secondary">{HEALTH_RECOVERY_CONFIG.epsom}</Typography>
          </Box>

          <Box
            sx={(theme) => ({
              p: 1.5,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
              background: alpha(theme.palette.warning.main, 0.04),
            })}
          >
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
              SAFETY NOTICE
            </Typography>
            <Typography variant="caption" color="text.secondary">{HEALTH_RECOVERY_CONFIG.disclaimer}</Typography>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
}

type FridayStrengthCardProps = {
  isFridayAdvanced: boolean;
  pullingWorkUnlocked: boolean;
  pullingWorkExpanded: boolean;
  onToggleExpanded: () => void;
};

export function FridayStrengthCard({
  isFridayAdvanced,
  pullingWorkUnlocked,
  pullingWorkExpanded,
  onToggleExpanded,
}: FridayStrengthCardProps) {
  if (!isFridayAdvanced) return null;

  return (
    <Card
      sx={(theme) => ({
        p: 3,
        mb: 4,
        border: pullingWorkUnlocked
          ? `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`
          : `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
        transition: "border-color 0.4s ease",
      })}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={700} color={pullingWorkUnlocked ? "secondary" : "text.secondary"}>
            Friday Strength Work
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {pullingWorkUnlocked
              ? "Great job finishing your Hybrid workout. Now balance your body with pulling and finish strong with legs and core."
              : "Complete your Hybrid workout above to unlock Friday Strength Work."}
          </Typography>
        </Box>

        {pullingWorkUnlocked && (
          <Button variant="outlined" size="small" color="secondary" onClick={onToggleExpanded} sx={{ whiteSpace: "nowrap" }}>
            {pullingWorkExpanded ? "Hide" : "View Strength Work"}
          </Button>
        )}
      </Box>

      {!pullingWorkUnlocked && (
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1.5, fontStyle: "italic" }}>
          Burpees are powerful, but they are mostly pushing movements. Add pulling work on Friday to keep your shoulders healthy,
          improve posture, and build a balanced body.
        </Typography>
      )}

      {pullingWorkUnlocked && pullingWorkExpanded && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Burpees are powerful, but they are mostly pushing movements. Add pulling work on Friday to keep your shoulders healthy,
            improve posture, and build a balanced body.
          </Typography>

          <Typography variant="subtitle1" fontWeight={700} color="secondary" gutterBottom>
            Pulling + Biceps
          </Typography>

          <Grid container spacing={2}>
            {PULLING_WORK_CONFIG.map((option) => (
              <Grid sx={{ xs: 12, md: 6 }} key={option.id}>
                <Card
                  sx={(theme) => ({
                    p: 2.5,
                    height: "100%",
                    border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
                    background: theme.layout.dashboard.surfaceBackground,
                  })}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    {option.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    {option.subtitle}
                  </Typography>

                  <Stack spacing={2}>
                    {option.exercises.map((ex, i) => (
                      <Box
                        key={ex.name}
                        sx={(theme) => ({
                          borderRadius: 1,
                          overflow: "hidden",
                          border: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
                        })}
                      >
                        <Box sx={{ p: 1.5 }}>
                          <Box display="flex" alignItems="baseline" gap={0.75} mb={0.5}>
                            <Typography variant="caption" color="text.disabled">{i + 1}.</Typography>
                            <Typography variant="body2" fontWeight={700}>{ex.name}</Typography>
                          </Box>
                          <Typography variant="caption" color="secondary.main" sx={{ display: "block" }}>
                            {ex.sets} x {ex.reps}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1, fontStyle: "italic" }}>
                            {ex.benefit}
                          </Typography>

                          <Stack spacing={0.25} mb={1}>
                            {ex.formCues.map((cue) => (
                              <Box key={cue} display="flex" gap={0.75} alignItems="flex-start">
                                <Typography variant="caption" color="secondary.main" sx={{ flexShrink: 0, lineHeight: 1.6 }}>-</Typography>
                                <Typography variant="caption" color="text.secondary">{cue}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle1" fontWeight={700} color="secondary" sx={{ mt: 3 }} gutterBottom>
            Legs + Core
          </Typography>

          <Card
            sx={(theme) => ({
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
              background: theme.layout.dashboard.surfaceBackground,
            })}
          >
            <Stack
              divider={
                <Divider
                  sx={(theme) => ({
                    borderColor: alpha(theme.palette.common.white, 0.05),
                  })}
                />
              }
            >
              {WEIGHTED_TRAINING_PLAN[5].exercises.map((ex) => (
                <Box key={ex.name} display="flex" alignItems="flex-start" gap={1.5} sx={{ py: 1.25 }}>
                  <Typography variant="caption" fontWeight={900} color="secondary.main" sx={{ minWidth: 28, pt: 0.25, fontSize: "0.8rem" }}>
                    {ex.sets}x
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="body2" fontWeight={600}>{ex.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{ex.reps}</Typography>
                    </Box>
                    {ex.note && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: "block", fontStyle: "italic" }}>
                        {ex.note}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Box>
      )}
    </Card>
  );
}

type WorkoutCalendarCardProps = {
  currentMonth: Date;
  trackingDays: string[];
  todayStr: string;
  startDate: Date | null;
  syncError?: string | null;
  selectedWorkoutDays: number[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  getWorkoutLogForDate: (dateStr: string) => WorkoutLog | null;
  getWorkoutLabelForWeekday: (weekday: number) => string;
  formatWorkoutLogLabel: (levelCompleted?: string) => string | null;
  onToggleWorkoutCheckbox: (dateStr: string, isCompleted: boolean, eventTarget?: HTMLElement) => void;
};

export function WorkoutCalendarCard({
  currentMonth,
  trackingDays,
  todayStr,
  startDate,
  syncError,
  selectedWorkoutDays,
  onPrevMonth,
  onNextMonth,
  getWorkoutLogForDate,
  getWorkoutLabelForWeekday,
  formatWorkoutLogLabel,
  onToggleWorkoutCheckbox,
}: WorkoutCalendarCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: theme.layout.dashboard.sectionCardPadding,
        mb: 4,
      })}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="primary">Workout Calendar</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Button size="small" onClick={onPrevMonth}>Prev</Button>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ minWidth: 120, textAlign: "center" }}>
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <Button size="small" onClick={onNextMonth}>Next</Button>
        </Box>
      </Box>
      {syncError && <Alert severity="error" sx={{ mb: 2 }}>{syncError}</Alert>}
      <Typography variant="body2" color="text.secondary" mb={2}>
        Check off your workout on your selected schedule
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label="Completed"
          size="small"
          sx={(theme) => ({
            border: `1px solid ${theme.palette.secondary.main}`,
            bgcolor: alpha(theme.palette.secondary.main, 0.1),
          })}
        />
        <Chip label="Scheduled" size="small" variant="outlined" />
        <Chip
          label="Missed"
          size="small"
          sx={(theme) => ({
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          })}
        />
        <Chip label="Rest" size="small" variant="outlined" sx={{ opacity: 0.75 }} />
        <Chip label="Today" size="small" color="primary" variant="outlined" />
      </Stack>

      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} mb={1}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Typography key={day} variant="caption" color="text.secondary" align="center" fontWeight="bold">{day}</Typography>
        ))}
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
        {trackingDays.map((dateStr) => {
          const dayObj = new Date(`${dateStr}T00:00:00`);
          const dayLog = getWorkoutLogForDate(dateStr);
          const isCompleted = !!dayLog?.completed;
          const weekday = dayObj.getDay() + 1;
          const isWorkoutDay = selectedWorkoutDays.includes(weekday);
          const isCurrentMonthValue = isSameMonth(dayObj, currentMonth);
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const hasStartedProgram = !startDate || dateStr >= format(startDate, "yyyy-MM-dd");
          const isMissed = isPast && isWorkoutDay && hasStartedProgram && !isCompleted;
          const workoutLabel = getWorkoutLabelForWeekday(weekday);
          const statusLabel = isCompleted
            ? `completed ${formatWorkoutLogLabel(dayLog?.levelCompleted) ?? workoutLabel}`
            : isMissed
              ? `missed ${workoutLabel}`
              : isWorkoutDay
                ? `scheduled ${workoutLabel}`
                : "rest day";

          return (
            <Box
              key={dateStr}
              role="group"
              aria-label={`${format(dayObj, "EEEE, MMMM d")} - ${statusLabel}${isToday ? " - today" : ""}`}
              sx={(theme) => ({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minHeight: 80,
                p: 0.5,
                borderRadius: 2,
                border: isCompleted
                  ? `1px solid ${theme.palette.secondary.main}`
                  : isMissed
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
                    : isWorkoutDay
                      ? `1px solid ${alpha(theme.palette.common.white, 0.2)}`
                      : `1px dashed ${alpha(theme.palette.common.white, 0.13)}`,
                background: isCompleted
                  ? alpha(theme.palette.secondary.main, 0.1)
                  : isMissed
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "transparent",
                opacity: isCurrentMonthValue ? (isWorkoutDay ? 1 : 0.6) : 0.2,
              })}
            >
              <Typography variant="body2" fontWeight={isCurrentMonthValue ? "bold" : "normal"}>{format(dayObj, "d")}</Typography>
              {isWorkoutDay || isCompleted ? (
                <Box display="flex" flexDirection="column" alignItems="center" mt={0.5}>
                  <Checkbox
                    checked={isCompleted}
                    disabled={isPast}
                    onChange={(e) => onToggleWorkoutCheckbox(dateStr, isCompleted, e.currentTarget.parentElement as HTMLElement)}
                    color="secondary"
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                  {isCompleted && dayLog?.levelCompleted && (
                    <Typography variant="caption" sx={{ color: "secondary.main", lineHeight: 1, fontSize: "0.65rem" }} align="center">
                      {formatWorkoutLogLabel(dayLog.levelCompleted)}
                    </Typography>
                  )}
                  {isMissed && (
                    <Typography
                      variant="caption"
                      sx={(theme) => ({
                        color: alpha(theme.palette.primary.light, 0.9),
                        fontSize: "0.6rem",
                        lineHeight: 1,
                      })}
                      align="center"
                    >
                      Missed
                    </Typography>
                  )}
                  {!hasStartedProgram && isWorkoutDay && !isCompleted && (
                    <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem", lineHeight: 1 }} align="center">Not started</Typography>
                  )}
                  {isToday && !isCompleted && (
                    <Typography variant="caption" sx={{ color: "secondary.main", fontSize: "0.6rem", lineHeight: 1 }} align="center">Today</Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ mt: 1, color: "text.disabled", fontSize: "0.65rem" }}>Rest</Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}

export function WeightedTrainingCardWeb({ day }: { day: WeightedTrainingDay }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      sx={(theme) => ({
        mb: 4,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        background: alpha(theme.palette.warning.main, 0.04),
        overflow: "hidden",
      })}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={(theme) => ({
          p: 2,
          cursor: "pointer",
          "&:hover": { background: alpha(theme.palette.warning.main, 0.06) },
        })}
        onClick={() => setExpanded((v) => !v)}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: "warning.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "common.black", fontWeight: 900 }}>W</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{day.title}</Typography>
            <Typography variant="caption" color="text.secondary">{day.focus}</Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">{expanded ? "▲" : "▼"}</Typography>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={(theme) => ({ borderColor: alpha(theme.palette.warning.main, 0.15) })} />
        <Stack
          divider={
            <Divider
              sx={(theme) => ({
                ml: 7,
                borderColor: alpha(theme.palette.common.white, 0.05),
              })}
            />
          }
        >
          {day.exercises.map((ex) => (
            <Box key={ex.name} display="flex" alignItems="flex-start" gap={1.5} sx={{ px: 2, py: 1.25 }}>
              <Typography variant="caption" fontWeight={900} color="warning.main" sx={{ minWidth: 28, pt: 0.25, fontSize: "0.8rem" }}>
                {ex.sets}x
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="body2" fontWeight={600}>{ex.name}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>{ex.reps}</Typography>
                </Box>
                {ex.note && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: "block", fontStyle: "italic" }}>
                    {ex.note}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Card>
  );
}

export function getTrackingDays(currentMonth: Date) {
  const startDateGrid = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  startDateGrid.setDate(startDateGrid.getDate() - startDateGrid.getDay());

  const endMonth = addMonths(currentMonth, 1);
  endMonth.setDate(0);
  const endDateGrid = new Date(endMonth);
  endDateGrid.setDate(endDateGrid.getDate() + (6 - endDateGrid.getDay()));

  const days: string[] = [];
  const cursor = new Date(startDateGrid);
  while (cursor <= endDateGrid) {
    days.push(format(cursor, "yyyy-MM-dd"));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
