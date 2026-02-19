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
import { examsApi, scannerApi } from '@/services/api';
import { wsService } from '@/services/websocket';
import { Exam, ExamStats } from '@/types';

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

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examsApi
      .getAll({ limit: 100 })
      .then(({ data }) => {
        setExams(data.data);
        if (data.data.length > 0) {
          setSelectedExamId(data.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadStats = useCallback(() => {
    if (!selectedExamId) return;
    scannerApi.getStats(selectedExamId).then(({ data }) => setStats(data));
  }, [selectedExamId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!selectedExamId) return;

    wsService.joinExam(selectedExamId);

    const handleStatsUpdate = (data: ExamStats) => {
      if (data.examId === selectedExamId) {
        setStats(data);
      }
    };

    wsService.on('exam.stats.updated', handleStatsUpdate);
    wsService.on('exam.scan.completed', loadStats);

    return () => {
      wsService.off('exam.stats.updated', handleStatsUpdate);
      wsService.off('exam.scan.completed', loadStats);
    };
  }, [selectedExamId, loadStats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">แดชบอร์ด</Typography>
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel>เลือกข้อสอบ</InputLabel>
          <Select
            value={selectedExamId}
            label="เลือกข้อสอบ"
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {exams.map((exam) => (
              <MenuItem key={exam.id} value={exam.id}>
                {exam.title} ({exam.subject})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="จำนวนสแกน"
                value={stats.totalScanned}
                icon={<PeopleIcon />}
                color="#1565c0"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="คะแนนเฉลี่ย"
                value={stats.averageScore.toFixed(1)}
                icon={<AssessmentIcon />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="เปอร์เซ็นต์เฉลี่ย"
                value={`${stats.averagePercentage.toFixed(1)}%`}
                icon={<TrendingUpIcon />}
                color="#f57c00"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="คะแนนสูงสุด/ต่ำสุด"
                value={`${stats.maxScore}/${stats.minScore}`}
                icon={<QuizIcon />}
                color="#d32f2f"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สถิติรายข้อ (อัตราตอบถูก %)
                  </Typography>
                  {stats.questionAnalysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={stats.questionAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="questionNumber" label={{ value: 'ข้อที่', position: 'bottom' }} />
                        <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'left' }} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, 'อัตราถูกต้อง']}
                          labelFormatter={(label) => `ข้อที่ ${label}`}
                        />
                        <Bar
                          dataKey="correctRate"
                          fill="#1565c0"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={4}>
                      ยังไม่มีข้อมูล
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ผลสอบล่าสุด
                    <Chip
                      label="เรียลไทม์"
                      size="small"
                      color="success"
                      sx={{ ml: 1, animation: 'pulse 2s infinite' }}
                    />
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>รหัส</TableCell>
                          <TableCell>ชื่อ</TableCell>
                          <TableCell align="center">คะแนน</TableCell>
                          <TableCell align="center">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.recentResults.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.studentCode}</TableCell>
                            <TableCell>{r.studentName}</TableCell>
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
                            <TableCell colSpan={4} align="center">
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

      {!stats && selectedExamId && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
          <Typography mt={2}>กำลังโหลดข้อมูล...</Typography>
        </Box>
      )}

      {!selectedExamId && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <QuizIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            กรุณาสร้างข้อสอบก่อน
          </Typography>
        </Box>
      )}
    </Box>
  );
}
