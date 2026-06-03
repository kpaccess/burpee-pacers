import type { Metadata } from "next";
import { Box, Container, Divider, Typography } from "@mui/material";

export const metadata: Metadata = {
  title: "Terms of Use | BurpeePacers",
  description: "Terms of use for the BurpeePacers web and iOS app.",
};

const LAST_UPDATED = "June 3, 2026";
const CONTACT_EMAIL = "kpaccess@gmail.com";

export default function TermsPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} color="primary" gutterBottom>
          Terms of Use
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Last updated: {LAST_UPDATED}
        </Typography>

        <Section title="Acceptance of Terms">
          By downloading, installing, or using the BurpeePacers iOS app or
          website at burpeepacers.com (&quot;the App&quot;), you agree to these
          Terms of Use. If you do not agree, do not use the App.
        </Section>

        <Section title="About the App">
          BurpeePacers is a personal fitness tracking app designed to help
          users follow a structured burpee workout program. It provides a
          workout timer, rep tracking, progress logging, and level progression
          across Beginner and Advanced tracks. The App is operated by an
          individual developer, not a company.
        </Section>

        <Section title="Not Medical Advice">
          The workout programs, rep targets, and fitness content in BurpeePacers
          are for informational and motivational purposes only. They do not
          constitute medical advice, diagnosis, or treatment. Before starting
          any new exercise program, consult a qualified healthcare provider,
          especially if you have any pre-existing health conditions or injuries.
          You exercise at your own risk.
        </Section>

        <Section title="Your Account">
          <BulletList
            items={[
              "You must provide a valid email address to create an account.",
              "You are responsible for keeping your login credentials secure.",
              "You must be at least 13 years old to use the App.",
              "One account per person — do not share your account with others.",
            ]}
          />
        </Section>

        <Section title="Pro Purchase">
          BurpeePacers Pro is available as a one-time In-App Purchase through
          Apple. Once purchased, Pro access is tied to your Apple ID and can be
          restored on any device signed in with the same Apple ID using the
          &quot;Restore Purchases&quot; option in the App. All payments are
          processed by Apple. Refund requests are handled by Apple in accordance
          with their{" "}
          <Typography
            component="a"
            href="https://www.apple.com/legal/internet-services/itunes/us/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            color="primary.main"
            sx={{ textDecoration: "none" }}
          >
            App Store Terms of Service
          </Typography>
          .
        </Section>

        <Section title="Acceptable Use">
          You agree not to:
          <BulletList
            items={[
              "Use the App for any unlawful purpose.",
              "Attempt to reverse engineer, hack, or disrupt the App or its backend services.",
              "Create multiple accounts to circumvent restrictions.",
              "Upload content (such as progress photos) that is offensive, illegal, or belongs to someone else.",
            ]}
          />
        </Section>

        <Section title="User Content">
          Any content you upload to the App (such as progress photos) remains
          yours. By uploading it, you grant us a limited license to store and
          display it solely for the purpose of providing the App to you. We do
          not share your content with any third party.
        </Section>

        <Section title="Account Termination">
          You may delete your account at any time from within the App (Account
          Settings → Delete Account). We reserve the right to suspend or
          terminate accounts that violate these terms. Upon termination, your
          data will be permanently deleted.
        </Section>

        <Section title="Disclaimer of Warranties">
          The App is provided &quot;as is&quot; without warranties of any kind.
          We do not guarantee that the App will be error-free, uninterrupted, or
          free of bugs. We are not liable for any injury, loss, or damage
          arising from your use of the App or the workout programs within it.
        </Section>

        <Section title="Limitation of Liability">
          To the fullest extent permitted by law, the developer of BurpeePacers
          shall not be liable for any indirect, incidental, or consequential
          damages arising from your use of the App, including but not limited to
          physical injury, data loss, or loss of access.
        </Section>

        <Section title="Changes to These Terms">
          We may update these terms from time to time. We will post the updated
          terms on this page with a revised &quot;Last updated&quot; date.
          Continued use of the App after changes are posted constitutes your
          acceptance of the updated terms.
        </Section>

        <Section title="Governing Law">
          These terms are governed by the laws of the United States. Any
          disputes will be resolved in accordance with applicable law.
        </Section>

        <Section title="Contact">
          If you have any questions about these terms, contact us at{" "}
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
