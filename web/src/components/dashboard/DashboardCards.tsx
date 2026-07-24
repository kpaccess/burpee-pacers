import {
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import type { LevelDescription, WorkoutLog } from "@/types";
import { format, parseISO } from "date-fns";

type HeroCardProps = {
  hasCompletedToday: boolean;
  nextScheduledLabel: string;
  scheduledToday: boolean;
  nextWorkoutLabel: string;
  weeklyRingValue: number;
  weeklyCompletionPercent: number;
  currentStreak: number;
  currentWeekCompleted: number;
  scheduledDaysThisWeek: number;
  currentLevelName?: string | null;
  programDayLabel: string;
  onOpenWorkout: () => void;
};

export function HeroCard({
  hasCompletedToday,
  nextScheduledLabel,
  scheduledToday,
  nextWorkoutLabel,
  weeklyRingValue,
  weeklyCompletionPercent,
  currentStreak,
  currentWeekCompleted,
  scheduledDaysThisWeek,
  currentLevelName,
  programDayLabel,
  onOpenWorkout,
}: HeroCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: {
          xs: theme.layout.dashboard.heroCardPadding.xs,
          md: theme.layout.dashboard.heroCardPadding.md,
        },
        minHeight: "100%",
        background: theme.layout.dashboard.heroGradient,
        border: theme.layout.dashboard.heroBorder,
      })}
    >
      <Stack spacing={2.5}>
        <Box
          display="flex"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: "secondary.main", letterSpacing: "0.18em" }}
            >
              TODAY&apos;S TRAINING
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ mt: 0.5, mb: 1, fontSize: { xs: "2rem", md: "2.8rem" } }}
            >
              {hasCompletedToday
                ? "Workout complete for today."
                : "Keep your momentum going."}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={(theme) => ({
                maxWidth: theme.layout.dashboard.heroDescriptionMaxWidth,
              })}
            >
              {hasCompletedToday
                ? `Nice work. Your next scheduled session is ${nextScheduledLabel}.`
                : scheduledToday
                  ? `You are scheduled for ${nextWorkoutLabel} today. Stay consistent, keep the reps clean, and protect the streak you are building.`
                  : "Today is a recovery day. Review your progress, prep for the next session, and keep your weekly rhythm intact."}
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              minWidth: theme.layout.dashboard.heroRingMinWidth,
              textAlign: "center",
              alignSelf: "center",
            })}
          >
            <Box
              sx={(theme) => ({
                width: {
                  xs: theme.layout.dashboard.heroRingSize.xs,
                  md: theme.layout.dashboard.heroRingSize.md,
                },
                height: {
                  xs: theme.layout.dashboard.heroRingSize.xs,
                  md: theme.layout.dashboard.heroRingSize.md,
                },
                borderRadius: "50%",
                mx: "auto",
                background: `conic-gradient(${theme.palette.secondary.main} ${weeklyRingValue * 3.6}deg, ${theme.layout.dashboard.weeklyRingTrack} 0deg)`,
                p: {
                  xs: theme.layout.dashboard.heroRingPadding.xs,
                  md: theme.layout.dashboard.heroRingPadding.md,
                },
              })}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  px: { xs: 1.75, md: 2.25 },
                  py: { xs: 1.25, md: 1.5 },
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ lineHeight: 1, fontSize: "2rem", px: 0.5 }}
                >
                  {weeklyCompletionPercent}%
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={(theme) => ({
                    mt: 0.75,
                    lineHeight: 1.15,
                    maxWidth: theme.layout.dashboard.heroWeeklyLabelMaxWidth,
                  })}
                >
                  weekly
                  <br />
                  completion
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip
            label={`Current streak: ${currentStreak}`}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`This week: ${currentWeekCompleted}/${scheduledDaysThisWeek || 0}`}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`Level: ${currentLevelName ?? "Not set"}`}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Chip label={programDayLabel} variant="outlined" />
        </Stack>

        <Button variant="contained" size="large" onClick={onOpenWorkout}>
          {hasCompletedToday ? "View next session" : "Open workout timer"}
        </Button>
      </Stack>
    </Card>
  );
}

type ScheduleCardProps = {
  selectedWorkoutDays: number[];
  workoutDayOptions: { weekday: number; short: string }[];
  weightedTrainingEnabled: boolean;
  nextScheduledLabel: string;
  onToggleWorkoutDay: (weekday: number) => void;
  onToggleWeightedTraining: () => void;
  onOpenCalendarDetails: () => void;
  onOpenWarmupRecovery: () => void;
  getWorkoutLabelForWeekday: (weekday: number) => string;
  canEditWorkoutDays: boolean;
};

