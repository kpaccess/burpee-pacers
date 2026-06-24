"use client";

import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Button,
  Card,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import BurpeeLogoIcon from "@/components/BurpeeLogoIcon";

const NAV_ITEMS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Programs", href: "#programs" },
  { label: "Why It Exists", href: "#founder-story" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const PREVIEW_CARDS = [
  {
    src: "/images/preview-timer-2.png",
    alt: "Workout timer screen with pacing and countdown",
    step: "Step 1",
    title: "Train with a guided timer",
    caption: "Follow the pace instead of counting reps in your head.",
  },
  {
    src: "/images/preview-calendar.png",
    alt: "Calendar and progress tracking view",
    step: "Step 2",
    title: "Keep your training visible",
    caption: "Stay consistent with a simple workout log and history view.",
  },
  {
    src: "/images/preview-levels.png",
    alt: "Level progression screen",
    step: "Step 3",
    title: "Know when to progress",
    caption: "See your current level and progression path clearly on the web.",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "1. Choose your starting path",
    body: "Pick the beginner path for a simple entry point or the advanced path if you already want a harder conditioning challenge.",
  },
  {
    title: "2. Follow a guided 20-minute timer",
    body: "Train with clear pacing so you do not have to count reps in your head, guess the rhythm, or overthink the session.",
  },
  {
    title: "3. Log each workout and stay consistent",
    body: "Track completed sessions, keep your training history in one place, and build momentum without complicated planning.",
  },
  {
    title: "4. Level up only when ready",
    body: "Repeat a level until it feels solid, then progress at a pace your form and recovery can support.",
  },
];

const PROOF_ITEMS = [
  { title: "Web app live now", body: "Sign up, train, and track progress directly on the web." },
  { title: "20-minute guided sessions", body: "A simple timer keeps each workout focused and manageable." },
  { title: "Beginner and advanced paths", body: "Start where you are and progress without guesswork." },
  { title: "Progress tracking built in", body: "Your workout history stays visible and easy to follow." },
];

const FAQS = [
  {
    question: "Who is BurpeePacers for?",
    answer:
      "It is built for adults 40+ who want a simple conditioning routine they can do at home, and it is especially useful for busy people who want more structure without needing a gym.",
  },
  {
    question: "Do I need equipment?",
    answer:
      "No. The core workouts are designed for home training with very little space, and you can optionally add strength work if you have access to dumbbells or a gym.",
  },
  {
    question: "How often should I train?",
    answer:
      "Most people do best starting with three 20-minute sessions per week and repeating levels until recovery feels solid.",
  },
  {
    question: "Do I need the iPhone app to use it?",
    answer:
      "No. The web app is the primary experience and is designed to handle signup, pacing, logging, and progression on its own.",
  },
];

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box
      id={id}
      sx={{
        scrollMarginTop: { xs: 112, md: 100 },
        py: { xs: 4, md: 5 },
      }}
    >
      <Stack spacing={1.5} mb={3}>
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ letterSpacing: 1.6, color: "primary.main", fontWeight: 800 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1.1 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 760 }}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Box>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("how-it-works");

  useEffect(() => {
    const sendVisit = async () => {
      const token = user ? await user.getIdToken() : null;
      fetch("/api/analytics/visit", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    };
    sendVisit();
  }, [user]);

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.href.replace("#", ""));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visibleEntries.length) return;

        setActiveSection(visibleEntries[0].target.id);
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box
      id="top"
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,51,102,0.16), transparent 34%), radial-gradient(circle at 90% 0%, rgba(0,229,255,0.12), transparent 32%), linear-gradient(180deg, #09090b 0%, #12131a 100%)",
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Box
          sx={{
            position: "sticky",
            top: { xs: 8, md: 16 },
            zIndex: 20,
            mb: { xs: 3, md: 5 },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={{ xs: 1.25, md: 2 }}
            sx={{
              p: { xs: 1, md: 2 },
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10,10,14,0.82)",
              backdropFilter: "blur(14px)",
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              onClick={() => scrollToSection("top")}
              sx={{ cursor: "pointer" }}
            >
              <BurpeeLogoIcon size={44} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={900} sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                  BurpeePacers
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.9rem", md: "0.875rem" },
                    whiteSpace: { xs: "nowrap", md: "normal" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: "100%", md: "none" },
                  }}
                >
                  Structured 20-minute conditioning at home
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="nowrap"
              useFlexGap
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              sx={{
                width: "100%",
                overflowX: { xs: "auto", md: "visible" },
                pb: { xs: 0.25, md: 0 },
                pr: { xs: 0.25, md: 0 },
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.href}
                  href={item.href}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    event.preventDefault();
                    scrollToSection(item.href.replace("#", ""));
                  }}
                  sx={{
                    color:
                      activeSection === item.href.replace("#", "")
                        ? "common.white"
                        : "rgba(255,255,255,0.76)",
                    backgroundColor:
                      activeSection === item.href.replace("#", "")
                        ? "rgba(255,51,102,0.16)"
                        : "transparent",
                    border:
                      activeSection === item.href.replace("#", "")
                        ? "1px solid rgba(255,51,102,0.4)"
                        : "1px solid transparent",
                    px: 1.25,
                    py: { xs: 0.7, md: 1 },
                    flex: "0 0 auto",
                    borderRadius: 999,
                    minWidth: 0,
                    "&:hover": {
                      backgroundColor:
                        activeSection === item.href.replace("#", "")
                          ? "rgba(255,51,102,0.22)"
                          : "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.1fr) minmax(320px, 0.9fr)" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            <Card
              sx={{
                p: { xs: 3, md: 4.5 },
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(135deg, rgba(255,51,102,0.14) 0%, rgba(255,255,255,0.03) 60%)",
              }}
            >
              <Stack spacing={2.5}>
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 1.8, color: "secondary.main", fontWeight: 800 }}
                >
                  Simple home conditioning for consistency, not complexity.
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "2.5rem", md: "4rem" },
                    lineHeight: 0.98,
                    fontWeight: 900,
                    maxWidth: 720,
                  }}
                >
                  Simple 20-Minute Home Conditioning You Can Actually Stick With
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.78)",
                    maxWidth: 680,
                    lineHeight: 1.5,
                  }}
                >
                  BurpeePacers gives you a guided timer, a clear starting level,
                  and simple progress tracking so you can train consistently at
                  home without a gym. Built for adults 40+ who want structure
                  without overcomplication.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push("/login")}
                    sx={{ px: 3, py: 1.4 }}
                  >
                    Start Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => scrollToSection("how-it-works")}
                    sx={{ px: 3, py: 1.4 }}
                  >
                    See How It Works
                  </Button>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => router.push("/login")}
                    sx={{
                      color: "rgba(255,255,255,0.76)",
                      whiteSpace: "nowrap",
                      justifyContent: { xs: "center", sm: "flex-start" },
                    }}
                  >
                    Already a member? Sign in
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {PROOF_ITEMS.map((item) => (
                    <Card
                      key={item.title}
                      sx={{
                        p: 1.75,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={800} mb={0.5}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.body}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              </Stack>
            </Card>

            <Card
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 4,
                border: "1px solid rgba(0,229,255,0.18)",
                background:
                  "linear-gradient(180deg, rgba(6,12,18,0.98) 0%, rgba(7,10,16,0.92) 100%)",
                overflow: "hidden",
              }}
            >
              <Stack spacing={2.25}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                    flexDirection: { xs: "column", md: "row" },
                  }}
                >
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ color: "secondary.main", letterSpacing: 1.6, fontWeight: 800 }}
                    >
                      Web Experience
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
                      The complete training flow
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.62)", maxWidth: 320 }}
                  >
                    From first workout to long-term consistency, the core web
                    app keeps the experience simple and visible.
                  </Typography>
                </Box>
                {PREVIEW_CARDS.map((preview) => (
                  <Box
                    key={preview.src}
                    sx={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(0, 1.15fr) minmax(180px, 0.85fr)",
                      },
                      gap: 2,
                      alignItems: "stretch",
                      p: { xs: 1.25, md: 1.5 },
                      borderRadius: 3.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        minHeight: { xs: 210, md: 188 },
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid rgba(0,229,255,0.14)",
                        background:
                          "radial-gradient(circle at top, rgba(0,229,255,0.1), transparent 45%), rgba(255,255,255,0.025)",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          zIndex: 1,
                          px: 1.1,
                          py: 0.45,
                          borderRadius: 999,
                          background: "rgba(8,12,18,0.82)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <Typography variant="caption" fontWeight={800} sx={{ color: "secondary.main" }}>
                          {preview.step}
                        </Typography>
                      </Box>
                      <Box
                        component="img"
                        src={preview.src}
                        alt={preview.alt}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                          p: 1.5,
                        }}
                      />
                    </Box>
                    <Stack
                      spacing={1}
                      justifyContent="center"
                      sx={{ p: { xs: 0.5, md: 0.75 } }}
                    >
                      <Typography
                        variant="overline"
                        sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 1.4 }}
                      >
                        {preview.step}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                        {preview.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.6 }}
                      >
                        {preview.caption}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          width: 44,
                          height: 2,
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, rgba(255,51,102,0.95), rgba(0,229,255,0.9))",
                        }}
                      />
                    </Stack>
                  </Box>
                ))}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Built to make the next step obvious: start, follow the pace,
                    log the session, and keep moving.
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Box>
        </motion.div>

        <Section
          id="how-it-works"
          eyebrow="How It Works"
          title="How BurpeePacers Works"
          description="BurpeePacers gives you a clear starting point, a paced 20-minute session, and a simple way to build consistency over time."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {HOW_IT_WORKS_STEPS.map((step) => (
              <Card
                key={step.title}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <Typography variant="h6" fontWeight={800} mb={1}>
                  {step.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {step.body}
                </Typography>
              </Card>
            ))}
          </Box>
        </Section>

        <Section
          id="programs"
          eyebrow="Programs"
          title="Start Simple. Level Up When Ready."
          description="BurpeePacers is designed so beginners have a clear place to start, while stronger users still have an advanced path when they are ready for it."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 3,
            }}
          >
            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid rgba(0,229,255,0.35)",
                background:
                  "linear-gradient(160deg, rgba(0,229,255,0.09) 0%, rgba(255,255,255,0.03) 100%)",
              }}
            >
              <Typography variant="h5" fontWeight={900} mb={1}>
                Beginner Burpee Path
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                For building consistency, conditioning, and confidence.
              </Typography>
              <Typography variant="subtitle2" color="secondary.main" fontWeight={800} mb={0.75}>
                Levels
              </Typography>
              <Typography variant="body1" mb={2}>
                20 → 30 → 40 → 55 → 70 → 90 burpees in 20 minutes.
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Recommended: complete a level 3 times before moving up.
              </Typography>
            </Card>

            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid rgba(255,51,102,0.35)",
                background:
                  "linear-gradient(160deg, rgba(255,51,102,0.12) 0%, rgba(255,255,255,0.03) 100%)",
              }}
            >
              <Typography variant="h5" fontWeight={900} mb={1}>
                Advanced Navy SEAL Path
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                For stronger users who want a harder bodyweight conditioning challenge.
              </Typography>
              <Typography variant="subtitle2" color="primary.main" fontWeight={800} mb={0.75}>
                Levels
              </Typography>
              <Typography variant="body1" mb={2}>
                15 → 20 → 30 → 40 → 55 → 70 Navy SEAL burpees in 20 minutes.
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Move up only when your form and recovery are solid.
              </Typography>
            </Card>
          </Box>

          <Card
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography variant="h6" fontWeight={800} mb={1}>
              Progress safely
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Burpees are intense. Start with the beginner path, repeat levels
              as needed, and stop if you feel pain. If you are new to exercise
              or have health concerns, talk to a healthcare professional before
              starting.
            </Typography>
          </Card>
        </Section>

        <Section
          id="founder-story"
          eyebrow="Why It Exists"
          title="Built From a Real Need for Simpler Training"
        >
          <Card
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.08) 100%)",
            }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 820, mb: 2 }}
              >
              Hi, I&apos;m Krishna. I built BurpeePacers because I wanted a
              simpler way to follow structured conditioning workouts at home
              without relying on a gym schedule or overcomplicated plans.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 820, mb: 3 }}
              >
              I created it first for myself, then shaped it into a product for
              adults who want a clear starting point, guided pacing, and steady
              progress. The goal is simple: remove friction so people can focus
              on showing up and training consistently.
              </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/login")}
            >
              Start Your First Workout
            </Button>
          </Card>
        </Section>

        <Section
          id="pricing"
          eyebrow="Pricing"
          title="Start on the Web"
          description="The main BurpeePacers experience is available on the web today, including signup, paced workouts, workout logging, and progression tracking."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(280px, 0.8fr)" },
              gap: 3,
            }}
          >
            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Typography variant="h5" fontWeight={800} mb={1.5}>
                What you get
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body1" color="text.secondary">
                  Guided 20-minute workout pacing on the web
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Beginner and advanced training paths
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Workout logging and progress tracking
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Optional weighted strength work on your selected training days
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  A simple system focused on consistency instead of complexity
                </Typography>
              </Stack>
            </Card>

            <Card
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid rgba(255,51,102,0.35)",
                background:
                  "linear-gradient(160deg, rgba(255,51,102,0.1) 0%, rgba(255,255,255,0.03) 100%)",
              }}
            >
              <Typography variant="h5" fontWeight={800} mb={1}>
                Launch access
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Start free on the web today. Create an account, choose your
                track, and begin your first guided workout right away. Pricing
                details are available on the pricing page.
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push("/login")}
                >
                  Start Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push("/pricing")}
                >
                  View Pricing Details
                </Button>
              </Stack>
            </Card>
          </Box>
        </Section>

        <Section
          id="faq"
          eyebrow="FAQ"
          title="Questions New Members Usually Ask"
        >
          <Stack spacing={2}>
            {FAQS.map((item) => (
              <Card
                key={item.question}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <Typography variant="h6" fontWeight={800} mb={1}>
                  {item.question}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {item.answer}
                </Typography>
              </Card>
            ))}
          </Stack>
        </Section>

        <Card
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            BurpeePacers is web-first. References to iOS, Android, and other
            platform updates are intentionally secondary while the core web
            experience remains the primary way to sign up, train, and track
            progress.
          </Typography>
        </Card>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button
            variant="text"
            href="#top"
            sx={{ color: "rgba(255,255,255,0.76)" }}
          >
            Back to top
          </Button>
        </Box>

        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} BurpeePacers ·{" "}
            <a
              href="/privacy"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
