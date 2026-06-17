"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  Select,
  MenuItem,
  Menu,
  InputLabel,
  FormControl,
  Alert,
  Collapse,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DownloadIcon from "@mui/icons-material/Download";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  ADVANCED_LEVELS,
  BEGINNER_LEVELS,
  UserData,
  WorkoutLog,
} from "../types";
import { WorkoutMode } from "../lib/workoutTimer";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  differenceInDays,
  isAfter,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { useAuth } from "../context/AuthContext";
import { toDateKey } from "../lib/date";
import { isAdmin } from "../lib/allowlist";
// import { useSubscription } from "../hooks/useSubscription";
import { useRouter } from "next/navigation";
import WorkoutTimer from "./WorkoutTimer";

// ── Friday Pulling Work configuration ────────────────────────────────────────
// Navy Seals and 5-count pushups are mostly pushing movements. Adding pulling
// work on Fridays supports shoulder health, posture, and longevity — especially
// for users over 40/50. Extend this array to add more options in the future.
//
// videoId  → used for both the YouTube thumbnail image and the watch link
// formCues → 3 concise technique reminders shown below the thumbnail
const PULLING_WORK_CONFIG = [
  {
    id: "home",
    title: "Option A: At Home",
    subtitle: "Best for users with dumbbells, kettlebells, or resistance bands.",
    exercises: [
      {
        name: "Dumbbell Rows",
        sets: "3 sets",
        reps: "10–15 reps",
        benefit: "Builds upper back strength",
        videoId: "roCP6wCXPqo",
        videoLabel: "How to Perfect Your Dumbbell Row — Men's Health",
        formCues: [
          "Rest one knee and hand on a bench for support",
          "Keep your back flat — pull elbow straight to hip",
          "Squeeze your shoulder blade at the top, lower slowly",
        ],
      },
      {
        name: "Kettlebell Rows",
        sets: "3 sets",
        reps: "10–15 reps",
        benefit: "Balances pushing muscles",
        videoId: "IyQAMOV0WAc",
        videoLabel: "How to Perform the Kettlebell Row",
        formCues: [
          "Hinge at hips, keep back flat and neutral",
          "Pull kettlebell to your hip, elbow close to body",
          "Squeeze shoulder blade at the top, lower with control",
        ],
      },
      {
        name: "Band Pull-Aparts",
        sets: "2 sets",
        reps: "15–20 reps",
        benefit: "Protects shoulders",
        videoId: "LoBBo1dtY6I",
        videoLabel: "Band Pull-Aparts for Shoulder Stability",
        formCues: [
          "Hold the band at shoulder height, arms straight",
          "Pull band apart until it touches your chest",
          "Keep arms straight throughout — control the return",
        ],
      },
    ],
  },
  {
    id: "gym",
    title: "Option B: At Gym",
    subtitle: "Best for users with access to machines and cables.",
    exercises: [
      {
        name: "Lat Pulldown",
        sets: "3 sets",
        reps: "10–15 reps",
        benefit: "Builds upper back strength",
        videoId: "CAwf7n6Luuc",
        videoLabel: "How To: Lat Pulldown | 3 Golden Rules",
        formCues: [
          "Sit tall, lean back slightly (15–20°)",
          "Pull bar to your upper chest, drive elbows down",
          "Full stretch at the top, squeeze your lats at the bottom",
        ],
      },
      {
        name: "Seated Row",
        sets: "3 sets",
        reps: "10–15 reps",
        benefit: "Improves posture",
        videoId: "EU7bOadUsNI",
        videoLabel: "Seated Cable Row — Proper Form & Technique",
        formCues: [
          "Sit tall, keep your back straight throughout",
          "Pull the handle to your lower chest or belly button",
          "Squeeze shoulder blades together at the end position",
        ],
      },
      {
        name: "Face Pulls",
        sets: "2 sets",
        reps: "15–20 reps",
        benefit: "Reduces injury risk",
        videoId: "eIq5CB9JfKE",
        videoLabel: "Stop Doing Face Pulls Like This — Athlean-X",
        formCues: [
          "Set cable at face height or slightly above",
          "Pull rope to your face, hands splitting apart",
          "Rotate wrists outward at the end — hold 1 second",
        ],
      },
    ],
  },
];
// ── Health, Safety & Recovery configuration ───────────────────────────────────
// Shown for both tracks. Warm-up and cool-down routines to bookend every session.
const HEALTH_RECOVERY_CONFIG = {
  warmup: {
    title: "Warm-up",
    duration: "5–8 minutes",
    exercises: [
      { name: "Arm Circles", duration: "30 sec each direction", cue: "Start small, gradually widen the circles" },
      { name: "Shoulder Rolls", duration: "10 reps forward, 10 backward", cue: "Roll shoulders fully — up, back, down, forward" },
      { name: "Hip Circles", duration: "10 reps each direction", cue: "Hands on hips, draw wide circles with your pelvis" },
      { name: "Bodyweight Squats", duration: "10 reps", cue: "Slow and controlled — feel your hips and knees open up" },
      { name: "Step-Back Walkouts", duration: "8 reps", cue: "Step back, walk hands out to plank, walk back, stand up" },
      { name: "Light Jogging / Marching in Place", duration: "1–2 minutes", cue: "Raise your knees, swing your arms — get your heart rate up" },
    ],
  },
  cooldown: {
    title: "Cool-down",
    duration: "5–10 minutes",
    exercises: [
      { name: "Slow Walking", duration: "2–3 minutes", cue: "Keep moving — don't sit down immediately after a workout" },
      { name: "Chest Stretch", duration: "30 sec each side", cue: "Clasp hands behind back, open chest, look slightly up" },
      { name: "Shoulder Stretch", duration: "30 sec each side", cue: "Pull arm across chest, keep shoulder relaxed and down" },
      { name: "Child's Pose", duration: "60 seconds", cue: "Arms extended forward, breathe deeply into your lower back" },
      { name: "Hip Flexor Stretch", duration: "30 sec each side", cue: "Kneel on one knee, push hips forward — feel the front of your hip" },
      { name: "Deep Breathing", duration: "5 slow breaths", cue: "In for 4 counts, hold 2, out for 6 — activate your rest response" },
    ],
  },
  epsom: "A warm Epsom salt bath (1–2 cups in warm water, 15–20 min) may help reduce muscle soreness for some people after a tough session. This is optional — listen to your body.",
  disclaimer: "If you are over 40, have a pre-existing medical condition, or have been sedentary for more than 6 months, consult your doctor before starting this program. Stop immediately and seek medical attention if you experience sharp pain, chest tightness, dizziness, or shortness of breath. This program is not a substitute for professional medical advice.",
} as const;

