'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Quiz as QuizIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '@/services/api';

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}15`,
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalResults: number;
  recentResults: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ totalStudents: 0, totalExams: 0, totalResults: 0, recentResults: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>แดชบอร์ด</Typography>

      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="นักเรียนทั้งหมด"
                value={stats.totalStudents}
                icon={<PeopleIcon />}
                color="#1565c0"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="ข้อสอบทั้งหมด"
                value={stats.totalExams}
                icon={<QuizIcon />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="ผลสอบทั้งหมด"
                value={stats.totalResults}
                icon={<AssessmentIcon />}
                color="#f57c00"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ผลสอบล่าสุด
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>รหัส</TableCell>
                          <TableCell>ชื่อ-นามสกุล</TableCell>
                          <TableCell>ข้อสอบ</TableCell>
                          <TableCell align="center">คะแนน</TableCell>
                          <TableCell align="center">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.recentResults.map((r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{r.student?.studentCode}</TableCell>
                            <TableCell>{r.student?.firstName} {r.student?.lastName}</TableCell>
                            <TableCell>{r.exam?.title}</TableCell>
                            <TableCell align="center">
                              {r.score}/{r.totalQuestions}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={r.percentage}
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                  color={r.percentage >= 50 ? 'success' : 'error'}
                                />
                                <Typography variant="caption" sx={{ minWidth: 35 }}>
                                  {r.percentage.toFixed(0)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {stats.recentResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              ยังไม่มีผลสอบ
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
