'use client';
import { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme, { darkTheme } from '@/theme/theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const currentTheme = useMemo(() => (mode === 'light' ? theme : darkTheme), [mode]);

  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1565c0" />
        <link rel="manifest" href="/manifest.json" />
        <title>ระบบจัดการสอบและสแกน OMR</title>
      </head>
      <body>
        <ThemeProvider theme={currentTheme}>
          <CssBaseline />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
