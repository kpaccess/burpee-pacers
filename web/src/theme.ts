'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF3366',
    },
    secondary: {
      main: '#00E5FF',
    },
    success: {
      main: '#5FCB79',
    },
    warning: {
      main: '#F5B544',
    },
    background: {
      default: '#090909',
      paper: '#121212',
    },
    text: {
      primary: '#F7F7F2',
      secondary: 'rgba(247, 247, 242, 0.68)',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Avenir Next", "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
          backgroundColor: 'rgba(18, 18, 18, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.22)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
