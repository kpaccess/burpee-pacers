"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  AppBar,
  Avatar,
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
  Toolbar,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DownloadIcon from "@mui/icons-material/Download";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CalendarViewMonthRoundedIcon from "@mui/icons-material/CalendarViewMonthRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
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
  subWeeks,
  subMonths,
  isSameWeek,
  parseISO,
} from "date-fns";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { useAuth } from "../context/AuthContext";
import { toDateKey } from "../lib/date";
import { isAdmin } from "../lib/allowlist";
import {
  getDefaultWorkoutModeForWeekday,
  isLaunchAccessEnabled,
  QUALIFYING_SESSIONS_REQUIRED,
} from "../lib/programConfig";
// import { useSubscription } from "../hooks/useSubscription";
import { useRouter } from "next/navigation";
import WorkoutTimer from "./WorkoutTimer";
import BurpeeLogoIcon from "./BurpeeLogoIcon";

// ── Friday Pulling Work configuration ────────────────────────────────────────
// Navy Seals and 5-count pushups are mostly pushing movements. Adding pulling
// work on Fridays supports shoulder health, posture, and longevity — especially
// for users over 40/50. Extend this array to add more options in the future.
//
// formCues → 3 concise technique reminders for each exercise
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

const DASHBOARD_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { id: "workout", label: "Workout", icon: <BoltRoundedIcon /> },
  { id: "calendar", label: "Calendar", icon: <CalendarViewMonthRoundedIcon /> },
  { id: "progress", label: "Progress", icon: <ShowChartRoundedIcon /> },
  { id: "strength", label: "Strength", icon: <AccessibilityNewRoundedIcon /> },
] as const;

type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

type SummaryStat = {
  label: string;
  value: string;
  sublabel: string;
  accent: string;
  icon: React.ReactNode;
};

function countScheduledDaysInWeek(weekStart: Date, selectedWorkoutDays: number[]) {
  return eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart),
  }).filter((day) => selectedWorkoutDays.includes(day.getDay() + 1)).length;
}

function getCompletedDates(workoutLogs: WorkoutLog[]) {
  return workoutLogs
    .filter((log) => log.completed)
    .map((log) => toDateKey(log.date))
    .sort();
}

