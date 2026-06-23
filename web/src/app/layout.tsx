import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BurpeePacers | 20-Minute Conditioning for Adults 40+",
  description:
    "Structured 20-minute burpee workouts for adults 40+ who want conditioning, strength, and consistency at home, with no gym required and optional strength work.",
  openGraph: {
    title: "BurpeePacers | 20-Minute Conditioning for Adults 40+",
    description:
      "Structured 20-minute burpee workouts for adults 40+ who want conditioning, strength, and consistency at home, with no gym required and optional strength work.",
    url: "https://burpeepacers.com",
    siteName: "BurpeePacers",
    images: [{ url: "/opengraph-image.png", width: 1024, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BurpeePacers | 20-Minute Conditioning for Adults 40+",
    description:
      "Structured 20-minute burpee workouts for adults 40+ who want conditioning, strength, and consistency at home, with no gym required and optional strength work.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>{children}</AuthProvider>
            <Analytics />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
