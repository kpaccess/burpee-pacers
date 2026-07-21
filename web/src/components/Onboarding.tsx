"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  TextField,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Chip,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import StarIcon from "@mui/icons-material/Star";
import { motion } from "framer-motion";
import Image from "next/image";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ADVANCED_LEVELS, BEGINNER_LEVELS, WorkoutTier } from "../types";
import { useAuth } from "../context/AuthContext";

interface OnboardingProps {
  onComplete: (data: {
    startWeight: number;
    startPictureUrl: string | null;
    currentLevelId: string;
    workoutTier: WorkoutTier;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, logout } = useAuth();
  const [weight, setWeight] = useState("");
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState("B1");
  const [workoutTier, setWorkoutTier] = useState<WorkoutTier | null>(null);
  const isBeginnerTrack = workoutTier === "beginner";
  const levelsForTier = useMemo(
    () => (isBeginnerTrack ? BEGINNER_LEVELS : ADVANCED_LEVELS),
    [isBeginnerTrack],
  );

  const accountLabel =
    user?.email || (user ? `UID: ${user.uid}` : "Unknown account");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setPictureFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPictureUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTierSelect = (tier: WorkoutTier) => {
    setWorkoutTier(tier);
    setLevel(tier === "beginner" ? "B1" : "F");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedWeight = weight.trim();
    const parsedWeight = parseFloat(trimmedWeight);
    if (!trimmedWeight || isNaN(parsedWeight) || parsedWeight <= 0 || !workoutTier || !user) return;

    setPhotoError(null);
    setIsSubmitting(true);

    let startPictureUrl: string | null = null;
    if (pictureFile) {
      try {
        const storage = getStorage();
        const extensionByType: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const ext = extensionByType[pictureFile.type];
        const path = `users/${user.uid}/photos/day1_${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, pictureFile);
        startPictureUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("Failed to upload photo:", err);
        setPhotoError("Failed to upload photo. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    onComplete({
      startWeight: parsedWeight,
      startPictureUrl,
      currentLevelId: level,
      workoutTier,
    });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 520, width: "100%" }}>
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          color="primary"
          fontWeight={800}
        >
          BurpeePacers Program
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          It&apos;s time to begin your journey. First, choose your program.
        </Typography>

        {/* Track selection */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Choose your track
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          {(
            [
              {
                tier: "beginner" as WorkoutTier,
                icon: <FitnessCenterIcon fontSize="large" />,
                label: "Beginner",
                badge: "Free",
                badgeColor: "success" as const,
                bullets: [
                  "Structured 6-level progression",
                  "No-pushup variant included",
                  "Free during launch",
                ],
              },
              {
                tier: "advanced" as WorkoutTier,
                icon: <StarIcon fontSize="large" />,
                label: "Advanced",
                badge: "Launch",
                badgeColor: "primary" as const,
                bullets: [
                  "Premium multi-phase workouts",
                  "Elite track included",
                  "Free during launch",
                ],
              },
            ] as const
          ).map(({ tier, icon, label, badge, badgeColor, bullets }) => {
            const selected = workoutTier === tier;
            return (
              <Box
                key={tier}
                onClick={() => handleTierSelect(tier)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  border: selected ? "2px solid" : "2px solid transparent",
                  borderColor: selected
                    ? tier === "beginner"
                      ? "success.main"
                      : "primary.main"
                    : "rgba(255,255,255,0.15)",
                  borderRadius: 2,
                  p: 2.5,
                  cursor: "pointer",
                  bgcolor: selected
                    ? tier === "beginner"
                      ? "rgba(102,187,106,0.08)"
                      : "rgba(144,202,249,0.08)"
                    : "rgba(255,255,255,0.03)",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor:
                      tier === "beginner" ? "success.main" : "primary.main",
                    bgcolor:
                      tier === "beginner"
                        ? "rgba(102,187,106,0.05)"
                        : "rgba(144,202,249,0.05)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1, minWidth: 0 }}
                >
                  <Box
                    sx={{
                      color:
                        tier === "beginner" ? "success.main" : "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Typography>
                  <Chip
                    label={badge}
                    color={badgeColor}
                    size="small"
                    sx={{ flexShrink: 0 }}
                  />
                </Stack>
                <Stack spacing={0.5}>
                  {bullets.map((b) => (
                    <Typography
                      key={b}
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
                    >
                      <span>•</span> {b}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <Alert severity={user ? "info" : "warning"} sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            component="span"
            display="block"
            gutterBottom
          >
            {user ? (
              <>
                Signed in as <strong>{accountLabel}</strong>. Your profile loads
                from this account. If you already set up on another device, sign
                in with the same account here.
              </>
            ) : (
              <>
                Session looks out of sync. Use the button below to reset auth
                and sign in again.
              </>
            )}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
          >
            Sign out and use a different account
          </Button>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Weight (lbs/kg)"
              type="number"
              fullWidth
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            {workoutTier && (
              <FormControl fullWidth required>
                <InputLabel id="level-label">Starting Level</InputLabel>
                <Select
                  labelId="level-label"
                  value={level}
                  label="Starting Level"
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {levelsForTier.map((lvl) => (
                    <MenuItem key={lvl.id} value={lvl.id}>
                      {lvl.name} - {lvl.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box
              sx={{
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="icon-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="icon-button-file">
                <Box sx={{ mb: 2 }}>
                  {pictureUrl ? (
                    <Image
                      src={pictureUrl}
                      alt="Preview"
                      width={320}
                      height={200}
                      unoptimized
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: 200,
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Upload a picture of yourself
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                >
                  {pictureUrl ? "Change Picture" : "Take Picture"}
                </Button>
              </label>
            </Box>

            {photoError && <Alert severity="error">{photoError}</Alert>}

            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>Please read before you begin:</strong> I am not a coach
              or medical professional. Please consult your doctor before
              starting any exercise program. Always start from the very
              beginning, progress gradually day by day, and only do the burpees
              you are capable of — strive for a little more each day. It is
              perfectly fine to stay at one level and get fit there; advancing
              levels is never required.
            </Alert>

            <Button
              type="submit"
              variant="contained"
              color={workoutTier === "advanced" ? "primary" : "success"}
              size="large"
              disabled={!workoutTier || isSubmitting}
              sx={{ mt: 2, py: 1.5, fontSize: "1.1rem" }}
            >
              {isSubmitting
                ? "Setting up your program…"
                : !workoutTier
                  ? "Select a program above"
                  : workoutTier === "beginner"
                    ? "Start Beginner Program"
                    : "Start Advanced Program"}
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