// ── Weighted Training plan ────────────────────────────────────────────────────
// Mon → Day 1, Wed → Day 2, Fri → Day 3. Mirrors iOS WeightedTrainingPlan.
// Weekday indices match JS Date.getDay(): 1=Mon, 3=Wed, 5=Fri.
const WEIGHTED_TRAINING_PLAN: Record<number, {
  title: string;
  focus: string;
  exercises: { name: string; sets: number; reps: string; note?: string }[];
}> = {
  1: {
    title: "Day 1 — Pulling + Biceps",
    focus: "Biceps · Back · Forearms",
    exercises: [
      { name: "Chin-ups (supinated grip)", sets: 4, reps: "Max", note: "Best bicep builder — aim 6–10" },
      { name: "Barbell or Dumbbell Row",   sets: 3, reps: "8–10", note: "2-sec hold at top" },
      { name: "Barbell Curl",              sets: 3, reps: "10–12", note: "Strict form, no swing" },
      { name: "Hammer Curl",               sets: 2, reps: "12", note: "Forearm + brachialis" },
    ],
  },
  3: {
    title: "Day 2 — Pushing + Shoulders",
    focus: "Shoulders · Chest · Triceps",
    exercises: [
      { name: "Face Pulls",               sets: 3, reps: "15–20", note: "Cable or band at face height — protects rotator cuff" },
      { name: "Incline Dumbbell Press",   sets: 3, reps: "10–12", note: "Upper chest focus" },
      { name: "Lateral Raise",            sets: 3, reps: "12–15", note: "Light weight, controlled" },
      { name: "Tricep Dips or Pushdowns", sets: 3, reps: "10–12" },
    ],
  },
  5: {
    title: "Day 3 — Legs + Core",
    focus: "Legs · Glutes · Core",
    exercises: [
      { name: "Goblet Squat",      sets: 4, reps: "10–12",  note: "Or barbell squat" },
      { name: "Romanian Deadlift", sets: 3, reps: "10",     note: "Hinge at hips, hamstring focus" },
      { name: "Walking Lunges",    sets: 3, reps: "12/leg" },
      { name: "Plank",             sets: 3, reps: "30–45s" },
    ],
  },
};

const DEFAULT_WORKOUT_DAYS = [2, 4, 6] as const;
const WORKOUT_DAY_OPTIONS = [
  { weekday: 2, short: "Mon" },
  { weekday: 4, short: "Wed" },
  { weekday: 6, short: "Fri" },
] as const;

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

