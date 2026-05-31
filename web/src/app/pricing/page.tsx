"use client";

import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const ADVANCED_FEATURES = [
  "Advanced workout timer with intervals",
  "Navy Seals, 5-count pushups, and Hybrid sessions",
  "Full calendar history",
  "Export workout data (CSV)",
  "Customizable workout schedule",
];

const BEGINNER_FEATURES = [
  "Beginner workout track",
  "No-pushup burpee progression",
  "Core progress tracking",
  "Customizable workout schedule",
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
          sx={{ color: "grey.400", mb: 4, "&:hover": { color: "white" } }}
        >
          Back to App
        </Button>

        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Launch Access
          </Typography>
          <Typography variant="h6" color="grey.300" sx={{ maxWidth: 680, mx: "auto" }}>
            BurpeePacers is free for everyone during launch. Use either track,
            customize your schedule, and help shape the app before paid plans
            are introduced later.
          </Typography>
        </Box>

        <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
          No checkout is required right now. Advanced features are open during
          launch so early users can train, test, and give feedback.
        </Alert>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Card
            sx={{
              borderRadius: 3,
              background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.35)",
              backdropFilter: "blur(10px)",
              width: "100%",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Chip
                label="BEGINNER"
                size="small"
                sx={{
                  mb: 2,
                  background: "rgba(0,229,255,0.18)",
                  color: "white",
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" fontWeight={800} color="white" mb={0.5}>
                Free
              </Typography>
              <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
                Included during launch
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {BEGINNER_FEATURES.map((feature) => (
                  <ListItem key={feature} disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon sx={{ color: "#00E5FF", fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ color: "white", fontSize: 15 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.15) 100%)",
              border: "2px solid rgba(245,158,11,0.5)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "visible",
              width: "100%",
            }}
          >
            <Chip
              label="ADVANCED"
              size="small"
              icon={<WorkspacePremiumIcon sx={{ fontSize: "14px !important" }} />}
              sx={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "white",
                fontWeight: 700,
                fontSize: 11,
                px: 1,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h3" fontWeight={800} color="white" mb={0.5}>
                Free
              </Typography>
              <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
                Full launch access
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {ADVANCED_FEATURES.map((feature) => (
                  <ListItem key={feature} disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ color: "white", fontSize: 15 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<WorkspacePremiumIcon />}
            onClick={() => router.push(user ? "/" : "/login")}
            sx={{
              py: 1.5,
              px: 4,
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 2,
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              "&:hover": {
                background: "linear-gradient(135deg, #d97706, #dc2626)",
              },
            }}
          >
            {user ? "Open App" : "Start Free"}
          </Button>
        </Box>

        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 2,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography variant="body2" color="grey.500" textAlign="center">
            Paid plans may be introduced later for advanced coaching, premium
            content, or support features. Launch users can use the app free
            while pricing is paused.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
