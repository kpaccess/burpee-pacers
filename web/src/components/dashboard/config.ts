import type { WorkoutMode } from "@/lib/workoutTimer";

export const PULLING_WORK_CONFIG = [
  {
    id: "home",
    title: "Option A: At Home",
    subtitle: "Best for users with dumbbells, kettlebells, or resistance bands.",
    exercises: [
      {
        name: "Dumbbell Rows",
        sets: "3 sets",
        reps: "10-15 reps",
        benefit: "Builds upper back strength",
        formCues: [
          "Rest one knee and hand on a bench for support",
          "Keep your back flat - pull elbow straight to hip",
          "Squeeze your shoulder blade at the top, lower slowly",
        ],
      },
      {
        name: "Kettlebell Rows",
        sets: "3 sets",
        reps: "10-15 reps",
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
        reps: "15-20 reps",
        benefit: "Protects shoulders",
        formCues: [
          "Hold the band at shoulder height, arms straight",
          "Pull band apart until it touches your chest",
          "Keep arms straight throughout - control the return",
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
        reps: "10-15 reps",
        benefit: "Builds upper back strength",
        formCues: [
          "Sit tall, lean back slightly (15-20 degrees)",
          "Pull bar to your upper chest, drive elbows down",
          "Full stretch at the top, squeeze your lats at the bottom",
        ],
      },
      {
        name: "Seated Row",
        sets: "3 sets",
        reps: "10-15 reps",
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
        reps: "15-20 reps",
        benefit: "Reduces injury risk",
        formCues: [
          "Set cable at face height or slightly above",
          "Pull rope to your face, hands splitting apart",
          "Rotate wrists outward at the end - hold 1 second",
        ],
      },
    ],
  },
] as const;

export const HEALTH_RECOVERY_CONFIG = {
  warmup: {
    title: "Warm-up",
    duration: "5-8 minutes",
    exercises: [
      { name: "Arm Circles", duration: "30 sec each direction", cue: "Start small, gradually widen the circles" },
      { name: "Shoulder Rolls", duration: "10 reps forward, 10 backward", cue: "Roll shoulders fully - up, back, down, forward" },
      { name: "Hip Circles", duration: "10 reps each direction", cue: "Hands on hips, draw wide circles with your pelvis" },
      { name: "Bodyweight Squats", duration: "10 reps", cue: "Slow and controlled - feel your hips and knees open up" },
      { name: "Step-Back Walkouts", duration: "8 reps", cue: "Step back, walk hands out to plank, walk back, stand up" },
      { name: "Light Jogging / Marching in Place", duration: "1-2 minutes", cue: "Raise your knees, swing your arms - get your heart rate up" },
    ],
  },
  cooldown: {
    title: "Cool-down",
    duration: "5-10 minutes",
    exercises: [
      { name: "Slow Walking", duration: "2-3 minutes", cue: "Keep moving - do not sit down immediately after a workout" },
      { name: "Chest Stretch", duration: "30 sec each side", cue: "Clasp hands behind back, open chest, look slightly up" },
      { name: "Shoulder Stretch", duration: "30 sec each side", cue: "Pull arm across chest, keep shoulder relaxed and down" },
      { name: "Child's Pose", duration: "60 seconds", cue: "Arms extended forward, breathe deeply into your lower back" },
      { name: "Hip Flexor Stretch", duration: "30 sec each side", cue: "Kneel on one knee, push hips forward - feel the front of your hip" },
      { name: "Deep Breathing", duration: "5 slow breaths", cue: "In for 4 counts, hold 2, out for 6 - activate your rest response" },
    ],
  },
  epsom: "A warm Epsom salt bath (1-2 cups in warm water, 15-20 min) may help reduce muscle soreness for some people after a tough session. This is optional - listen to your body.",
  disclaimer: "If you are over 40, have a pre-existing medical condition, or have been sedentary for more than 6 months, consult your doctor before starting this program. Stop immediately and seek medical attention if you experience sharp pain, chest tightness, dizziness, or shortness of breath. This program is not a substitute for professional medical advice.",
} as const;

export type WeightedTrainingDay = {
  title: string;
  focus: string;
  exercises: { name: string; sets: number; reps: string; note?: string }[];
};

export const WEIGHTED_TRAINING_PLAN: Record<number, WeightedTrainingDay> = {
  1: {
    title: "Day 1 - Pulling + Biceps",
    focus: "Biceps - Back - Forearms",
    exercises: [
      { name: "Chin-ups (supinated grip)", sets: 4, reps: "Max", note: "Best bicep builder - aim 6-10" },
      { name: "Barbell or Dumbbell Row", sets: 3, reps: "8-10", note: "2-sec hold at top" },
      { name: "Barbell Curl", sets: 3, reps: "10-12", note: "Strict form, no swing" },
      { name: "Hammer Curl", sets: 2, reps: "12", note: "Forearm + brachialis" },
    ],
  },
  3: {
    title: "Day 2 - Pushing + Shoulders",
    focus: "Shoulders - Chest - Triceps",
    exercises: [
      { name: "Face Pulls", sets: 3, reps: "15-20", note: "Cable or band at face height - protects rotator cuff" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", note: "Upper chest focus" },
      { name: "Lateral Raise", sets: 3, reps: "12-15", note: "Light weight, controlled" },
      { name: "Tricep Dips or Pushdowns", sets: 3, reps: "10-12" },
    ],
  },
  5: {
    title: "Day 3 - Legs + Core",
    focus: "Legs - Glutes - Core",
    exercises: [
      { name: "Goblet Squat", sets: 4, reps: "10-12", note: "Or barbell squat" },
      { name: "Romanian Deadlift", sets: 3, reps: "10", note: "Hinge at hips, hamstring focus" },
      { name: "Walking Lunges", sets: 3, reps: "12/leg" },
      { name: "Plank", sets: 3, reps: "30-45s" },
    ],
  },
};

export const DEFAULT_WORKOUT_DAYS = [2, 4, 6] as const;

export const WORKOUT_DAY_OPTIONS = [
  { weekday: 2, short: "Mon" },
  { weekday: 4, short: "Wed" },
  { weekday: 6, short: "Fri" },
] as const;

export const DASHBOARD_SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workout", label: "Workout" },
  { id: "calendar", label: "Calendar" },
  { id: "progress", label: "Progress" },
  { id: "strength", label: "Strength" },
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

export const WORKOUT_MODES: WorkoutMode[] = ["N", "C", "H"];
