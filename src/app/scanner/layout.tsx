'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { ArrowBack as BackIcon, QrCodeScanner as ScanIcon } from '@mui/icons-material';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/services/api';

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    authApi
      .me()
      .then(({ data }) => setUser(data))
      .catch(() => { logout(); router.push('/auth/login'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<BackIcon />}
            onClick={() => router.push('/admin/dashboard')}
            sx={{ mr: 2 }}
          >
            กลับ
          </Button>
          <ScanIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            สแกนเนอร์ OMR
          </Typography>
          {user && (
            <Typography variant="body2">
              {user.firstName} {user.lastName}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
}