export function ScheduleCard({
  selectedWorkoutDays,
  workoutDayOptions,
  weightedTrainingEnabled,
  nextScheduledLabel,
  onToggleWorkoutDay,
  onToggleWeightedTraining,
  onOpenCalendarDetails,
  onOpenWarmupRecovery,
  getWorkoutLabelForWeekday,
  canEditWorkoutDays,
}: ScheduleCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: {
          xs: theme.layout.dashboard.scheduleCardPadding.xs,
          md: theme.layout.dashboard.scheduleCardPadding.md,
        },
        height: "100%",
      })}
    >
      <Typography variant="h6" display="flex" alignItems="center" gap={1}>
        <CalendarMonthIcon color="secondary" /> Schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Do the program on:
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
        {workoutDayOptions.map(({ weekday, short }) => {
          const isSelected = selectedWorkoutDays.includes(weekday);
          const canToggleOff = !isSelected || selectedWorkoutDays.length > 1;

          return (
            <Chip
              key={weekday}
              label={`${short} - ${getWorkoutLabelForWeekday(weekday)}`}
              color={isSelected ? "primary" : "default"}
              variant={isSelected ? "filled" : "outlined"}
              onClick={() => onToggleWorkoutDay(weekday)}
              disabled={!canToggleOff || !canEditWorkoutDays}
              sx={{
                fontWeight: 600,
                opacity: isSelected || canToggleOff ? 1 : 0.55,
              }}
            />
          );
        })}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, display: "block" }}
      >
        Tap days to customize your weekly schedule. Keep at least one workout
        day selected.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Next scheduled workout: {nextScheduledLabel}
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <FitnessCenterIcon
            sx={(theme) => ({
              fontSize: theme.layout.dashboard.scheduleIconSize,
              color: "text.secondary",
            })}
          />
          <Typography variant="body2">Weighted Training</Typography>
        </Box>
        <Box
          component="span"
          onClick={onToggleWeightedTraining}
          sx={{ cursor: "pointer" }}
        >
          <Chip
            label={weightedTrainingEnabled ? "On" : "Off"}
            size="small"
            color={weightedTrainingEnabled ? "warning" : "default"}
            variant={weightedTrainingEnabled ? "filled" : "outlined"}
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </Box>
      {weightedTrainingEnabled && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 1, display: "block", lineHeight: 1.4 }}
        >
          Strength card appears on Mon, Wed and Fri after your burpees.
        </Typography>
      )}
      <Box display="flex" gap={1} flexWrap="wrap" mt={2.5}>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={onOpenCalendarDetails}
        >
          View calendar details
        </Button>
        <Button size="small" color="inherit" onClick={onOpenWarmupRecovery}>
          View warm-up and recovery
        </Button>
      </Box>
    </Card>
  );
}

type RecentWorkoutsCardProps = {
  recentWorkouts: WorkoutLog[];
  onOpenProgressDetails: () => void;
  formatWorkoutLogLabel: (levelCompleted?: string) => string | null;
  getWorkoutLabelForWeekday: (weekday: number) => string;
};