function getCurrentStreak(workoutLogs: WorkoutLog[], selectedWorkoutDays: number[], today: Date) {
  const completedDates = new Set(getCompletedDates(workoutLogs));
  const cursor = new Date(today);
  let streak = 0;

  while (cursor >= subMonths(today, 12)) {
    const weekday = cursor.getDay() + 1;
    if (selectedWorkoutDays.includes(weekday)) {
      const dateKey = format(cursor, "yyyy-MM-dd");
      if (completedDates.has(dateKey)) {
        streak += 1;
      } else if (cursor <= today) {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLoggedLevelId(levelCompleted?: string): string | null {
  if (!levelCompleted) return null;

  if (levelCompleted === "1B(C)") {
    return "B1";
  }

  const match = levelCompleted.match(/^([0-9A-Za-z]+)\(([NCH])\)$/);
  return match ? match[1] : null;
}

function getPaceLabel(goal: number, minutes = 20): string {
  if (goal <= 0) return "Set your level to see pacing";
  const secondsPerRep = Math.round((minutes * 60) / goal);
  return `1 rep every ${secondsPerRep} seconds`;
}

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
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
  const healthSectionRef = useRef<HTMLDivElement>(null);
  const detailedProgressRef = useRef<HTMLDivElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("dashboard");
  const sectionRefs = useRef<Record<DashboardSectionId, HTMLElement | null>>({
    dashboard: null,
    workout: null,
    calendar: null,
    progress: null,
    strength: null,
  });
  const isMobile = useMediaQuery((theme: { breakpoints: { down: (key: string) => string } }) =>
    theme.breakpoints.down("md"),
  );
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
    storedWorkoutDays.length > 0 ? storedWorkoutDays : [...DEFAULT_WORKOUT_DAYS];

  // Show the Pulling Work section only on Fridays for the Advanced Track
  const isFridayAdvanced = isAdvancedTrack && today.getDay() === 5;

  const isMilestoneReached =
    !!milestoneDate && isAfter(today, milestoneDate) && !userData.endDate;
  const daysPassed = startDate ? differenceInDays(today, startDate) : 0;

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
    if (!isAdvancedTrack) return "Beginner Burpees";
    if (weekday === 2) return "Navy Seals";
    if (weekday === 4) return "5-Count Pushups";
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

  const openDetailedProgress = useCallback(() => {
    setShowDetailedProgress(true);
    setTimeout(() => {
      detailedProgressRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  }, []);

  // Weighted Training: persist toggle and resolve today's plan (null on rest days)
  React.useEffect(() => {
    localStorage.setItem("weightedTrainingEnabled", String(weightedTrainingEnabled));
  }, [weightedTrainingEnabled]);
  const todayWeightedDay = weightedTrainingEnabled && today.getDay() !== 5
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
  const workoutLogs = [...(userData.workoutLogs ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const completedLogs = workoutLogs.filter((log) => log.completed);
  const currentWeekStart = startOfWeek(today);
  const previousWeekStart = subWeeks(currentWeekStart, 1);
  const currentMonthStart = startOfMonth(today);
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const currentWeekCompleted = completedLogs.filter((log) =>
    isSameWeek(parseISO(log.date), today),
  ).length;
  const previousWeekCompleted = completedLogs.filter((log) =>
    isSameWeek(parseISO(log.date), previousWeekStart),
  ).length;
  const scheduledDaysThisWeek = countScheduledDaysInWeek(currentWeekStart, selectedWorkoutDays);
  const weeklyCompletionPercent = scheduledDaysThisWeek > 0
    ? Math.min(100, Math.round((currentWeekCompleted / scheduledDaysThisWeek) * 100))
    : 0;
  const workoutsThisMonth = completedLogs.filter((log) =>
    parseISO(log.date) >= currentMonthStart,
  ).length;
  const previousMonthWorkouts = completedLogs.filter((log) => {
    const date = parseISO(log.date);
    return date >= previousMonthStart && date < currentMonthStart;
  }).length;
  const totalTrainingMinutes = completedLogs.length * 20;
  const personalBest = completedLogs.reduce((best, log) => {
    if (typeof log.repsCompleted !== "number") return best;
    return Math.max(best, log.repsCompleted);
  }, 0);
  const currentStreak = getCurrentStreak(completedLogs, selectedWorkoutDays, today);
  const weeklyRingValue = Math.max(0, Math.min(100, weeklyCompletionPercent));
  const currentLevelIndex = currentLevel
    ? levelsForTrack.findIndex((level) => level.id === currentLevel.id)
    : -1;
  const levelProgressPercent = currentLevelIndex >= 0
    ? Math.round(((currentLevelIndex + 1) / levelsForTrack.length) * 100)
    : 0;
  const nextLevel = currentLevelIndex >= 0 ? levelsForTrack[currentLevelIndex + 1] ?? null : null;
  const nextWorkoutLabel = getWorkoutLabelForWeekday(today.getDay() + 1);
  const scheduledToday = selectedWorkoutDays.includes(today.getDay() + 1);
  const hasCompletedToday = !!todayWorkoutLog?.completed;
  const showNewUserOnboarding = isBeginnerTrack && completedLogs.length === 0;
  const hasEnoughHistoryForComparison = completedLogs.some(
    (log) => parseISO(log.date) < startOfWeek(subWeeks(today, 1)),
  );
  const currentLevelQualifyingSessions = currentLevel
    ? completedLogs.filter((log) => getLoggedLevelId(log.levelCompleted) === currentLevel.id).length
    : 0;
  const recentWorkouts = completedLogs.slice(0, 5);
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
    ? `${format(nextScheduledWeekday, "EEEE")} · ${getWorkoutLabelForWeekday(nextScheduledWeekday.getDay() + 1)}`
    : "Choose your next workout day";
  const summaryStats: SummaryStat[] = [
    {
      label: "Current streak",
      value: `${currentStreak} workouts`,
      sublabel: currentStreak > 0 ? "Keep the chain alive" : "Start a new streak today",
      accent: "#FF3366",
      icon: <LocalFireDepartmentIcon />,
    },
    {
      label: "This month",
      value: `${workoutsThisMonth} workouts`,
      sublabel: `${Math.max(0, workoutsThisMonth - previousMonthWorkouts)} more than last month`,
      accent: "#00E5FF",
      icon: <CheckCircleRoundedIcon />,
    },
    {
      label: "Training time",
      value: `${totalTrainingMinutes} min`,
      sublabel: `${completedLogs.length} completed sessions total`,
      accent: "#4CAF50",
      icon: <InsightsRoundedIcon />,
    },
    {
      label: "Current level",
      value: currentLevel?.name ?? "Not set",
      sublabel: nextLevel ? `Next up: ${nextLevel.name}` : "Top of the current track",
      accent: "#FFC107",
      icon: <FlagRoundedIcon />,
    },
    {
      label: "Weekly completion",
      value: `${weeklyCompletionPercent}%`,
      sublabel: `${currentWeekCompleted}/${scheduledDaysThisWeek || 0} scheduled workouts`,
      accent: "#00E5FF",
      icon: <QueryStatsRoundedIcon />,
    },
    {
      label: "Personal best",
      value: personalBest > 0 ? `${personalBest} reps` : "No timed PR yet",
      sublabel: personalBest > 0 ? "Highest timer-verified session" : "Complete a timer workout to set it",
      accent: "#FF3366",
      icon: <EmojiEventsRoundedIcon />,
    },
  ];
  const visibleSummaryStats = isMobile ? summaryStats.slice(0, 4) : summaryStats;
  const scrollToSection = (sectionId: DashboardSectionId) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  React.useEffect(() => {
    const sections = DASHBOARD_SECTIONS
      .map(({ id }) => sectionRefs.current[id])
      .filter((section): section is HTMLElement => Boolean(section));

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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: { xs: 10, md: 4 },
        background:
          "radial-gradient(circle at top, rgba(255,51,102,0.12), transparent 28%), radial-gradient(circle at 85% 10%, rgba(0,229,255,0.08), transparent 24%), #090909",
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          top: 0,
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(10,10,10,0.88)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, width: "100%", mx: "auto", px: { xs: 2, md: 3 }, gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: "transparent" }}>
                <Box sx={{ transform: "scale(0.78)" }}>
                  <BurpeeLogoIcon size={56} />
                </Box>
              </Avatar>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                BurpeePacers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isAdvancedTrack ? "Advanced program" : "Beginner program"}
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Stack direction="row" spacing={0.75} sx={{ flex: 1, justifyContent: "center" }}>
              {DASHBOARD_SECTIONS.map((section) => (
                <Button
                  key={section.id}
                  color="inherit"
                  startIcon={section.icon}
                  onClick={() => scrollToSection(section.id)}
                  sx={{
                    color: activeSection === section.id ? "primary.main" : "text.secondary",
                    borderBottom: activeSection === section.id ? "2px solid" : "2px solid transparent",
                    borderRadius: 0,
                    px: 1.5,
                  }}
                >
                  {section.label}
                </Button>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
            {!isMobile && isAdmin(user?.email) && (
              <Button variant="outlined" color="secondary" onClick={() => router.push("/admin")} size="small">
                Admin
              </Button>
            )}
            {!isMobile && (
              <Tooltip title={user?.email ?? "Signed in"}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(255,51,102,0.2)", color: "primary.main" }}>
                  {(user?.email?.[0] ?? "B").toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
            {!isMobile && (
              <Button variant="outlined" color="error" onClick={logout} size="small" startIcon={<LogoutRoundedIcon />}>
                Log Out
              </Button>
            )}
            {isMobile && (
              <IconButton color="inherit" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation menu">
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <Box sx={{ width: 290, p: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <BurpeeLogoIcon size={44} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                BurpeePacers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentLevel?.name ?? "Program dashboard"}
              </Typography>
            </Box>
          </Box>
          <List sx={{ py: 0 }}>
            {DASHBOARD_SECTIONS.map((section) => (
              <ListItemButton
                key={section.id}
                selected={activeSection === section.id}
                onClick={() => scrollToSection(section.id)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <Box sx={{ mr: 1.5, color: activeSection === section.id ? "primary.main" : "text.secondary" }}>
                  {section.icon}
                </Box>
                <ListItemText primary={section.label} />
              </ListItemButton>
            ))}
            {isAdmin(user?.email) && (
              <ListItemButton onClick={() => { setMobileNavOpen(false); router.push("/admin"); }} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemText primary="Admin" />
              </ListItemButton>
            )}
            <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
              <Box sx={{ mr: 1.5, color: "error.main" }}>
                <LogoutRoundedIcon />
              </Box>
              <ListItemText primary="Log Out / Reset" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, maxWidth: "1400px !important" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Grid container spacing={3} mb={4} id="dashboard" ref={(node) => { sectionRefs.current.dashboard = node; }}>
          <Grid sx={{ xs: 12, lg: 8 }}>
            <Card
              sx={{
                p: { xs: 2.5, md: 3.5 },
                minHeight: "100%",
                background:
                  "linear-gradient(135deg, rgba(255,51,102,0.14), rgba(20,20,20,0.96) 52%, rgba(0,229,255,0.08))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Stack spacing={2.5}>
                <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
                  <Box>
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.18em" }}>
                      TODAY&apos;S TRAINING
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, mb: 1, fontSize: { xs: "2rem", md: "2.8rem" } }}>
                      {hasCompletedToday ? "Workout complete for today." : "Keep your momentum going."}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
                      {hasCompletedToday
                        ? `Nice work. Your next scheduled session is ${nextScheduledLabel}.`
                        : scheduledToday
                          ? `You're scheduled for ${nextWorkoutLabel} today. Stay consistent, keep the reps clean, and protect the streak you're building.`
                          : "Today is a recovery day. Review your progress, prep for the next session, and keep your weekly rhythm intact."}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 160,
                      textAlign: "center",
                      alignSelf: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 124,
                        height: 124,
                        borderRadius: "50%",
                        mx: "auto",
                        background: `conic-gradient(#00E5FF ${weeklyRingValue * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                        p: "10px",
                      }}
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
                        }}
                      >
                        <Typography variant="h4" fontWeight={800}>
                          {weeklyCompletionPercent}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          weekly completion
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
                  <Chip label={`Current streak: ${currentStreak}`} color="primary" sx={{ fontWeight: 700 }} />
                  <Chip label={`This week: ${currentWeekCompleted}/${scheduledDaysThisWeek || 0}`} variant="outlined" sx={{ fontWeight: 700 }} />
                  <Chip label={`Level: ${currentLevel?.name ?? "Not set"}`} variant="outlined" sx={{ fontWeight: 700 }} />
                  <Chip label={startDate ? `Day ${Math.max(0, daysPassed)}` : "Program not started yet"} variant="outlined" />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => scrollToSection(hasCompletedToday ? "calendar" : "workout")}
                  >
                    {hasCompletedToday ? "View next session" : "Open workout timer"}
                  </Button>
                  <Button variant="outlined" size="large" color="secondary" onClick={() => scrollToSection(hasCompletedToday ? "progress" : "calendar")}>
                    {hasCompletedToday ? "See recent progress" : "View schedule"}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid>

        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid sx={{ xs: 12, lg: 5 }}>
            <Card sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
              <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                Program snapshot
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Your track, level, schedule, and next milestone at a glance.
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current program
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {isAdvancedTrack ? "Advanced Track" : "Beginner Track"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current level
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {currentLevel?.name ?? "Set your active level"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Level {Math.max(currentLevelIndex + 1, 0)} of {levelsForTrack.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Progress at this level
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {Math.min(currentLevelQualifyingSessions, QUALIFYING_SESSIONS_REQUIRED)} of {QUALIFYING_SESSIONS_REQUIRED} sessions completed
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Next milestone
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {nextLevel?.name ?? "Current top level"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {nextLevel ? `${nextLevel.sixCounts || nextLevel.seals} reps in 20 minutes` : "You have reached the current top of this track."}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled workout days
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedWorkoutDays.map((weekday) => getWorkoutLabelForWeekday(weekday)).join(" · ")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Weighted training
                  </Typography>
                  <Chip
                    label={weightedTrainingEnabled ? "Enabled" : "Disabled"}
                    size="small"
                    color={weightedTrainingEnabled ? "warning" : "default"}
                    variant={weightedTrainingEnabled ? "filled" : "outlined"}
                    sx={{ mt: 0.75, fontWeight: 700 }}
                  />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid sx={{ xs: 12, lg: 7 }}>
            <Card sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <CalendarMonthIcon color="secondary" /> Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Do the program on:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                Tap days to customize your weekly schedule. Keep at least one
                workout day selected.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Next scheduled workout: {nextScheduledLabel}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
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
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block", lineHeight: 1.4 }}>
                  Strength card appears on Mon, Wed &amp; Fri after your burpees.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
          <Box>
            <Typography variant="subtitle2" color="secondary.main" gutterBottom>
              Progress Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current streak, this month, training time, weekly completion, and personal best.
            </Typography>
          </Box>
          <Box sx={{ mt: 2.5 }}>
            {showNewUserOnboarding ? (
              <Stack spacing={1.25}>
                <Typography variant="body1" fontWeight={700}>
                  Your program is ready. Complete your first 20-minute workout to start tracking your streak, personal best, and weekly progress.
                </Typography>
                {[
                  `Schedule selected: ${selectedWorkoutDays.length} workout days`,
                  `${isAdvancedTrack ? "Advanced" : "Beginner"} track selected`,
                  "Complete first workout",
                ].map((item, index) => (
                  <Box
                    key={item}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                      {index < 2 ? <CheckCircleRoundedIcon color="secondary" fontSize="small" /> : <FlagRoundedIcon color="primary" fontSize="small" />}
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Grid container spacing={2}>
                {visibleSummaryStats.map((stat) => (
                  <Grid sx={{ xs: 12, sm: 6, xl: 2 }} key={stat.label}>
                    <Card sx={{ p: 2.25, height: "100%" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {stat.label}
                          </Typography>
                          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75, mb: 0.75 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stat.sublabel}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            color: stat.accent,
                            bgcolor: `${stat.accent}1A`,
                            flexShrink: 0,
                          }}
                        >
                          {stat.icon}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>

        <Card sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Recent workouts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your latest completed sessions, with the newest first.
              </Typography>
            </Box>
            <Button variant="outlined" color="secondary" onClick={openDetailedProgress}>
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
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "160px minmax(0, 1fr) auto" },
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    {format(parseISO(log.date), "MMM d, yyyy")}
                  </Typography>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {formatWorkoutLogLabel(log.levelCompleted) ?? getWorkoutLabelForWeekday(parseISO(log.date).getDay() + 1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.repsCompleted ? `${log.repsCompleted} reps` : "Completed"} · 20 min
                    </Typography>
                  </Box>
                  <Chip label="Completed" size="small" color="secondary" variant="outlined" />
                </Box>
              ))}
            </Stack>
          )}
        </Card>

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

        <Grid container spacing={3} mb={4} id="workout" ref={(node) => { sectionRefs.current.workout = node; }}>
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
          <Grid sx={{ xs: 12, lg: 5 }}>
            <Card
              sx={{ p: 3, height: "100%" }}
              id="progress"
              ref={(node) => {
                sectionRefs.current.progress = node;
              }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Current level progression
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Level number, session progress at this level, and the clearest next step.
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
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography variant="caption" color="text.secondary">
                    Program level
                  </Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                    Level {Math.max(currentLevelIndex + 1, 0)} of {levelsForTrack.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Progress at this level
                  </Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, mb: 0.75 }}>
                    {Math.min(currentLevelQualifyingSessions, QUALIFYING_SESSIONS_REQUIRED)} of {QUALIFYING_SESSIONS_REQUIRED} sessions completed
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.round((Math.min(currentLevelQualifyingSessions, QUALIFYING_SESSIONS_REQUIRED) / QUALIFYING_SESSIONS_REQUIRED) * 100)}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": { bgcolor: "secondary.main" },
                    }}
                  />
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography variant="caption" color="text.secondary">
                    Next milestone
                  </Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                    {nextLevel?.name ?? "Current top level"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {nextLevel?.description ?? "You've reached the current top of this training track."}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.16)" }}>
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
                  <Button size="small" variant="outlined" onClick={() => setOpenLevelChange(true)}>
                    Update Level
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setOpenTrackSwitch(true)}>
                    Switch Program
                  </Button>
                </Box>
              </Stack>
            </Card>
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
        <Box
          id={!todayWeightedDay ? "strength" : undefined}
          ref={(node: HTMLDivElement | null) => {
            if (!todayWeightedDay) {
              sectionRefs.current.strength = node;
            }
          }}
        >
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
                  Friday Strength Work
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {pullingWorkUnlocked
                    ? "Great job finishing your Hybrid workout! Now balance your body with pulling and finish strong with legs and core."
                    : "Complete your Hybrid workout above to unlock Friday Strength Work."}
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
                  {pullingWorkExpanded ? "Hide" : "View Strength Work"}
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

                <Typography variant="subtitle1" fontWeight={700} color="secondary" gutterBottom>
                  Pulling + Biceps
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
                  sx={{
                    p: 2.5,
                    border: "1px solid #2a2a2a",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Stack divider={<Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />}>
                    {WEIGHTED_TRAINING_PLAN[5].exercises.map((ex) => (
                      <Box key={ex.name} display="flex" alignItems="flex-start" gap={1.5} sx={{ py: 1.25 }}>
                        <Typography
                          variant="caption"
                          fontWeight={900}
                          color="secondary.main"
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
                </Card>
              </Box>
            )}
          </Card>
        )}
        </Box>

        {/* Monthly Tracker Row */}
        <Card sx={{ p: 3, mb: 4 }} id="calendar" ref={(node) => { sectionRefs.current.calendar = node; }}>
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
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip label="Completed" size="small" sx={{ border: "1px solid #00E5FF", bgcolor: "rgba(0,229,255,0.1)" }} />
            <Chip label="Scheduled" size="small" variant="outlined" />
            <Chip label="Missed" size="small" sx={{ border: "1px solid rgba(255,51,102,0.4)", bgcolor: "rgba(255,51,102,0.08)" }} />
            <Chip label="Rest" size="small" variant="outlined" sx={{ opacity: 0.75 }} />
            <Chip label="Today" size="small" color="primary" variant="outlined" />
          </Stack>

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
                  aria-label={`${format(dayObj, "EEEE, MMMM d")} — ${statusLabel}${isToday ? " — today" : ""}`}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: 80,
                    p: 0.5,
                    borderRadius: 2,
                    border: isCompleted
                      ? "1px solid #00E5FF"
                      : isMissed
                        ? "1px solid rgba(255,51,102,0.4)"
                        : isWorkoutDay
                        ? "1px solid #333"
                        : "1px dashed #222",
                    background: isCompleted
                      ? "rgba(0, 229, 255, 0.1)"
                      : isMissed
                        ? "rgba(255,51,102,0.08)"
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
                      {isMissed && (
                        <Typography
                          variant="caption"
                          sx={{ color: "#ff8aa8", fontSize: "0.6rem", lineHeight: 1 }}
                          align="center"
                        >
                          Missed
                        </Typography>
                      )}
                      {!hasStartedProgram && isWorkoutDay && !isCompleted && (
                        <Typography
                          variant="caption"
                          sx={{ color: "#777", fontSize: "0.6rem", lineHeight: 1 }}
                          align="center"
                        >
                          Not started
                        </Typography>
                      )}
                      {isToday && !isCompleted && (
                        <Typography
                          variant="caption"
                          sx={{ color: "#00E5FF", fontSize: "0.6rem", lineHeight: 1 }}
                          align="center"
                        >
                          Today
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

        {!isMobile && (
          <Grid container spacing={3} mb={4}>
            <Grid sx={{ xs: 12, md: 5 }}>
              <Card
                sx={{ p: 3, height: "100%" }}
                id="progress"
                ref={(node) => {
                  sectionRefs.current.progress = node;
                }}
              >
                <Typography variant="h6" fontWeight={800} gutterBottom>
                  Current level progression
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  See where you are in the program and what comes next.
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                      <Typography variant="body2" fontWeight={700}>
                        {currentLevel?.name ?? "No level selected"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentLevelIndex >= 0 ? `${currentLevelIndex + 1}/${levelsForTrack.length}` : "0/0"}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={levelProgressPercent}
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        bgcolor: "rgba(255,255,255,0.08)",
                        "& .MuiLinearProgress-bar": { bgcolor: "secondary.main" },
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="caption" color="text.secondary">
                      Next milestone
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                      {nextLevel?.name ?? "Elite / final tier reached"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {nextLevel?.description ?? "You've reached the current top of this training track."}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.16)" }}>
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
                        : "Complete a couple of weeks first and this comparison will show up here."}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* ── Weighted Training Card ──────────────────────────────────────────
            Opt-in, shown on Mon/Wed/Fri only when the toggle is enabled. */}
        {todayWeightedDay && (
          <Box
            id="strength"
            ref={(node: HTMLDivElement | null) => {
              sectionRefs.current.strength = node;
            }}
          >
            <WeightedTrainingCardWeb day={todayWeightedDay} />
          </Box>
        )}

        <Card
          ref={detailedProgressRef}
          sx={{ p: 3, mb: 3 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                More progress details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Photos, levels, and export stay here when you want the deeper view.
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

        <Collapse in={showDetailedProgress} timeout="auto" unmountOnExit>
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
                <Box
                  sx={{
                    minHeight: 320,
                    borderRadius: 2,
                    border: "1px dashed rgba(255,255,255,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 1,
                    px: 3,
                  }}
                >
                  <PhotoCamera color="secondary" />
                  <Typography variant="body1" fontWeight={700}>
                    Add your starting photo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This stays private to your account and helps you compare progress over time.
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
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    minHeight: 320,
                    borderRadius: 2,
                    border: "1px dashed rgba(255,255,255,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 1,
                    px: 3,
                  }}
                >
                  <Typography variant="body1" fontWeight={700}>
                    6-month milestone photo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This photo becomes available after your milestone check-in is completed.
                  </Typography>
                </Box>
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
                    {lvl.name}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {lvl.sixCounts || lvl.seals} reps
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {getPaceLabel(lvl.sixCounts || lvl.seals)}
                  </Typography>
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    {userData.currentLevelId === lvl.id ? (
                      <Chip label="Current level" size="small" color="primary" />
                    ) : nextLevel?.id === lvl.id ? (
                      <Chip label="Next milestone" size="small" color="secondary" variant="outlined" />
                    ) : null}
                    {isAdvancedTrack && lvl.seals > 0 ? (
                      <Chip label={`${lvl.seals} seals · ${lvl.sixCounts} 5-count`} size="small" variant="outlined" />
                    ) : (
                      <Chip label="No pushups" size="small" variant="outlined" />
                    )}
                  </Box>
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
        </Collapse>

        <Card component="footer" sx={{ p: 2.5, mt: 4 }}>
          <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              BurpeePacers · Web available · iOS pre-release · Android coming soon
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <Button size="small" color="inherit" onClick={() => router.push("/privacy")}>
                Privacy
              </Button>
              <Button size="small" color="inherit" onClick={() => scrollToSection("dashboard")}>
                Support
              </Button>
              <Typography variant="caption" color="text.disabled">
                © {new Date().getFullYear()}
              </Typography>
            </Box>
          </Box>
        </Card>

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

        <Box
          component="footer"
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>
              BurpeePacers
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Structured 20-minute training for consistency, recovery, and long-term progress.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button color="inherit" size="small" onClick={() => scrollToSection("dashboard")}>
              Dashboard
            </Button>
            <Button color="inherit" size="small" onClick={() => scrollToSection("calendar")}>
              Calendar
            </Button>
            <Button color="inherit" size="small" onClick={() => router.push("/privacy")}>
              Privacy
            </Button>
            <Button color="inherit" size="small" onClick={() => router.push("/terms")}>
              Terms
            </Button>
          </Stack>
        </Box>
      </motion.div>
      </Container>
      {isMobile && (
        <BottomNavigation
          showLabels
          value={activeSection}
          onChange={(_, value: DashboardSectionId) => scrollToSection(value)}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(10,10,10,0.96)",
            backdropFilter: "blur(14px)",
          }}
        >
          {DASHBOARD_SECTIONS.map((section) => (
            <BottomNavigationAction
              key={section.id}
              value={section.id}
              label={section.label}
              icon={section.icon}
            />
          ))}
        </BottomNavigation>
      )}
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
