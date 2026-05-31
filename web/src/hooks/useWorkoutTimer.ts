import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HybridPhaseConfig,
  WorkoutMode,
  WorkoutTimerConfig,
  WorkoutTimerModeConfig,
} from "../lib/workoutTimer";
import {
  playCountdownTick,
  playFinishWhistle,
  playPrepareWarningBeep,
  playRepWarningBeep,
  playWhistle,
} from "../lib/sounds";

const PREPARE_SECONDS = 10;
const REP_EPSILON = 1e-9;
const HYBRID_PHASE_DURATION = 10 * 60;

type TimerPhase = "idle" | "prepare" | "workout" | "done";

interface UseWorkoutTimerOptions {
  config: WorkoutTimerConfig;
  onFinish?: (repsCompleted: number, mode: WorkoutMode) => void;
  onRepBoundary?: (rep: number, mode: WorkoutMode) => void;
}

export function useWorkoutTimer({
  config,
  onFinish,
  onRepBoundary,
}: UseWorkoutTimerOptions) {
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>(
    config.defaultMode,
  );
  const [secondsLeft, setSecondsLeft] = useState(config.initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [prepareSecondsLeft, setPrepareSecondsLeft] = useState(PREPARE_SECONDS);

  const onFinishRef = useRef(onFinish);
  const onRepBoundaryRef = useRef(onRepBoundary);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onRepBoundaryRef.current = onRepBoundary;
  }, [onFinish, onRepBoundary]);

  const totalSeconds = config.initialMinutes * 60;
  const mode = config.modes.some((entry) => entry.mode === selectedMode)
    ? selectedMode
    : config.defaultMode;

  const activeMode: WorkoutTimerModeConfig = useMemo(() => {
    return config.modes.find((entry) => entry.mode === mode) ?? config.modes[0];
  }, [config.modes, mode]);

  const intervalSeconds =
    activeMode.goal > 0 ? totalSeconds / activeMode.goal : 0;
  const secondsDone = totalSeconds - secondsLeft;
  const repsCompleted =
    intervalSeconds > 0
      ? Math.min(
          activeMode.goal,
          Math.floor(secondsDone / intervalSeconds + REP_EPSILON),
        )
      : 0;
  const secondsToNextRep =
    intervalSeconds > 0 && repsCompleted < activeMode.goal
      ? Math.max(
          0,
          Math.ceil((repsCompleted + 1) * intervalSeconds - secondsDone),
        )
      : null;

  // ── Hybrid state (only when activeMode.mode === "H") ───────────────────────
  // Derived entirely from secondsLeft — no extra state needed.
  // Phase 0 (Navy Seals):     secondsLeft > HYBRID_PHASE_DURATION  (first 10 min)
  // Phase 1 (5-Count Pushups): secondsLeft <= HYBRID_PHASE_DURATION (last 10 min)
  const hybridState: {
    phaseIndex: number;
    phase: HybridPhaseConfig;
    phaseSecondsLeft: number;
    phaseSecondsToNextRep: number | null;
    totalPhases: number;
  } | null = useMemo(() => {
    if (activeMode.mode !== "H" || !activeMode.hybridPhases) return null;

    const phases = activeMode.hybridPhases;
    const elapsed = totalSeconds - secondsLeft;
    const phaseIndex = elapsed < HYBRID_PHASE_DURATION ? 0 : 1;
    const phase = phases[phaseIndex];

    // Seconds elapsed within this specific phase
    const phaseStart = phaseIndex * HYBRID_PHASE_DURATION;
    const secondsIntoPhase = elapsed - phaseStart;
    const phaseSecondsLeft = HYBRID_PHASE_DURATION - secondsIntoPhase;

    // Rep pace within the phase
    const phaseIntervalSec = phase.goal > 0 ? HYBRID_PHASE_DURATION / phase.goal : 0;
    const phaseSecondsToNextRep =
      phaseIntervalSec > 0 && currentRep < phase.goal
        ? Math.max(
            0,
            Math.ceil((currentRep + 1) * phaseIntervalSec - secondsIntoPhase),
          )
        : null;

    return { phaseIndex, phase, phaseSecondsLeft, phaseSecondsToNextRep, totalPhases: 2 };
  }, [activeMode.mode, activeMode.hybridPhases, secondsLeft, totalSeconds, currentRep]);

  // ── Prepare countdown ──────────────────────────────────────────────
  // ── Prepare: tick the countdown down ──────────────────────────────
  useEffect(() => {
    if (phase !== "prepare" || prepareSecondsLeft <= 0) return;

    const timerId = setInterval(() => {
      setPrepareSecondsLeft((prev) => {
        const next = prev - 1;
        if (next > 0) {
          if (next <= 3) {
            playPrepareWarningBeep();
          } else {
            playCountdownTick();
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, prepareSecondsLeft]);

  // ── Prepare: transition to workout once countdown hits 0 ───────────
  useEffect(() => {
    if (phase === "prepare" && prepareSecondsLeft <= 0) {
      playWhistle();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("workout");
      setIsActive(true);
    }
  }, [phase, prepareSecondsLeft]);

  // ── Workout countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || secondsLeft <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((previousValue) => {
        const nextValue = previousValue - 1;
        const clampedNextValue = nextValue < 0 ? 0 : nextValue;
        const previousSecondsDone = totalSeconds - previousValue;
        const currentSecondsDone = totalSeconds - clampedNextValue;

        // ── Hybrid mode: phase-aware rep counting ─────────────────────────
        // Hybrid total = 20 min; Phase 0 (Navy Seals) = first 10 min,
        //                         Phase 1 (5-Count)    = next  10 min.
        if (activeMode.mode === "H" && activeMode.hybridPhases) {
          const phases = activeMode.hybridPhases;
          const PHASE_DUR = HYBRID_PHASE_DURATION; // 600 s

          const prevPhaseIdx = previousSecondsDone < PHASE_DUR ? 0 : 1;
          const currPhaseIdx = currentSecondsDone < PHASE_DUR ? 0 : 1;

          // ── Phase transition: crossed the 10-minute mark ─────────────────
          if (currPhaseIdx > prevPhaseIdx) {
            // Reset rep counter for Phase 2 and signal the transition
            setCurrentRep(0);
            playWhistle();
            // Workout is NOT done yet — fall through to return clampedNextValue
            return clampedNextValue;
          }

          // ── Rep counting within the current phase ────────────────────────
          const phase = phases[currPhaseIdx];
          const phaseStart = currPhaseIdx * PHASE_DUR;
          const prevIntoPhase = previousSecondsDone - phaseStart;
          const currIntoPhase = currentSecondsDone - phaseStart;

          if (phase.goal > 0) {
            const phaseIntervalSec = PHASE_DUR / phase.goal;

            const previousRep = Math.min(
              phase.goal,
              Math.floor(prevIntoPhase / phaseIntervalSec + REP_EPSILON),
            );
            const rep = Math.min(
              phase.goal,
              Math.floor(currIntoPhase / phaseIntervalSec + REP_EPSILON),
            );

            // Warning beeps 4–1 seconds before next rep boundary
            const secondsUntilBoundary =
              rep < phase.goal
                ? Math.max(
                    0,
                    Math.ceil((rep + 1) * phaseIntervalSec - currIntoPhase),
                  )
                : null;

            if (
              secondsUntilBoundary !== null &&
              secondsUntilBoundary >= 1 &&
              secondsUntilBoundary <= 4
            ) {
              playRepWarningBeep();
            }

            if (rep > previousRep) {
              setCurrentRep(rep);
              playWhistle();
              onRepBoundaryRef.current?.(rep, phase.mode);
            }
          }

          // ── Full workout complete ────────────────────────────────────────
          if (clampedNextValue === 0) {
            setIsActive(false);
            setPhase("done");
            playFinishWhistle();
            // Report phase-2 goal as the final rep count for the session
            onFinishRef.current?.(phases[1].goal, "H");
          }

          return clampedNextValue;
        }

        // ── Standard single-phase mode (Navy Seals or 5-Count) ───────────
        const previousTimeElapsed = previousSecondsDone;
        const timeElapsed = currentSecondsDone;

        if (intervalSeconds > 0) {
          const previousRep = Math.min(
            activeMode.goal,
            Math.floor(previousTimeElapsed / intervalSeconds + REP_EPSILON),
          );
          const rep = Math.min(
            activeMode.goal,
            Math.floor(timeElapsed / intervalSeconds + REP_EPSILON),
          );

          // Compute seconds until next rep boundary
          const nextSecondsDone = totalSeconds - clampedNextValue;
          const nextRepsCompleted = Math.min(
            activeMode.goal,
            Math.floor(nextSecondsDone / intervalSeconds + REP_EPSILON),
          );
          const secondsUntilBoundary =
            nextRepsCompleted < activeMode.goal
              ? Math.max(
                  0,
                  Math.ceil(
                    (nextRepsCompleted + 1) * intervalSeconds - nextSecondsDone,
                  ),
                )
              : null;

          // Warning beeps 4–1 seconds before rep boundary
          if (
            secondsUntilBoundary !== null &&
            secondsUntilBoundary >= 1 &&
            secondsUntilBoundary <= 4
          ) {
            playRepWarningBeep();
          }

          if (rep > previousRep) {
            setCurrentRep(rep);
            playWhistle();
            onRepBoundaryRef.current?.(rep, activeMode.mode);
          }
        }

        if (clampedNextValue === 0) {
          setIsActive(false);
          setPhase("done");
          playFinishWhistle();
          const finalRep = intervalSeconds > 0 ? activeMode.goal : 0;
          onFinishRef.current?.(finalRep, activeMode.mode);
        }

        return clampedNextValue;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeMode.goal, activeMode.mode, activeMode.hybridPhases, intervalSeconds, isActive, secondsLeft, totalSeconds]);

  const resetTimer = () => {
    setIsActive(false);
    setPhase("idle");
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
    setPrepareSecondsLeft(PREPARE_SECONDS);
  };

  const toggleTimer = useCallback(() => {
    if (phase === "idle" || phase === "done") {
      // Fresh start → kick off prepare countdown
      setSecondsLeft(totalSeconds);
      setCurrentRep(0);
      setPrepareSecondsLeft(PREPARE_SECONDS);
      playCountdownTick();
      setPhase("prepare");
      return;
    }

    if (phase === "prepare") {
      // Cancel prepare → go back to idle
      setPhase("idle");
      setPrepareSecondsLeft(PREPARE_SECONDS);
      return;
    }

    // phase === "workout" → pause / resume
    setIsActive((currentValue) => !currentValue);
  }, [phase, totalSeconds]);

  const selectMode = (nextMode: WorkoutMode) => {
    if (nextMode === activeMode.mode) {
      return;
    }

    setSelectedMode(nextMode);
    setIsActive(false);
    setPhase("idle");
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
    setPrepareSecondsLeft(PREPARE_SECONDS);
  };

  return {
    mode: activeMode.mode,
    activeMode,
    modes: config.modes,
    totalSeconds,
    secondsLeft,
    isActive,
    currentRep,
    secondsToNextRep,
    phase,
    prepareSecondsLeft,
    /** Non-null only when activeMode.mode === "H". Contains phase-specific display values. */
    hybridState,
    toggleTimer,
    resetTimer,
    selectMode,
  };
}
