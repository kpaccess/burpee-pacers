"use client";

import { type ReactNode, useEffect } from "react";
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
  { label: "Founder Story", href: "#founder-story" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const PREVIEW_CARDS = [
  {
    src: "/images/preview-timer-2.png",
    alt: "Workout timer screen with pacing and countdown",
    caption: "Follow the timer instead of counting reps in your head.",
  },
  {
    src: "/images/preview-calendar.png",
    alt: "Calendar and progress tracking view",
    caption: "Stay consistent with a simple workout log and history view.",
  },
  {
    src: "/images/preview-levels.png",
    alt: "Level progression screen",
    caption: "See your level and progression path clearly on the web.",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "1. Choose your starting level",
    body: "Start with beginner burpees or move into advanced Navy SEAL training when ready.",
  },
  {
    title: "2. Train for 20 minutes",
    body: "Follow a simple pacing system so you do not have to count, guess, or overthink.",
  },
  {
    title: "3. Track your progress",
    body: "Log workouts, build consistency, and see your improvement over time.",
  },
  {
    title: "4. Progress when ready",
    body: "Repeat a level until it feels comfortable, then move up safely.",
  },
];

const FAQS = [
  {
    question: "Who is BurpeePacers for?",
    answer:
      "It is built for adults 40+ who want a simple conditioning routine they can do at home, with no gym required.",
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
        scrollMarginTop: 100,
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,51,102,0.16), transparent 34%), radial-gradient(circle at 90% 0%, rgba(0,229,255,0.12), transparent 32%), linear-gradient(180deg, #09090b 0%, #12131a 100%)",
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: { xs: 4, md: 5 } }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BurpeeLogoIcon size={52} />
            <Box>
              <Typography variant="h6" fontWeight={900}>
                BurpeePacers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Structured 20-minute conditioning at home
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "row", md: "row" }}
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
          >
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                href={item.href}
                sx={{
                  color: "rgba(255,255,255,0.76)",
                  px: 1.25,
                  minWidth: 0,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Stack>

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
                  Start where you are. Follow the pace. Progress when ready.
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
                  20-Minute Conditioning for Adults 40+
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.78)",
                    maxWidth: 680,
                    lineHeight: 1.5,
                  }}
                >
                  Build fitness, endurance, and consistency with guided burpee
                  workouts you can do at home with no gym required — plus
                  optional strength work if you have equipment.
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
              </Stack>
            </Card>

            <Card
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 4,
                border: "1px solid rgba(0,229,255,0.18)",
                background: "rgba(9,13,20,0.9)",
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  The complete web training flow
                </Typography>
                {PREVIEW_CARDS.map((preview) => (
                  <Box
                    key={preview.src}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "112px minmax(0, 1fr)",
                      gap: 1.5,
                      alignItems: "center",
                      p: 1.25,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Box
                      component="img"
                      src={preview.src}
                      alt={preview.alt}
                      sx={{
                        width: "100%",
                        height: 124,
                        objectFit: "contain",
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {preview.caption}
                    </Typography>
                  </Box>
                ))}
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
          eyebrow="Founder Story"
          title="Built by Someone Who Uses It"
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
              Hi, I&apos;m Krishna. I&apos;m a software developer in my 50s, and I
              built BurpeePacers because I wanted a simple way to stay fit
              without depending on a gym schedule or complicated workout plans.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 820, mb: 3 }}
            >
              I was inspired by structured burpee training, but I wanted a
              better way to pace, log, and progress through my workouts.
              BurpeePacers is the system I built for myself — now shared with
              others who want simple, disciplined conditioning at home.
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
                Start free on the web today. Pricing details and future plan
                updates live on the pricing page.
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