export default function Dashboard({
  userData,
  onMilestoneCheckin,
  onToggleWorkout,
  onUpdateData,
  syncError,
}: DashboardProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  // const { isPro } = useSubscription(user?.uid ?? null, user?.email);
  const isPro = true; // Temporarily free for all — subscription disabled until subscriber base grows
  const [openLevelChange, setOpenLevelChange] = useState(false);
  const [newLevel, setNewLevel] = useState(userData.currentLevelId || "F");
  const [workoutMenuAnchor, setWorkoutMenuAnchor] = useState<{
    anchorEl: HTMLElement;
    dateStr: string;
  } | null>(null);
  const [dismissedAdvancedSuggestion, setDismissedAdvancedSuggestion] =
    useState(false);
  const [openTrackSwitch, setOpenTrackSwitch] = useState(false);
  // ── Friday Pulling Work state ─────────────────────────────────────────────
  // Tracks whether the Hybrid workout was completed this browser session so the
  // pulling work section unlocks and auto-expands immediately after completion.
  const [hybridFinishedThisSession, setHybridFinishedThisSession] = useState(false);
  const [pullingWorkExpanded, setPullingWorkExpanded] = useState(false);
  // ── Weighted Training toggle — persisted in localStorage (off by default) ──
  const [weightedTrainingEnabled, setWeightedTrainingEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("weightedTrainingEnabled") === "true";
  });
  // ── Health & Recovery section state ────────────────────────────────────────
  const [healthSectionOpen, setHealthSectionOpen] = useState(false);
  const [healthActiveTab, setHealthActiveTab] = useState<"warmup" | "cooldown">("warmup");
  const healthSectionRef = useRef<HTMLDivElement>(null);
  // Legacy users may not have workoutTier stored yet; keep them on advanced
  // unless they are clearly on a beginner B-level.
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

  // ── Day-of-week default timer mode (Advanced Track only) ──────────────────
  // Mon → Navy Seals ("N"), Wed → 5-Count Pushups ("C"), Fri → Hybrid ("H")
  const todayDayName = format(today, "EEE"); // "Mon" | "Tue" | ... | "Sun"
  const defaultTimerMode: WorkoutMode = isAdvancedTrack
    ? todayDayName === "Fri"
      ? "H"
      : todayDayName === "Wed"
        ? "C"
        : "N"
    : "C"; // beginner always uses "C" (single mode, ignored by buildWorkoutTimerConfig)

  const storedWorkoutDays = Array.isArray(userData.workoutDays)
    ? userData.workoutDays.filter((weekday) =>
        WORKOUT_DAY_OPTIONS.some((option) => option.weekday === weekday),
      )
    : [];
  const selectedWorkoutDays =
    storedWorkoutDays.length > 0 ? storedWorkoutDays : [...DEFAULT_WORKOUT_DAYS];

  // Show the Pulling Work section only on Fridays for the Advanced Track
  const isFridayAdvanced = isAdvancedTrack && todayDayName === "Fri";

  const isMilestoneReached =
    !!milestoneDate && isAfter(today, milestoneDate) && !userData.endDate;
  const daysPassed = startDate ? differenceInDays(today, startDate) : 0;
  const daysToMilestone = milestoneDate
    ? differenceInDays(milestoneDate, today)
    : 0;

  // Generate calendar days for the selected month
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const startDateGrid = startOfWeek(currentMonth);
  const endDateGrid = endOfWeek(endOfMonth(currentMonth));

  const trackingDays = eachDayOfInterval({
    start: startDateGrid,
    end: endDateGrid,
  }).map((d) => format(d, "yyyy-MM-dd"));

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

  const getWorkoutLabelForWeekday = (weekday: number): string => {
    if (!isAdvancedTrack) return "Burpees";
    if (weekday === 2) return "Navy Seals";
    if (weekday === 4) return "5-Count";
    if (weekday === 6) return "Hybrid";
    return "Workout";
  };

  const handleWorkoutDayToggle = (weekday: number) => {
    if (!onUpdateData) return;

    const isSelected = selectedWorkoutDays.includes(weekday);
    if (isSelected && selectedWorkoutDays.length === 1) return;

    const nextWorkoutDays = isSelected
      ? selectedWorkoutDays.filter((day) => day !== weekday)
      : [...selectedWorkoutDays, weekday];

    onUpdateData({
      workoutDays: nextWorkoutDays.sort((a, b) => a - b),
    });
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
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burpee-workout-data-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleDay1PictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateData) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("File is too large. Maximum size is 5 MB.");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    setPhotoError(null);

    // Reset input so selecting the same file again still triggers onChange.
    e.target.value = "";

    try {
      const storage = getStorage();
      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const ext = extensionByType[file.type];
      const path = `users/${user!.uid}/photos/day1_${Date.now()}.${ext}`;
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

  // ── Health & Recovery scroll handlers ─────────────────────────────────────
  const handleShowWarmup = useCallback(() => {
    setHealthSectionOpen(true);
    setHealthActiveTab("warmup");
    setTimeout(() => healthSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, []);

  const handleShowCooldown = useCallback(() => {
    setHealthSectionOpen(true);
    setHealthActiveTab("cooldown");
    setTimeout(() => healthSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, []);

  // Weighted Training: persist toggle and resolve today's plan (null on rest days)
  React.useEffect(() => {
    localStorage.setItem("weightedTrainingEnabled", String(weightedTrainingEnabled));
  }, [weightedTrainingEnabled]);
  const todayWeightedDay = weightedTrainingEnabled
    ? WEIGHTED_TRAINING_PLAN[today.getDay()] ?? null
    : null;

  // Pulling work unlocks when the Hybrid workout is done this session OR if
  // today's log already shows completed (e.g. user refreshed after finishing).
  const todayWorkoutLog = getWorkoutLogForDate(todayStr);
  const pullingWorkUnlocked =
    hybridFinishedThisSession || (isFridayAdvanced && !!todayWorkoutLog?.completed);

  const formatWorkoutLogLabel = (levelCompleted?: string): string | null => {
    if (!levelCompleted) return null;

    const beginnerMatch = levelCompleted.match(/^B([1-6])\(C\)$/);
    if (beginnerMatch) {
      return `Beginner ${beginnerMatch[1]}`;
    }

    // Backward-compatible display for older beginner logs saved before B-levels.
    if (isBeginnerTrack && levelCompleted === "1B(C)") {
      return "Beginner 1";
    }

    const advancedMatch = levelCompleted.match(/^([0-9A-Za-z]+)\(([NCH])\)$/);
    if (advancedMatch) {
      const [, levelId, mode] = advancedMatch;
      return `${levelId}(${mode})`;
    }

    return levelCompleted;
  };

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography
              variant="h3"
              fontWeight={800}
              color="primary"
              gutterBottom
            >
              My Burpee Journey
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {startDate
                ? `Day ${Math.max(0, daysPassed)} • Busy People Program`
                : "Complete your first workout to start the program • Busy People Program"}
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            {isAdmin(user?.email) && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.push("/admin")}
                size="small"
              >
                Admin
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
              size="small"
            >
              Log Out / Reset
            </Button>
          </Box>
        </Box>

        {/* Milestone Alert */}
        <AnimatePresence>
          {isMilestoneReached && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginBottom: 24 }}
            >
              <Card
                sx={{
                  p: 3,
                  border: "1px solid #FF3366",
                  background: "rgba(255, 51, 102, 0.1)",
                }}
              >
                <Typography variant="h6" color="primary" gutterBottom>
                  🎉 6 Month Milestone Reached!
                </Typography>
                <Typography variant="body1" mb={2}>
                  Time to check in, update your weight, and add a new photo to
                  see your progress.
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
            sx={{
              p: 3,
              mb: 3,
              border: "1px solid rgba(255, 193, 7, 0.45)",
              background: "rgba(255, 193, 7, 0.08)",
            }}
          >
            <Typography variant="h6" color="warning.main" gutterBottom>
              Nice work - you completed Beginner B6
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You are ready for the Advanced track. Want to move to Foundation
              and keep progressing?
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

        {/* Stats and Video Row */}
        <Grid container spacing={3} mb={4}>
          <Grid sx={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <CalendarMonthIcon color="secondary" /> Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Do the program on:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {WORKOUT_DAY_OPTIONS.map(({ weekday, short }) => {
                  const isSelected = selectedWorkoutDays.includes(weekday);
                  const canToggleOff = !isSelected || selectedWorkoutDays.length > 1;

                  return (
                    <Chip
                      key={weekday}
                      label={`${short} · ${getWorkoutLabelForWeekday(weekday)}`}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      onClick={() => handleWorkoutDayToggle(weekday)}
                      disabled={!canToggleOff || !onUpdateData}
                      sx={{
                        fontWeight: 600,
                        opacity: isSelected || canToggleOff ? 1 : 0.55,
                      }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Tap days to customize your weekly schedule. Keep at least one
                workout day selected.
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FitnessCenterIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2">Weighted Training</Typography>
                </Box>
                <Box
                  component="span"
                  onClick={() => setWeightedTrainingEnabled((v) => !v)}
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
                <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.4 }}>
                  Strength card appears on Mon, Wed &amp; Fri after your burpees.
                </Typography>
              )}
            </Card>
          </Grid>

          <Grid sx={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <LocalFireDepartmentIcon color="secondary" /> Stats Overview
              </Typography>
              <Box mt={1}>
                {isAdvancedTrack ? (
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography
                      variant="body1"
                      color="primary"
                      fontWeight="bold"
                    >
                      Current: {currentLevel?.name ?? "Not set"}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setOpenLevelChange(true)}
                    >
                      {userData.currentLevelId ? "Update" : "Set Level"}
                    </Button>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography
                      variant="body1"
                      color="primary"
                      fontWeight="bold"
                    >
                      Current: {currentLevel?.name ?? "Not set"}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setOpenLevelChange(true)}
                    >
                      {userData.currentLevelId ? "Update" : "Set Level"}
                    </Button>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Start Date:{" "}
                  {startDate
                    ? startDate.toLocaleDateString()
                    : "Not started yet — complete your first workout to begin"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting Weight: {userData.startWeight} lbs ({Math.round(userData.startWeight / 2.205)} kg)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Protein target: ~{Math.round((userData.startWeight / 2.205) * 1.5)}g/day
                  <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                    (1.5g × kg)
                  </Typography>
                </Typography>
                {isBeginnerTrack && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Workout option: Burpee without pushups
                  </Typography>
                )}
                <Box mt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip
                    label={
                      isAdvancedTrack
                        ? isPro
                          ? "Advanced track active"
                          : "Advanced track selected"
                        : "Beginner track selected"
                    }
                    color={isAdvancedTrack ? "primary" : "secondary"}
                    sx={{ fontWeight: 700 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setOpenTrackSwitch(true)}
                    sx={{ fontSize: "0.7rem", py: 0.25 }}
                  >
                    Switch Program
                  </Button>
                </Box>
                <Typography variant="body2" color="secondary" mt={1}>
                  Launch access active: all features are free right now.
                </Typography>
                {!isMilestoneReached && daysToMilestone > 0 && (
                  <Typography variant="body2" color="secondary" mt={1}>
                    {daysToMilestone} days until 6-month check-in.
                  </Typography>
                )}
                {userData.endDate && (
                  <>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Milestone reached on:{" "}
                      {new Date(userData.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Weight: {userData.endWeight}
                    </Typography>
                  </>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid sx={{ xs: 12, md: 4 }}>
            <WorkoutTimer
              tier={workoutTier}
              sealsGoal={currentLevel?.seals ?? 0}
              sixCountsGoal={currentLevel?.sixCounts ?? 0}
              defaultMode={defaultTimerMode}
              onShowWarmup={handleShowWarmup}
              onShowCooldown={handleShowCooldown}
              onFinish={(repsCompleted, mode) => {
                if (onToggleWorkout) {
                  // Map WorkoutMode → toggle type. "H" (Hybrid) is treated
                  // as "N" for log compatibility (it includes Navy Seals).
                  const modeType: "N" | "C" = mode === "N" ? "N" : mode === "H" ? "N" : "C";
                  onToggleWorkout(todayStr, true, modeType, repsCompleted);
                }
                // Unlock and auto-expand the Friday Pulling Work section
                if (mode === "H") {
                  setHybridFinishedThisSession(true);
                  setPullingWorkExpanded(true);
                }
              }}
            />
          </Grid>
        </Grid>

        {/* ── Health, Safety & Recovery ─────────────────────────────────────────
            Shown for both tracks. Warm-up and cool-down routines with safety note. */}
        <Card
          ref={healthSectionRef}
          sx={{
            p: 3,
            mb: 4,
            border: "1px solid rgba(76,175,80,0.3)",
            background: "rgba(76,175,80,0.04)",
          }}
        >
          {/* Header row */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <HealthAndSafetyIcon color="success" />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Warm-up, Cool-down &amp; Recovery
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="success"
              size="small"
              endIcon={healthSectionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setHealthSectionOpen((v) => !v)}
              sx={{ whiteSpace: "nowrap" }}
            >
              {healthSectionOpen ? "Hide" : "Show Routines"}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            A 5-minute warm-up reduces injury risk. A 5–10 minute cool-down
            speeds recovery. Build the habit — it compounds over 6 months.
          </Typography>

          <Collapse in={healthSectionOpen} timeout="auto" unmountOnExit>
            <Box mt={2.5}>
              {/* Tabs */}
              <Tabs
                value={healthActiveTab}
                onChange={(_, val: "warmup" | "cooldown") => setHealthActiveTab(val)}
                textColor="inherit"
                TabIndicatorProps={{ style: { backgroundColor: "#4caf50" } }}
                sx={{ mb: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Tab label="Warm-up (5–8 min)" value="warmup" sx={{ fontWeight: 700, fontSize: "0.8rem" }} />
                <Tab label="Cool-down (5–10 min)" value="cooldown" sx={{ fontWeight: 700, fontSize: "0.8rem" }} />
              </Tabs>

              {/* Exercise list */}
              {(["warmup", "cooldown"] as const).map((tab) => (
                <Box key={tab} hidden={healthActiveTab !== tab}>
                  {healthActiveTab === tab && (
                    <Stack spacing={1.5}>
                      {HEALTH_RECOVERY_CONFIG[tab].exercises.map((ex, i) => (
                        <Box
                          key={ex.name}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 1.5,
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="success.main"
                            fontWeight={700}
                            sx={{ minWidth: 18, lineHeight: 1.8 }}
                          >
                            {i + 1}.
                          </Typography>                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {ex.name}
                            </Typography>
                            <Typography variant="caption" color="secondary.main" sx={{ display: "block" }}>
                              {ex.duration}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic" }}>
                              {ex.cue}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}

              <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.08)" }} />

              {/* Epsom salt tip */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid rgba(0,229,255,0.15)",
                  background: "rgba(0,229,255,0.04)",
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
                  RECOVERY TIP (OPTIONAL)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {HEALTH_RECOVERY_CONFIG.epsom}
                </Typography>
              </Box>

              {/* Safety disclaimer */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid rgba(255,152,0,0.25)",
                  background: "rgba(255,152,0,0.04)",
                }}
              >
                <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
                  SAFETY NOTICE
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {HEALTH_RECOVERY_CONFIG.disclaimer}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </Card>

        {/* ── Friday Pulling Work ──────────────────────────────────────────────
            Visible only on Fridays for Advanced Track users.
            Locked before the Hybrid workout is done; auto-unlocks on completion. */}
        {isFridayAdvanced && (
          <Card
            sx={{
              p: 3,
              mb: 4,
              border: pullingWorkUnlocked
                ? "1px solid rgba(0,229,255,0.35)"
                : "1px solid #333",
              transition: "border-color 0.4s ease",
            }}
          >
            {/* ── Header row ── */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="h6" fontWeight={700} color={pullingWorkUnlocked ? "secondary" : "text.secondary"}>
                  Pulling Work: Balance Your Body
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {pullingWorkUnlocked
                    ? "Great job finishing your Hybrid workout! Now balance your body with pulling work."
                    : "Complete your Hybrid workout above to unlock Friday Pulling Work."}
                </Typography>
              </Box>

              {/* Toggle button — only shown once unlocked */}
              {pullingWorkUnlocked && (
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={() => setPullingWorkExpanded((v) => !v)}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {pullingWorkExpanded ? "Hide" : "View Pulling Options"}
                </Button>
              )}
            </Box>

            {/* ── Locked state: rationale copy ── */}
            {!pullingWorkUnlocked && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ mt: 1.5, fontStyle: "italic" }}
              >
                Burpees are powerful, but they are mostly pushing movements. Add
                pulling work on Friday to keep your shoulders healthy, improve
                posture, and build a balanced body.
              </Typography>
            )}

            {/* ── Unlocked & expanded: exercise cards ── */}
            {pullingWorkUnlocked && pullingWorkExpanded && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Burpees are powerful, but they are mostly pushing movements.
                  Add pulling work on Friday to keep your shoulders healthy,
                  improve posture, and build a balanced body.
                </Typography>

                <Grid container spacing={2}>
                  {PULLING_WORK_CONFIG.map((option) => (
                    <Grid sx={{ xs: 12, md: 6 }} key={option.id}>
                      <Card
                        sx={{
                          p: 2.5,
                          height: "100%",
                          border: "1px solid #2a2a2a",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                          {option.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 2 }}
                        >
                          {option.subtitle}
                        </Typography>

                        <Stack spacing={2}>
                          {option.exercises.map((ex, i) => (
                            <Box
                              key={ex.name}
                              sx={{
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }}
                            >
                              {/* ── Clickable YouTube thumbnail ── */}
                              <Box
                                component="a"
                                href={`https://www.youtube.com/watch?v=${ex.videoId}`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Watch ${ex.name} tutorial on YouTube`}
                                sx={{
                                  display: "block",
                                  position: "relative",
                                  lineHeight: 0,
                                  "&:hover .play-overlay": { bgcolor: "rgba(0,0,0,0.55)" },
                                }}
                              >
                                <Box
                                  component="img"
                                  src={`https://img.youtube.com/vi/${ex.videoId}/hqdefault.jpg`}
                                  alt={`${ex.name} demonstration`}
                                  sx={{
                                    width: "100%",
                                    height: 130,
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                                {/* Play button overlay */}
                                <Box
                                  className="play-overlay"
                                  sx={{
                                    position: "absolute",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    bgcolor: "rgba(0,0,0,0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background 0.2s",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 38, height: 38,
                                      borderRadius: "50%",
                                      bgcolor: "rgba(255,255,255,0.88)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Typography sx={{ fontSize: 13, color: "#000", ml: "2px" }}>▶</Typography>
                                  </Box>
                                </Box>
                              </Box>

                              {/* ── Exercise details ── */}
                              <Box sx={{ p: 1.5 }}>
                                <Box display="flex" alignItems="baseline" gap={0.75} mb={0.5}>
                                  <Typography variant="caption" color="text.disabled">{i + 1}.</Typography>
                                  <Typography variant="body2" fontWeight={700}>{ex.name}</Typography>
                                </Box>
                                <Typography variant="caption" color="secondary.main" sx={{ display: "block" }}>
                                  {ex.sets} × {ex.reps}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1, fontStyle: "italic" }}>
                                  {ex.benefit}
                                </Typography>

                                {/* Form cues */}
                                <Stack spacing={0.25} mb={1}>
                                  {ex.formCues.map((cue) => (
                                    <Box key={cue} display="flex" gap={0.75} alignItems="flex-start">
                                      <Typography variant="caption" color="secondary.main" sx={{ flexShrink: 0, lineHeight: 1.6 }}>›</Typography>
                                      <Typography variant="caption" color="text.secondary">{cue}</Typography>
                                    </Box>
                                  ))}
                                </Stack>

                                {/* Watch link */}
                                <Typography
                                  component="a"
                                  variant="caption"
                                  href={`https://www.youtube.com/watch?v=${ex.videoId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{
                                    color: "secondary.main",
                                    textDecoration: "none",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  Watch demo →
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Card>
        )}

        {/* Monthly Tracker Row */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" color="primary">
              Workout Calendar
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                Prev
              </Button>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: 120, textAlign: "center" }}
              >
                {format(currentMonth, "MMMM yyyy")}
              </Typography>
              <Button
                size="small"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                Next
              </Button>
            </Box>
          </Box>
          {syncError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {syncError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Check off your workout on your selected schedule
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns="repeat(7, 1fr)"
            gap={1}
            mb={1}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Typography
                key={day}
                variant="caption"
                color="text.secondary"
                align="center"
                fontWeight="bold"
              >
                {day}
              </Typography>
            ))}
          </Box>

          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
            {trackingDays.map((dateStr) => {
              const dayObj = new Date(dateStr + "T00:00:00");
              const dayLog = getWorkoutLogForDate(dateStr);
              const isCompleted = !!dayLog?.completed;
              const weekday = dayObj.getDay() + 1;
              const isWorkoutDay = selectedWorkoutDays.includes(weekday);
              const isCurrentMonth = isSameMonth(dayObj, currentMonth);
              const isPast = dateStr < todayStr;

              return (
                <Box
                  key={dateStr}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: 80,
                    p: 0.5,
                    borderRadius: 2,
                    border: isCompleted
                      ? "1px solid #00E5FF"
                      : isWorkoutDay
                        ? "1px solid #333"
                        : "1px dashed #222",
                    background: isCompleted
                      ? "rgba(0, 229, 255, 0.1)"
                      : "transparent",
                    opacity: isCurrentMonth ? (isWorkoutDay ? 1 : 0.6) : 0.2,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentMonth ? "bold" : "normal"}
                  >
                    {format(dayObj, "d")}
                  </Typography>
                  {isWorkoutDay || isCompleted ? (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      mt={0.5}
                    >
                      <Checkbox
                        checked={isCompleted}
                        disabled={isPast}
                        onChange={(e) => {
                          if (isCompleted) {
                            handleToggle(dateStr, true); // uncheck
                          } else if (isBeginnerTrack || !isPro) {
                            handleToggle(dateStr, false);
                          } else {
                            setWorkoutMenuAnchor({
                              anchorEl: e.currentTarget.parentElement as HTMLElement,
                              dateStr,
                            });
                          }
                        }}
                        color="secondary"
                        size="small"
                        sx={{ p: 0.5 }}
                      />
                      {isCompleted && dayLog?.levelCompleted && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#00E5FF",
                            lineHeight: 1,
                            fontSize: "0.65rem",
                          }}
                          align="center"
                        >
                          {formatWorkoutLogLabel(dayLog.levelCompleted)}
                        </Typography>
                      )}
                      {isPast && !isCompleted && (
                        <Typography
                          variant="caption"
                          sx={{ color: "#555", fontSize: "0.6rem", lineHeight: 1 }}
                          align="center"
                        >
                          Missed
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, color: "#666", fontSize: "0.65rem" }}
                    >
                      Rest
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* ── Weighted Training Card ──────────────────────────────────────────
            Opt-in, shown on Mon/Wed/Fri only when the toggle is enabled. */}
        {todayWeightedDay && (
          <WeightedTrainingCardWeb day={todayWeightedDay} />
        )}

        {/* Progress Photos */}
        <Typography variant="h5" fontWeight={700} gutterBottom mt={4} mb={2}>
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
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No Day 1 picture uploaded yet.
                </Typography>
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
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Your latest check-in picture will appear here after milestone
                  check-in.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        <>
          <Typography variant="h5" fontWeight={700} gutterBottom mt={4} mb={2}>
            Program Levels
          </Typography>
          <Grid container spacing={2}>
            {levelsForTrack.map((lvl) => (
              <Grid sx={{ xs: 12, sm: 6, md: 3 }} key={lvl.id}>
                <Card
                  sx={{
                    p: 3,
                    transition: "0.3s",
                    border:
                      userData.currentLevelId === lvl.id
                        ? "2px solid #FF3366"
                        : "1px solid transparent",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: "secondary.main",
                    },
                  }}
                >
                  <Typography variant="h6" color="secondary" gutterBottom>
                    {lvl.name}{" "}
                    {userData.currentLevelId === lvl.id && "(Current)"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lvl.description}
                  </Typography>
                  {isAdvancedTrack ? (
                    lvl.seals > 0 && (
                      <Box mt={2} display="flex" gap={1}>
                        <Chip
                          label={`${lvl.seals} Seals`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${lvl.sixCounts} 5-count pushups`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )
                  ) : (
                    <Box mt={2} display="flex" gap={1}>
                      <Chip
                        label={`${lvl.sixCounts} Burpees (no pushups)`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </>

        {/* Export Workout Data */}
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

        {/* Update Level Dialog */}
        <Dialog
          open={openLevelChange}
          onClose={() => setOpenLevelChange(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Current Level</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Have you progressed or want to scale back? Select your new active
              level.
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
              <Button onClick={() => setOpenLevelChange(false)}>Cancel</Button>
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

        {/* Switch Program Dialog */}
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
                  onUpdateData({ workoutTier: "beginner", currentLevelId: "B1" });
                  setOpenTrackSwitch(false);
                }}
              >
                Beginner Track (B1–B6)
              </Button>
              <Button
                variant={isAdvancedTrack ? "contained" : "outlined"}
                color="primary"
                onClick={() => {
                  if (!onUpdateData) return;
                  onUpdateData({ workoutTier: "advanced", currentLevelId: "F" });
                  setOpenTrackSwitch(false);
                }}
              >
                Advanced Track (Foundation–Elite)
              </Button>
            </Box>
            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button onClick={() => setOpenTrackSwitch(false)}>Cancel</Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Workout Selection Menu */}
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
              {userData.currentLevelId || ""}(N) — Navy Seals
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleToggle(workoutMenuAnchor!.dateStr, false, "C");
                setWorkoutMenuAnchor(null);
              }}
            >
              {userData.currentLevelId || ""}(C) — 5-Count Pushups
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleToggle(workoutMenuAnchor!.dateStr, false, "H");
                setWorkoutMenuAnchor(null);
              }}
            >
              {userData.currentLevelId || ""}(H) — Hybrid
            </MenuItem>
          </Menu>
        )}
        {/* iOS / Android availability banner */}
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            border: "1px solid rgba(255,51,102,0.25)",
            background: "rgba(255,51,102,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.25}>
              📱 iOS app in pre-release
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The native iOS app is being tested before public release. Android coming soon.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="iOS — Pre-release"
              size="small"
              sx={{ bgcolor: "rgba(255,51,102,0.15)", color: "primary.main", fontWeight: 600 }}
            />
            <Chip
              label="Android — Soon"
              size="small"
              variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.15)", color: "text.secondary" }}
            />
          </Stack>
        </Box>
      </motion.div>
    </Box>
  );
}

// ── Weighted Training Card ────────────────────────────────────────────────────

function WeightedTrainingCardWeb({
  day,
}: {
  day: { title: string; focus: string; exercises: { name: string; sets: number; reps: string; note?: string }[] };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      sx={{
        mb: 4,
        border: "1px solid rgba(255,152,0,0.3)",
        background: "rgba(255,152,0,0.04)",
        overflow: "hidden",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 2, cursor: "pointer", "&:hover": { background: "rgba(255,152,0,0.06)" } }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 34, height: 34,
              borderRadius: 2,
              bgcolor: "warning.main",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <FitnessCenterIcon sx={{ fontSize: 18, color: "#000" }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {day.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {day.focus}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {expanded ? "▲" : "▼"}
        </Typography>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ borderColor: "rgba(255,152,0,0.15)" }} />
        <Stack divider={<Divider sx={{ ml: 7, borderColor: "rgba(255,255,255,0.05)" }} />}>
          {day.exercises.map((ex) => (
            <Box key={ex.name} display="flex" alignItems="flex-start" gap={1.5} sx={{ px: 2, py: 1.25 }}>
              <Typography
                variant="caption"
                fontWeight={900}
                color="warning.main"
                sx={{ minWidth: 28, pt: 0.25, fontSize: "0.8rem" }}
              >
                {ex.sets}×
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="body2" fontWeight={600}>{ex.name}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {ex.reps}
                  </Typography>
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
