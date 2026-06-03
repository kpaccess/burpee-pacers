import type { Metadata } from "next";
import { Box, Container, Divider, Typography } from "@mui/material";

export const metadata: Metadata = {
  title: "Privacy Policy | BurpeePacers",
  description: "Privacy policy for BurpeePacers web and iOS app.",
};

const LAST_UPDATED = "June 3, 2026";
const CONTACT_EMAIL = "kpaccess@gmail.com";

export default function PrivacyPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} color="primary" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Last updated: {LAST_UPDATED}
        </Typography>

        <Section title="Overview">
          BurpeePacers (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          operates the BurpeePacers website at burpeepacers.com and the
          BurpeePacers iOS app. BurpeePacers is a personal fitness app built by
          an individual who uses it alongside the community — not a corporation.
          This policy explains what information we collect, how we use it, and
          your rights regarding that information. We do not sell your personal
          data.
        </Section>

        <Section title="Information We Collect">
          <BulletList
            items={[
              "Name and email address — collected when you create an account via Sign in with Apple, Sign in with Google, or email/password. When using Sign in with Apple, you may choose to hide your email using Apple's private relay service; we only receive the relay address.",
              "Workout logs — dates, rep counts, levels, workout modes, and completion status you record in the app.",
              "Body weight — optionally entered for protein target calculations. Stored only on your account.",
              "Progress photos — optionally uploaded as a Day 1 baseline or 6-month check-in photo. Stored in your private Firebase Storage bucket, accessible only to you.",
              "Start date — the date you began the program, used to calculate your program day and milestone dates.",
              "Purchase information — when you subscribe to BurpeePacers Pro, Apple processes the payment via In-App Purchase. We receive only your subscription status (active or inactive). We never see or store your credit card details.",
              "Device and usage data — basic crash logs and device identifiers collected automatically by Firebase to help us diagnose issues.",
            ]}
          />
        </Section>

        <Section title="How We Use Your Information">
          <BulletList
            items={[
              "To sync your workout history across the web app and iOS app.",
              "To calculate your current level, program day, and progress statistics.",
              "To manage your Pro subscription status.",
              "To send a one-time welcome email when you create a new account.",
              "To diagnose crashes and improve app stability.",
            ]}
          />
          We do not use your data for advertising, profiling, or any purpose
          beyond operating the app.
        </Section>

        <Section title="Third-Party Services">
          We use the following third-party services, which process your data
          under their own privacy policies:
          <BulletList
            items={[
              "Apple — Sign in with Apple and In-App Purchase processing. Privacy policy: apple.com/legal/privacy",
              "Firebase (Google) — authentication, database (Firestore), and file storage. Privacy policy: firebase.google.com/support/privacy",
              "Google Sign-In — optional sign-in method. Privacy policy: policies.google.com/privacy",
              "Stripe — web subscription payment processing. We never see or store your card number. Privacy policy: stripe.com/privacy",
              "Resend — transactional email delivery (welcome email only). Privacy policy: resend.com/legal/privacy-policy",
            ]}
          />
        </Section>

        <Section title="Data Retention">
          Your data is retained for as long as your account is active. If you
          delete your account, we will permanently remove your personal data and
          workout history from our systems. Deletion is immediate for your
          Firestore data and Firebase Auth account.
        </Section>

        <Section title="Account Deletion">
          You can delete your account and all associated data at any time
          directly within the app:
          <BulletList
            items={[
              "iOS app: Tap the person icon (top right of the Dashboard) → scroll to the bottom → tap Delete Account.",
              "Web app: Contact us at the email below and we will delete your account within 48 hours.",
            ]}
          />
          Deletion is permanent and cannot be undone. All workout logs,
          progress photos, and personal information will be removed. If you
          subscribed via In-App Purchase, cancel your subscription separately in
          your Apple ID settings to avoid future charges.
        </Section>

        <Section title="Your Rights">
          You have the right to:
          <BulletList
            items={[
              "Access the data we hold about you.",
              "Request correction of inaccurate data.",
              "Delete your account and all associated data (see Account Deletion above).",
              "Export your workout data (available in the app as a CSV download).",
            ]}
          />
          To exercise any of these rights, contact us at{" "}
          <Typography component="span" color="primary.main">
            {CONTACT_EMAIL}
          </Typography>
          .
        </Section>

        <Section title="Children's Privacy">
          BurpeePacers is not directed at children under 13. We do not knowingly
          collect personal information from children under 13. If you believe a
          child has provided us with personal information, please contact us and
          we will delete it promptly.
        </Section>

        <Section title="Security">
          All data is transmitted over HTTPS and stored in Firebase, which
          provides industry-standard encryption at rest and in transit. Access
          to your data is protected by Firebase Security Rules — only you can
          read or write your own workout data.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. We will post the updated
          policy on this page with a revised &quot;Last updated&quot; date.
          Continued use of the app after changes constitutes acceptance of the
          updated policy.
        </Section>

        <Section title="Contact">
          If you have any questions about this privacy policy or how we handle
          your data, please contact us at{" "}
          <Typography component="span" color="primary.main">
            {CONTACT_EMAIL}
          </Typography>
          .
        </Section>
      </Container>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box mb={4}>
      <Typography variant="h5" fontWeight={700} mb={1.5}>
        {title}
      </Typography>
      <Typography
        component="div"
        variant="body1"
        color="text.secondary"
        sx={{ lineHeight: 1.8 }}
      >
        {children}
      </Typography>
      <Divider sx={{ mt: 3, borderColor: "rgba(255,255,255,0.08)" }} />
    </Box>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
      {items.map((item) => (
        <li
          key={item}
          style={{ marginBottom: 6, lineHeight: 1.7, color: "inherit" }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