export function RecentWorkoutsCard({
  recentWorkouts,
  onOpenProgressDetails,
  formatWorkoutLogLabel,
  getWorkoutLabelForWeekday,
}: RecentWorkoutsCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: theme.layout.dashboard.sectionCardPadding,
        mb: 4,
        border: "1px red solid",
      })}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        mb={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Recent workouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your latest completed sessions, with the newest first.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onOpenProgressDetails}
        >
          View progress details
        </Button>
      </Box>
      {recentWorkouts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Complete your first workout and your recent history will show up here.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {recentWorkouts.map((log) => (
            <Box
              key={`${log.date}-${log.levelCompleted ?? "session"}`}
              sx={(theme) => ({
                p: 2,
                borderRadius: 2,
                border: theme.layout.dashboard.surfaceBorder,
                bgcolor: theme.layout.dashboard.surfaceBackground,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: `${theme.layout.dashboard.recentWorkoutDateColumnWidth}px minmax(0, 1fr) auto`,
                },
                gap: 1.5,
                alignItems: "center",
              })}
            >
              <Typography variant="body2" fontWeight={700}>
                {format(parseISO(log.date), "MMM d, yyyy")}
              </Typography>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {formatWorkoutLogLabel(log.levelCompleted) ??
                    getWorkoutLabelForWeekday(parseISO(log.date).getDay() + 1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {log.repsCompleted
                    ? `${log.repsCompleted} reps`
                    : "Completed"}{" "}
                  - 20 min
                </Typography>
              </Box>
              <Chip
                label="Completed"
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}

type ProgressionCardProps = {
  currentLevel: LevelDescription | null;
  currentLevelIndex: number;
  levelsCount: number;
  currentLevelQualifyingSessions: number;
  qualifyingSessionsRequired: number;
  nextLevel: LevelDescription | null;
  hasEnoughHistoryForComparison: boolean;
  currentWeekCompleted: number;
  previousWeekCompleted: number;
  onOpenLevelChange: () => void;
  onOpenTrackSwitch: () => void;
  onOpenDetailedProgress: () => void;
  isAdvancedTrack: boolean;
};

export function ProgressionCard({
  currentLevel,
  currentLevelIndex,
  levelsCount,
  currentLevelQualifyingSessions,
  qualifyingSessionsRequired,
  nextLevel,
  hasEnoughHistoryForComparison,
  currentWeekCompleted,
  previousWeekCompleted,
  onOpenLevelChange,
  onOpenTrackSwitch,
  onOpenDetailedProgress,
  isAdvancedTrack,
}: ProgressionCardProps) {
  return (
    <Card
      sx={(theme) => ({
        p: theme.layout.dashboard.sectionCardPadding,
        height: "100%",
      })}
    >
      <Typography variant="h6" fontWeight={800} gutterBottom>
        Current level progression
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Level number, session progress at this level, and the clearest next
        step.
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Current level
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            {currentLevel?.name ?? "No level selected"}
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            p: 2,
            borderRadius: 2,
            bgcolor: theme.layout.dashboard.surfaceBackground,
            border: theme.layout.dashboard.surfaceBorder,
          })}
        >
          <Typography variant="caption" color="text.secondary">
            Program level
          </Typography>
          <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
            Level {Math.max(currentLevelIndex + 1, 0)} of {levelsCount}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Progress at this level
          </Typography>
          <Typography
            variant="body1"
            fontWeight={700}
            sx={{ mt: 0.5, mb: 0.75 }}
          >
            {Math.min(
              currentLevelQualifyingSessions,
              qualifyingSessionsRequired,
            )}{" "}
            of {qualifyingSessionsRequired} sessions completed
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.round(
              (Math.min(
                currentLevelQualifyingSessions,
                qualifyingSessionsRequired,
              ) /
                qualifyingSessionsRequired) *
                100,
            )}
            sx={(theme) => ({
              height: theme.layout.dashboard.progressBarHeight,
              borderRadius: 999,
              bgcolor: theme.layout.dashboard.progressTrack,
              "& .MuiLinearProgress-bar": { bgcolor: "secondary.main" },
            })}
          />
        </Box>
        <Box
          sx={(theme) => ({
            p: 2,
            borderRadius: 2,
            bgcolor: theme.layout.dashboard.surfaceBackground,
            border: theme.layout.dashboard.surfaceBorder,
          })}
        >
          <Typography variant="caption" color="text.secondary">
            Next milestone
          </Typography>
          <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
            {nextLevel?.name ?? "Current top level"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {nextLevel?.description ??
              "You have reached the current top of this training track."}
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            p: 2,
            borderRadius: 2,
            bgcolor: theme.layout.dashboard.weeklyDeltaBackground,
            border: theme.layout.dashboard.weeklyDeltaBorder,
          })}
        >
          <Typography variant="body2" fontWeight={700}>
            This week vs last week
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {hasEnoughHistoryForComparison
              ? currentWeekCompleted === previousWeekCompleted
                ? `You matched last week with ${currentWeekCompleted} completed workouts.`
                : currentWeekCompleted > previousWeekCompleted
                  ? `You are ${currentWeekCompleted - previousWeekCompleted} workout ahead of last week.`
                  : `You are ${previousWeekCompleted - currentWeekCompleted} workout behind last week.`
              : "Complete your first workout to begin weekly comparisons."}
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" onClick={onOpenLevelChange}>
            Update Level
          </Button>
          <Button size="small" variant="outlined" onClick={onOpenTrackSwitch}>
            Switch Program
          </Button>
          {isAdvancedTrack && (
            <Button
              size="small"
              variant="text"
              color="secondary"
              onClick={onOpenDetailedProgress}
            >
              View all level details
            </Button>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
