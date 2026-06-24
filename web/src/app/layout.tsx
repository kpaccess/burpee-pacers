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
  title: "BurpeePacers | Guided 20-Minute Home Conditioning",
  description:
    "Structured 20-minute burpee workouts with guided pacing, progress tracking, and simple home-friendly training for adults who want consistency without a gym.",
  openGraph: {
    title: "BurpeePacers | Guided 20-Minute Home Conditioning",
    description:
      "Structured 20-minute burpee workouts with guided pacing, progress tracking, and simple home-friendly training for adults who want consistency without a gym.",
    url: "https://burpeepacers.com",
    siteName: "BurpeePacers",
    images: [{ url: "/opengraph-image.png", width: 1024, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BurpeePacers | Guided 20-Minute Home Conditioning",
    description:
      "Structured 20-minute burpee workouts with guided pacing, progress tracking, and simple home-friendly training for adults who want consistency without a gym.",
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
