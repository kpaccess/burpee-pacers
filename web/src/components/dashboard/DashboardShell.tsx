import React, { useState } from "react";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CalendarViewMonthRoundedIcon from "@mui/icons-material/CalendarViewMonthRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BurpeeLogoIcon from "@/components/BurpeeLogoIcon";
import type { DashboardSectionId } from "./config";

type DashboardShellProps = {
  isMobile: boolean;
  activeSection: DashboardSectionId;
  isAdvancedTrack: boolean;
  userEmail?: string | null;
  canOpenAdmin: boolean;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onScrollToSection: (sectionId: DashboardSectionId) => void;
  currentLevelName?: string | null;
  children: React.ReactNode;
};

const SECTION_META: Record<
  DashboardSectionId,
  { label: string; icon: React.ReactNode }
> = {
  dashboard: { label: "Dashboard", icon: <DashboardRoundedIcon /> },
  workout: { label: "Workout", icon: <BoltRoundedIcon /> },
  calendar: { label: "Calendar", icon: <CalendarViewMonthRoundedIcon /> },
  progress: { label: "Progress", icon: <ShowChartRoundedIcon /> },
  strength: { label: "Strength", icon: <AccessibilityNewRoundedIcon /> },
};

const SECTION_IDS = Object.keys(SECTION_META) as DashboardSectionId[];

export default function DashboardShell({
  isMobile,
  activeSection,
  isAdvancedTrack,
  userEmail,
  canOpenAdmin,
  onOpenAdmin,
  onLogout,
  onScrollToSection,
  currentLevelName,
  children,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={(theme) => ({
          top: 0,
          backdropFilter: "blur(18px)",
          backgroundColor: alpha(theme.palette.background.default, 0.88),
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Toolbar
          sx={{
            maxWidth: 1280,
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 3 },
            gap: 2,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ minWidth: 0 }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: "transparent" }}>
                <Box sx={{ transform: "scale(0.78)" }}>
                  <BurpeeLogoIcon size={56} />
                </Box>
              </Avatar>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1.1 }}
              >
                BurpeePacers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isAdvancedTrack ? "Advanced program" : "Beginner program"}
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ flex: 1, justifyContent: "center" }}
            >
              {SECTION_IDS.map((sectionId) => {
                const section = SECTION_META[sectionId];
                return (
                  <Button
                    key={sectionId}
                    color="inherit"
                    startIcon={section.icon}
                    onClick={() => onScrollToSection(sectionId)}
                    sx={{
                      color:
                        activeSection === sectionId
                          ? "primary.main"
                          : "text.secondary",
                      borderBottom:
                        activeSection === sectionId
                          ? "2px solid"
                          : "2px solid transparent",
                      borderRadius: 0,
                      px: 1.5,
                    }}
                  >
                    {section.label}
                  </Button>
                );
              })}
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ ml: "auto" }}
          >
            {!isMobile && canOpenAdmin && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={onOpenAdmin}
                size="small"
              >
                Admin
              </Button>
            )}
            {!isMobile && (
              <Tooltip title={userEmail ?? "Signed in"}>
                <Avatar
                  sx={(theme) => ({
                    width: 36,
                    height: 36,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    color: "primary.main",
                  })}
                >
                  {(userEmail?.[0] ?? "B").toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
            {!isMobile && (
              <Button
                variant="outlined"
                color="error"
                onClick={onLogout}
                size="small"
                startIcon={<LogoutRoundedIcon />}
              >
                Log Out
              </Button>
            )}
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      >
        <Box sx={{ width: 290, p: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <BurpeeLogoIcon size={44} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                BurpeePacers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentLevelName ?? "Program dashboard"}
              </Typography>
            </Box>
          </Box>
          <List sx={{ py: 0 }}>
            {SECTION_IDS.map((sectionId) => (
              <ListItemButton
                key={sectionId}
                selected={activeSection === sectionId}
                onClick={() => {
                  setMobileNavOpen(false);
                  onScrollToSection(sectionId);
                }}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <Box
                  sx={{
                    mr: 1.5,
                    color:
                      activeSection === sectionId
                        ? "primary.main"
                        : "text.secondary",
                  }}
                >
                  {SECTION_META[sectionId].icon}
                </Box>
                <ListItemText primary={SECTION_META[sectionId].label} />
              </ListItemButton>
            ))}
            {canOpenAdmin && (
              <ListItemButton
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenAdmin();
                }}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary="Admin" />
              </ListItemButton>
            )}
            <ListItemButton onClick={onLogout} sx={{ borderRadius: 2 }}>
              <Box sx={{ mr: 1.5, color: "error.main" }}>
                <LogoutRoundedIcon />
              </Box>
              <ListItemText primary="Log Out / Reset" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {children}

      {isMobile && (
        <BottomNavigation
          showLabels
          value={activeSection}
          onChange={(_, value: DashboardSectionId) => onScrollToSection(value)}
          sx={(theme) => ({
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.96),
            backdropFilter: "blur(14px)",
          })}
        >
          {SECTION_IDS.map((sectionId) => (
            <BottomNavigationAction
              key={sectionId}
              value={sectionId}
              label={SECTION_META[sectionId].label}
              icon={SECTION_META[sectionId].icon}
            />
          ))}
        </BottomNavigation>
      )}
    </>
  );
}
