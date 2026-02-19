'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login(email, password);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('เข้าสู่ระบบสำเร็จ');
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', py: 4, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 56, color: 'white', mb: 1 }} />
            <Typography variant="h5" color="white" fontWeight={700}>
              ระบบจัดการสอบและสแกน OMR
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.5}>
              Exam Management & OMR Scanning System
            </Typography>
          </Box>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                label="อีเมล"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="รหัสผ่าน"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'เข้าสู่ระบบ'}
              </Button>
            </form>
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
              ทดสอบ: admin@demo.school.com / admin123
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
