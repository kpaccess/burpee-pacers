"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DownloadIcon from "@mui/icons-material/Download";
import { getStorage, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { useRouter } from "next/navigation";
import WorkoutTimer from "@/components/WorkoutTimer";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/allowlist";
import { toDateKey } from "@/lib/date";
import {
  getDefaultWorkoutModeForWeekday,
  isLaunchAccessEnabled,
  QUALIFYING_SESSIONS_REQUIRED,
} from "@/lib/programConfig";
import { WorkoutMode } from "@/lib/workoutTimer";
import type { LevelDescription, UserData, WorkoutLog } from "@/types";
import { ADVANCED_LEVELS, BEGINNER_LEVELS } from "@/types";
import DashboardShell from "./DashboardShell";
import {
  DEFAULT_WORKOUT_DAYS,
  DASHBOARD_SECTIONS,
  type DashboardSectionId,
  WEIGHTED_TRAINING_PLAN,
  WORKOUT_DAY_OPTIONS,
} from "./config";
import {
  countScheduledDaysInWeek,
  formatWorkoutLogLabel,
  getCurrentStreak,
  getLoggedLevelId,
  getPaceLabel,
} from "./utils";
import {
  HealthRecoveryCard,
  FridayStrengthCard,
  WorkoutCalendarCard,
  WeightedTrainingCardWeb,
} from "./TrainingDetails";
import {
  HeroCard,
  ProgressionCard,
  RecentWorkoutsCard,
  ScheduleCard,
} from "./DashboardCards";

interface DashboardProps {
  userData: UserData;
  onMilestoneCheckin: () => void;
  onToggleWorkout?: (
    dateStr: string,
    completed: boolean,
    type?: "N" | "C" | "H",
    repsCompleted?: number,
  ) => void;
  onUpdateData?: (data: Partial<UserData>) => void;
  syncError?: string | null;
}

export default function DashboardScreen({
  userData,
  onMilestoneCheckin,
  onToggleWorkout,
  onUpdateData,
  syncError,
}: DashboardProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isPro = isLaunchAccessEnabled();

  const [openLevelChange, setOpenLevelChange] = useState(false);
  const [newLevel, setNewLevel] = useState(userData.currentLevelId || "F");
  const [workoutMenuAnchor, setWorkoutMenuAnchor] = useState<{
    anchorEl: HTMLElement;
    dateStr: string;
  } | null>(null);
  const [dismissedAdvancedSuggestion, setDismissedAdvancedSuggestion] =
    useState(false);
  const [openTrackSwitch, setOpenTrackSwitch] = useState(false);
  const [hybridFinishedThisSession, setHybridFinishedThisSession] =
    useState(false);
  const [pullingWorkExpanded, setPullingWorkExpanded] = useState(false);
  const [weightedTrainingEnabled, setWeightedTrainingEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("weightedTrainingEnabled") === "true";
  });
  const [healthSectionOpen, setHealthSectionOpen] = useState(false);
  const [healthActiveTab, setHealthActiveTab] = useState<"warmup" | "cooldown">(
    "warmup",
  );
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
  const [showTrainingDetails, setShowTrainingDetails] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<DashboardSectionId>("dashboard");

  const healthSectionRef = useRef<HTMLDivElement>(null);
  const detailedProgressRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<DashboardSectionId, HTMLElement | null>>({
    dashboard: null,
    workout: null,
    calendar: null,
    progress: null,
    strength: null,
  });

  const isMobile = useMediaQuery(
    (theme: { breakpoints: { down: (key: string) => string } }) =>
      theme.breakpoints.down("md"),
  );

  const inferredTier =
    userData.currentLevelId && /^B[1-6]$/.test(userData.currentLevelId)
      ? "beginner"
      : "advanced";
  const workoutTier = userData.workoutTier ?? inferredTier;
  const isAdvancedTrack = workoutTier === "advanced";
  const isBeginnerTrack = !isAdvancedTrack;
  const levelsForTrack = isAdvancedTrack ? ADVANCED_LEVELS : BEGINNER_LEVELS;

  const startDate = userData.startDate ? new Date(userData.startDate) : null;
  const milestoneDate = startDate ? addMonths(startDate, 6) : null;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const defaultTimerMode: WorkoutMode = getDefaultWorkoutModeForWeekday(
    isAdvancedTrack ? "advanced" : "beginner",
    today.getDay() + 1,
  ) as WorkoutMode;

  const storedWorkoutDays = Array.isArray(userData.workoutDays)
    ? userData.workoutDays.filter((weekday) =>
        WORKOUT_DAY_OPTIONS.some((option) => option.weekday === weekday),
      )
    : [];
  const selectedWorkoutDays =
    storedWorkoutDays.length > 0
      ? storedWorkoutDays
      : [...DEFAULT_WORKOUT_DAYS];

  const isFridayAdvanced = isAdvancedTrack && today.getDay() === 5;
  const isMilestoneReached =
    !!milestoneDate && isAfter(today, milestoneDate) && !userData.endDate;
  const daysPassed = startDate ? differenceInDays(today, startDate) : 0;

  const startDateGrid = startOfWeek(currentMonth);
  const endDateGrid = endOfMonth(currentMonth);
  endDateGrid.setDate(endDateGrid.getDate() + (6 - endDateGrid.getDay()));
  const trackingDays = eachDayOfInterval({
    start: startDateGrid,
    end: endDateGrid,
  }).map((d) => format(d, "yyyy-MM-dd"));

  const getWorkoutLabelForWeekday = (weekday: number): string => {
    if (!isAdvancedTrack) return "Beginner Burpees";
    if (weekday === 2) return "Navy Seals";
    if (weekday === 4) return "5-Count Pushups";
    if (weekday === 6) return "Hybrid";
    return "Workout";
  };

  const handleToggle = (
    dateStr: string,
    currentStatus: boolean,
    type?: "N" | "C" | "H",
  ) => {
    if (onToggleWorkout) {
      onToggleWorkout(dateStr, !currentStatus, type);
    }
  };

  const handleChangeLevel = () => {
    if (onUpdateData) {
      onUpdateData({ currentLevelId: newLevel });
    }
    setOpenLevelChange(false);
  };

  const handleWorkoutDayToggle = (weekday: number) => {
    if (!onUpdateData) return;

    const isSelected = selectedWorkoutDays.includes(weekday);
    if (isSelected && selectedWorkoutDays.length === 1) return;

    const nextWorkoutDays = isSelected
      ? selectedWorkoutDays.filter((day) => day !== weekday)
      : [...selectedWorkoutDays, weekday];

    onUpdateData({ workoutDays: nextWorkoutDays.sort((a, b) => a - b) });
  };

  const handleExportCSV = () => {
    const logs = userData.workoutLogs ?? [];
    const rows = [
      ["Date", "Completed", "Level", "Mode", "Reps Completed", "Notes"],
      ...logs.map((log) => [
        log.date,
        log.completed ? "Yes" : "No",
        log.levelCompleted ?? "",
        log.workoutType ?? "",
        log.repsCompleted != null ? String(log.repsCompleted) : "",
        log.notes ?? "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burpee-workout-data-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDay1PictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateData) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("File is too large. Maximum size is 5 MB.");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError(
        "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
      );
      e.target.value = "";
      return;
    }
    setPhotoError(null);
    e.target.value = "";

    if (!user?.uid) {
      setPhotoError("You must be signed in to upload a photo.");
      return;
    }

    try {
      const storage = getStorage();
      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const ext = extensionByType[file.type];
      const path = `users/${user.uid}/photos/day1_${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      onUpdateData({ startPictureUrl: downloadUrl });
    } catch (err) {
      console.error("Failed to upload photo:", err);
      setPhotoError("Failed to upload photo. Please try again.");
    }
  };

  const getWorkoutLogForDate = (dateStr: string): WorkoutLog | null => {
    const logs = userData.workoutLogs || [];
    const normalizedDate = toDateKey(dateStr);
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      if (toDateKey(logs[i].date) === normalizedDate) {
        return logs[i];
      }
    }
    return null;
  };

  const handleShowWarmup = useCallback(() => {
    setShowTrainingDetails(true);
    setHealthSectionOpen(true);
    setHealthActiveTab("warmup");
    setTimeout(
      () =>
        healthSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      120,
    );
  }, []);

  const handleShowCooldown = useCallback(() => {
    setShowTrainingDetails(true);
    setHealthSectionOpen(true);
    setHealthActiveTab("cooldown");
    setTimeout(
      () =>
        healthSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      120,
    );
  }, []);

  const openTrainingDetails = useCallback(
    (sectionId: "calendar" | "strength" = "calendar") => {
      setShowTrainingDetails(true);
      setTimeout(() => {
        sectionRefs.current[sectionId]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    },
    [],
  );

  const openDetailedProgress = useCallback(() => {
    setShowDetailedProgress(true);
    setTimeout(
      () =>
        detailedProgressRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      120,
    );
  }, []);

  React.useEffect(() => {
    localStorage.setItem(
      "weightedTrainingEnabled",
      String(weightedTrainingEnabled),
    );
  }, [weightedTrainingEnabled]);

  const todayWeightedDay =
    weightedTrainingEnabled && today.getDay() !== 5
      ? (WEIGHTED_TRAINING_PLAN[today.getDay()] ?? null)
      : null;

  const todayWorkoutLog = getWorkoutLogForDate(todayStr);
  const pullingWorkUnlocked =
    hybridFinishedThisSession ||
    (isFridayAdvanced && !!todayWorkoutLog?.completed);

  const formatWorkoutLabel = (levelCompleted?: string) =>
    formatWorkoutLogLabel(levelCompleted, isBeginnerTrack);

  const day1PictureUrl =
    userData.startPictureUrl ||
    (userData as UserData & { startPictureURl?: string }).startPictureURl ||
    null;

  const currentLevel = userData.currentLevelId
    ? (levelsForTrack.find((l) => l.id === userData.currentLevelId) ?? null)
    : null;

  const hasCompletedB6 = (userData.workoutLogs ?? []).some(
    (log) => log.completed && (log.levelCompleted ?? "").startsWith("B6"),
  );
  const shouldShowAdvancedSuggestion =
    isBeginnerTrack && hasCompletedB6 && !dismissedAdvancedSuggestion;

  const workoutLogs = [...(userData.workoutLogs ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const completedLogs = workoutLogs.filter((log) => log.completed);
  const currentWeekStart = startOfWeek(today);
  const previousWeekStart = subWeeks(currentWeekStart, 1);
  const currentWeekCompleted = completedLogs.filter((log) =>
    isSameWeek(parseISO(log.date), today),
  ).length;
  const previousWeekCompleted = completedLogs.filter((log) =>
    isSameWeek(parseISO(log.date), previousWeekStart),
  ).length;
  const scheduledDaysThisWeek = countScheduledDaysInWeek(
    currentWeekStart,
    selectedWorkoutDays,
  );
  const weeklyCompletionPercent =
    scheduledDaysThisWeek > 0
      ? Math.min(
          100,
          Math.round((currentWeekCompleted / scheduledDaysThisWeek) * 100),
        )
      : 0;
  const currentStreak = getCurrentStreak(
    completedLogs,
    selectedWorkoutDays,
    today,
  );
  const weeklyRingValue = Math.max(0, Math.min(100, weeklyCompletionPercent));
  const currentLevelIndex = currentLevel
    ? levelsForTrack.findIndex((level) => level.id === currentLevel.id)
    : -1;
  const nextLevel =
    currentLevelIndex >= 0
      ? (levelsForTrack[currentLevelIndex + 1] ?? null)
      : null;
  const nextWorkoutLabel = getWorkoutLabelForWeekday(today.getDay() + 1);
  const scheduledToday = selectedWorkoutDays.includes(today.getDay() + 1);
  const hasCompletedToday = !!todayWorkoutLog?.completed;
  const hasEnoughHistoryForComparison = completedLogs.some(
    (log) => parseISO(log.date) < startOfWeek(subWeeks(today, 1)),
  );
  const currentLevelQualifyingSessions = currentLevel
    ? completedLogs.filter(
        (log) => getLoggedLevelId(log.levelCompleted) === currentLevel.id,
      ).length
    : 0;
  const recentWorkouts = completedLogs.slice(0, 3);

  const nextScheduledWeekday = (() => {
    for (let offset = hasCompletedToday ? 1 : 0; offset < 8; offset += 1) {
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + offset);
      if (selectedWorkoutDays.includes(candidate.getDay() + 1)) {
        return candidate;
      }
    }
    return null;
  })();

  const nextScheduledLabel = nextScheduledWeekday
    ? `${format(nextScheduledWeekday, "EEEE")} - ${getWorkoutLabelForWeekday(nextScheduledWeekday.getDay() + 1)}`
    : "Choose your next workout day";

  const scrollToSection = (sectionId: DashboardSectionId) => {
    setActiveSection(sectionId);
    if (sectionId === "calendar" || sectionId === "strength") {
      setShowTrainingDetails(true);
      setTimeout(() => {
        sectionRefs.current[sectionId]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
      return;
    }
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  React.useEffect(() => {
    const sections = DASHBOARD_SECTIONS.map(
      ({ id }) => sectionRefs.current[id],
    ).filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id as DashboardSectionId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [todayWeightedDay, isFridayAdvanced]);

  const handleCalendarToggle = (
    dateStr: string,
    isCompleted: boolean,
    target?: HTMLElement,
  ) => {
    if (isCompleted) {
      handleToggle(dateStr, true);
      return;
    }
    if (isBeginnerTrack || !isPro) {
      handleToggle(dateStr, false);
      return;
    }
    if (target) {
      setWorkoutMenuAnchor({ anchorEl: target, dateStr });
    }
  };

  const currentLevelAsDescription =
    (currentLevel as LevelDescription | null) ?? null;

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        pb: { xs: 10, md: 4 },
        background: `radial-gradient(circle at top, ${alpha(theme.palette.primary.main, 0.12)}, transparent 28%), radial-gradient(circle at 85% 10%, ${alpha(theme.palette.secondary.main, 0.08)}, transparent 24%), ${theme.palette.background.default}`,
      })}
    >
      <DashboardShell
        isMobile={isMobile}
        activeSection={activeSection}
        isAdvancedTrack={isAdvancedTrack}
        userEmail={user?.email}
        canOpenAdmin={isAdmin(user?.email)}
        onOpenAdmin={() => router.push("/admin")}
        onLogout={logout}
        onScrollToSection={scrollToSection}
        currentLevelName={currentLevel?.name}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 4 },
            maxWidth: "1400px !important",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid
              container
              spacing={3}
              mb={4}
              id="dashboard"
              ref={(node: HTMLDivElement | null) => {
                sectionRefs.current.dashboard = node;
              }}
            >
              <Grid sx={{ xs: 12, lg: 8 }}>
                <HeroCard
                  hasCompletedToday={hasCompletedToday}
                  nextScheduledLabel={nextScheduledLabel}
                  scheduledToday={scheduledToday}
                  nextWorkoutLabel={nextWorkoutLabel}
                  weeklyRingValue={weeklyRingValue}
                  weeklyCompletionPercent={weeklyCompletionPercent}
                  currentStreak={currentStreak}
                  currentWeekCompleted={currentWeekCompleted}
                  scheduledDaysThisWeek={scheduledDaysThisWeek}
                  currentLevelName={currentLevel?.name ?? "Not set"}
                  programDayLabel={
                    startDate
                      ? `Day ${Math.max(0, daysPassed)}`
                      : "Program not started yet"
                  }
                  onOpenWorkout={() => scrollToSection("workout")}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} mb={4}>
              <Grid sx={{ xs: 12, lg: 12 }}>
                <ScheduleCard
                  selectedWorkoutDays={selectedWorkoutDays}
                  workoutDayOptions={WORKOUT_DAY_OPTIONS.map((item) => ({
                    ...item,
                  }))}
                  weightedTrainingEnabled={weightedTrainingEnabled}
                  nextScheduledLabel={nextScheduledLabel}
                  onToggleWorkoutDay={handleWorkoutDayToggle}
                  onToggleWeightedTraining={() =>
                    setWeightedTrainingEnabled((v) => !v)
                  }
                  onOpenCalendarDetails={() => openTrainingDetails("calendar")}
                  onOpenWarmupRecovery={handleShowWarmup}
                  getWorkoutLabelForWeekday={getWorkoutLabelForWeekday}
                  canEditWorkoutDays={Boolean(onUpdateData)}
                />
              </Grid>
            </Grid>

            <RecentWorkoutsCard
              recentWorkouts={recentWorkouts}
              onOpenProgressDetails={openDetailedProgress}
              formatWorkoutLogLabel={formatWorkoutLabel}
              getWorkoutLabelForWeekday={getWorkoutLabelForWeekday}
            />

            <AnimatePresence>
              {isMilestoneReached && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ marginBottom: 24 }}
                >
                  <Card
                    sx={(theme) => ({
                      p: 3,
                      border: `1px solid ${theme.palette.primary.main}`,
                      background: alpha(theme.palette.primary.main, 0.1),
                    })}
                  >
                    <Typography variant="h6" color="primary" gutterBottom>
                      6 Month Milestone Reached
                    </Typography>
                    <Typography variant="body1" mb={2}>
                      Time to check in, update your weight, and add a new photo
                      to see your progress.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onMilestoneCheckin}
                    >
                      Complete Check-in
                    </Button>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {shouldShowAdvancedSuggestion && (
              <Card
                sx={(theme) => ({
                  p: 3,
                  mb: 3,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.45)}`,
                  background: alpha(theme.palette.warning.main, 0.08),
                })}
              >
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Nice work - you completed Beginner B6
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  You are ready for the Advanced track. Want to move to
                  Foundation and keep progressing?
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      if (!onUpdateData) return;
                      onUpdateData({
                        workoutTier: "advanced",
                        currentLevelId: "F",
                      });
                      setDismissedAdvancedSuggestion(true);
                    }}
                  >
                    Switch to Advanced (Foundation)
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => setDismissedAdvancedSuggestion(true)}
                  >
                    Maybe later
                  </Button>
                </Box>
              </Card>
            )}

            <Grid
              container
              spacing={3}
              mb={4}
              id="workout"
              ref={(node: HTMLDivElement | null) => {
                sectionRefs.current.workout = node;
              }}
            >
              <Grid sx={{ xs: 12, lg: 7 }}>
                <WorkoutTimer
                  tier={workoutTier}
                  sealsGoal={currentLevel?.seals ?? 0}
                  sixCountsGoal={currentLevel?.sixCounts ?? 0}
                  defaultMode={defaultTimerMode}
                  onShowWarmup={handleShowWarmup}
                  onShowCooldown={handleShowCooldown}
                  onFinish={(repsCompleted, mode) => {
                    if (onToggleWorkout) {
                      const modeType: "N" | "C" =
                        mode === "N" ? "N" : mode === "H" ? "N" : "C";
                      onToggleWorkout(todayStr, true, modeType, repsCompleted);
                    }
                    if (mode === "H") {
                      setHybridFinishedThisSession(true);
                      setPullingWorkExpanded(true);
                    }
                  }}
                />
              </Grid>
              <Grid
                sx={{ xs: 12, lg: 5 }}
                id="progress"
                ref={(node: HTMLDivElement | null) => {
                  sectionRefs.current.progress = node;
                }}
              >
                <ProgressionCard
                  currentLevel={currentLevelAsDescription}
                  currentLevelIndex={currentLevelIndex}
                  levelsCount={levelsForTrack.length}
                  currentLevelQualifyingSessions={
                    currentLevelQualifyingSessions
                  }
                  qualifyingSessionsRequired={QUALIFYING_SESSIONS_REQUIRED}
                  nextLevel={nextLevel as LevelDescription | null}
                  hasEnoughHistoryForComparison={hasEnoughHistoryForComparison}
                  currentWeekCompleted={currentWeekCompleted}
                  previousWeekCompleted={previousWeekCompleted}
                  onOpenLevelChange={() => setOpenLevelChange(true)}
                  onOpenTrackSwitch={() => setOpenTrackSwitch(true)}
                  onOpenDetailedProgress={openDetailedProgress}
                  isAdvancedTrack={isAdvancedTrack}
                />
              </Grid>
            </Grid>

            <Collapse in={showTrainingDetails} timeout="auto" unmountOnExit>
              <Box>
                <Box ref={healthSectionRef}>
                  <HealthRecoveryCard
                    healthSectionOpen={healthSectionOpen}
                    healthActiveTab={healthActiveTab}
                    onToggleOpen={() => setHealthSectionOpen((v) => !v)}
                    onTabChange={setHealthActiveTab}
                  />
                </Box>

                <Box
                  id={!todayWeightedDay ? "strength" : undefined}
                  ref={(node: HTMLDivElement | null) => {
                    if (!todayWeightedDay) {
                      sectionRefs.current.strength = node;
                    }
                  }}
                >
                  <FridayStrengthCard
                    isFridayAdvanced={isFridayAdvanced}
                    pullingWorkUnlocked={pullingWorkUnlocked}
                    pullingWorkExpanded={pullingWorkExpanded}
                    onToggleExpanded={() => setPullingWorkExpanded((v) => !v)}
                  />
                </Box>

                <Box
                  id="calendar"
                  ref={(node: HTMLDivElement | null) => {
                    sectionRefs.current.calendar = node;
                  }}
                >
                  <WorkoutCalendarCard
                    currentMonth={currentMonth}
                    trackingDays={trackingDays}
                    todayStr={todayStr}
                    startDate={startDate}
                    syncError={syncError}
                    selectedWorkoutDays={selectedWorkoutDays}
                    onPrevMonth={() =>
                      setCurrentMonth(addMonths(currentMonth, -1))
                    }
                    onNextMonth={() =>
                      setCurrentMonth(addMonths(currentMonth, 1))
                    }
                    getWorkoutLogForDate={getWorkoutLogForDate}
                    getWorkoutLabelForWeekday={getWorkoutLabelForWeekday}
                    formatWorkoutLogLabel={formatWorkoutLabel}
                    onToggleWorkoutCheckbox={handleCalendarToggle}
                  />
                </Box>
              </Box>
            </Collapse>

            {(!isAdvancedTrack || showTrainingDetails) && todayWeightedDay && (
              <Box
                id="strength"
                ref={(node: HTMLDivElement | null) => {
                  sectionRefs.current.strength = node;
                }}
              >
                <WeightedTrainingCardWeb day={todayWeightedDay} />
              </Box>
            )}

            {showDetailedProgress && (
              <Card ref={detailedProgressRef} sx={{ p: 3, mb: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      More progress details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Photos, levels, and export stay here when you want the
                      deeper view.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShowDetailedProgress((value) => !value)}
                  >
                    {showDetailedProgress ? "Hide" : "Show"}
                  </Button>
                </Box>
              </Card>
            )}

            <Collapse in={showDetailedProgress} timeout="auto" unmountOnExit>
              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                mt={4}
                mb={2}
              >
                Progress Photos
              </Typography>
              <Grid container spacing={2} mb={4}>
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 2, height: "100%" }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="primary"
                      gutterBottom
                    >
                      Day 1
                    </Typography>
                    {day1PictureUrl ? (
                      <Box
                        component="img"
                        src={day1PictureUrl}
                        alt="Day 1 progress"
                        sx={(theme) => ({
                          width: "100%",
                          maxHeight: 320,
                          objectFit: "cover",
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                        })}
                      />
                    ) : (
                      <Box
                        sx={(theme) => ({
                          minHeight: 320,
                          borderRadius: 2,
                          border: `1px dashed ${alpha(theme.palette.common.white, 0.18)}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          gap: 1,
                          px: 3,
                        })}
                      >
                        <PhotoCamera color="secondary" />
                        <Typography variant="body1" fontWeight={700}>
                          Add your starting photo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This stays private to your account and helps you
                          compare progress over time.
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ mt: 2 }}>
                      {photoError && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                          {photoError}
                        </Alert>
                      )}
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        id="update-day1-picture"
                        type="file"
                        onChange={handleDay1PictureChange}
                      />
                      <label htmlFor="update-day1-picture">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<PhotoCamera />}
                        >
                          {day1PictureUrl
                            ? "Replace Day 1 Picture"
                            : "Upload Day 1 Picture"}
                        </Button>
                      </label>
                    </Box>
                  </Card>
                </Grid>
                <Grid sx={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 2, height: "100%" }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="secondary"
                      gutterBottom
                    >
                      6-Month Check-in
                    </Typography>
                    {userData.endPictureUrl ? (
                      <Box
                        component="img"
                        src={userData.endPictureUrl}
                        alt="6-month progress"
                        sx={(theme) => ({
                          width: "100%",
                          maxHeight: 320,
                          objectFit: "cover",
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                        })}
                      />
                    ) : (
                      <Box
                        sx={(theme) => ({
                          minHeight: 320,
                          borderRadius: 2,
                          border: `1px dashed ${alpha(theme.palette.common.white, 0.18)}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          gap: 1,
                          px: 3,
                        })}
                      >
                        <Typography variant="body1" fontWeight={700}>
                          6-month milestone photo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This photo becomes available after your milestone
                          check-in is completed.
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
              </Grid>

              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                mt={4}
                mb={2}
              >
                Program Levels
              </Typography>
              <Grid container spacing={2}>
                {levelsForTrack.map((lvl) => (
                  <Grid sx={{ xs: 12, sm: 6, md: 3 }} key={lvl.id}>
                    <Card
                      sx={(theme) => ({
                        p: 3,
                        transition: "0.3s",
                        border:
                          userData.currentLevelId === lvl.id
                            ? `2px solid ${theme.palette.primary.main}`
                            : "1px solid transparent",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          borderColor: "secondary.main",
                        },
                      })}
                    >
                      <Typography variant="h6" color="secondary" gutterBottom>
                        {lvl.name}
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {lvl.sixCounts || lvl.seals} reps
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {getPaceLabel(lvl.sixCounts || lvl.seals)}
                      </Typography>
                      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                        {userData.currentLevelId === lvl.id ? (
                          <Chip
                            label="Current level"
                            size="small"
                            color="primary"
                          />
                        ) : nextLevel?.id === lvl.id ? (
                          <Chip
                            label="Next milestone"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : null}
                        {isAdvancedTrack && lvl.seals > 0 ? (
                          <Chip
                            label={`${lvl.seals} seals - ${lvl.sixCounts} 5-count`}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="No pushups"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {isAdvancedTrack && (
                <Card sx={{ p: 3, mt: 4, mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Export Workout Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Download your full workout history as a CSV file.
                  </Typography>
                  {isPro ? (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportCSV}
                      disabled={(userData.workoutLogs ?? []).length === 0}
                    >
                      Export CSV
                    </Button>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        CSV export is open during launch.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => router.push("/pricing")}
                      >
                        View Launch Access
                      </Button>
                    </Box>
                  )}
                </Card>
              )}
            </Collapse>

            <Card component="footer" sx={{ p: 2.5, mt: 4 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
                flexWrap="wrap"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  BurpeePacers - Web available - iOS pre-release - Android
                  coming soon
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => router.push("/privacy")}
                  >
                    Privacy
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => scrollToSection("dashboard")}
                  >
                    Support
                  </Button>
                  <Typography variant="caption" color="text.disabled">
                    Copyright {new Date().getFullYear()}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Dialog
              open={openLevelChange}
              onClose={() => setOpenLevelChange(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Update Current Level</DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Have you progressed or want to scale back? Select your new
                  active level.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="change-level-label">Level</InputLabel>
                  <Select
                    labelId="change-level-label"
                    value={newLevel}
                    label="Level"
                    onChange={(e) => setNewLevel(e.target.value)}
                  >
                    {levelsForTrack.map((lvl) => (
                      <MenuItem key={lvl.id} value={lvl.id}>
                        {lvl.name} - {lvl.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                  <Button onClick={() => setOpenLevelChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleChangeLevel}
                  >
                    Save Level
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>

            <Dialog
              open={openTrackSwitch}
              onClose={() => setOpenTrackSwitch(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Switch Program</DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Choose the track you want to follow. Switching will reset your
                  current level to the start of the new track.
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant={isBeginnerTrack ? "contained" : "outlined"}
                    color="success"
                    onClick={() => {
                      if (!onUpdateData) return;
                      onUpdateData({
                        workoutTier: "beginner",
                        currentLevelId: "B1",
                      });
                      setOpenTrackSwitch(false);
                    }}
                  >
                    Beginner Track (B1-B6)
                  </Button>
                  <Button
                    variant={isAdvancedTrack ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => {
                      if (!onUpdateData) return;
                      onUpdateData({
                        workoutTier: "advanced",
                        currentLevelId: "F",
                      });
                      setOpenTrackSwitch(false);
                    }}
                  >
                    Advanced Track (Foundation-Elite)
                  </Button>
                </Box>
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button onClick={() => setOpenTrackSwitch(false)}>
                    Cancel
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>

            {isAdvancedTrack && isPro && (
              <Menu
                anchorEl={workoutMenuAnchor?.anchorEl}
                open={Boolean(workoutMenuAnchor)}
                onClose={() => setWorkoutMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    handleToggle(workoutMenuAnchor!.dateStr, false, "N");
                    setWorkoutMenuAnchor(null);
                  }}
                >
                  {userData.currentLevelId || ""}(N) - Navy Seals
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleToggle(workoutMenuAnchor!.dateStr, false, "C");
                    setWorkoutMenuAnchor(null);
                  }}
                >
                  {userData.currentLevelId || ""}(C) - 5-Count Pushups
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleToggle(workoutMenuAnchor!.dateStr, false, "H");
                    setWorkoutMenuAnchor(null);
                  }}
                >
                  {userData.currentLevelId || ""}(H) - Hybrid
                </MenuItem>
              </Menu>
            )}
          </motion.div>
        </Container>
      </DashboardShell>
    </Box>
  );
}
