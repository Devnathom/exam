'use client';
import { createTheme } from '@mui/material/styles';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0', light: '#5e92f3', dark: '#003c8f' },
    secondary: { main: '#f57c00', light: '#ffad42', dark: '#bb4d00' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    success: { main: '#2e7d32' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    info: { main: '#0288d1' },
  },
  typography: {
    fontFamily: sarabun.style.fontFamily,
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
});

export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: { main: '#5e92f3', light: '#90caf9', dark: '#1565c0' },
    secondary: { main: '#ffad42', light: '#ffd95b', dark: '#f57c00' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
});

export default theme;
