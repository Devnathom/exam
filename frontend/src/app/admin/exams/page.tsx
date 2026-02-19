'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shuffle as ShuffleIcon,
  ExpandMore as ExpandMoreIcon,
  Publish as PublishIcon,
} from '@mui/icons-material';
import { examsApi } from '@/services/api';
import { Exam } from '@/types';
import toast from 'react-hot-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    totalQuestions: 10,
    choicesPerQuestion: 4,
  });
  const [versionForm, setVersionForm] = useState({
    versionCodes: 'A,B,C,D',
    shuffleQuestions: true,
    shuffleChoices: true,
  });

  const loadExams = useCallback(() => {
    setLoading(true);
    examsApi
      .getAll({ limit: 100 })
      .then(({ data }) => setExams(data.data))
      .catch(() => toast.error('โหลดข้อมูลข้อสอบไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleCreateExam = async () => {
    try {
      await examsApi.create(form);
      toast.success('สร้างข้อสอบสำเร็จ');
      setDialogOpen(false);
      setForm({ title: '', description: '', subject: '', totalQuestions: 10, choicesPerQuestion: 4 });
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'สร้างข้อสอบไม่สำเร็จ');
    }
  };

  const handleGenerateVersions = async () => {
    try {
      const codes = versionForm.versionCodes.split(',').map((c) => c.trim()).filter(Boolean);
      await examsApi.generateVersions(selectedExamId, {
        versionCodes: codes,
        shuffleQuestions: versionForm.shuffleQuestions,
        shuffleChoices: versionForm.shuffleChoices,
      });
      toast.success(`สร้างชุดข้อสอบ ${codes.join(', ')} สำเร็จ`);
      setVersionDialogOpen(false);
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'สร้างชุดข้อสอบไม่สำเร็จ');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('ต้องการลบข้อสอบนี้?')) return;
    try {
      await examsApi.remove(id);
      toast.success('ลบข้อสอบสำเร็จ');
      loadExams();
    } catch {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const statusColors: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
    DRAFT: 'warning',
    PUBLISHED: 'success',
    ARCHIVED: 'info',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'แบบร่าง',
    PUBLISHED: 'เผยแพร่แล้ว',
    ARCHIVED: 'เก็บถาวร',
  };

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
        <Typography variant="h4">จัดการข้อสอบ</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          สร้างข้อสอบ
        </Button>
      </Box>

      <Grid container spacing={3}>
        {exams.map((exam) => (
          <Grid item xs={12} sm={6} md={4} key={exam.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                    {exam.title}
                  </Typography>
                  <Chip
                    label={statusLabels[exam.status]}
                    color={statusColors[exam.status]}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  วิชา: {exam.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  จำนวนข้อ: {exam.totalQuestions} | ตัวเลือก: {exam.choicesPerQuestion}
                </Typography>
                {exam._count && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={`${exam._count.questions} คำถาม`} size="small" variant="outlined" />
                    <Chip label={`${exam._count.examVersions} ชุด`} size="small" variant="outlined" color="primary" />
                    <Chip label={`${exam._count.results} ผลสอบ`} size="small" variant="outlined" color="success" />
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  startIcon={<ShuffleIcon />}
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    setVersionDialogOpen(true);
                  }}
                >
                  สร้างชุดข้อสอบ
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton size="small" color="error" onClick={() => handleDeleteExam(exam.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {exams.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                ยังไม่มีข้อสอบ กดปุ่ม &quot;สร้างข้อสอบ&quot; เพื่อเริ่มต้น
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Exam Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างข้อสอบใหม่</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="ชื่อข้อสอบ"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <TextField
            label="วิชา"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
          <TextField
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={2}
          />
          <TextField
            label="จำนวนข้อ"
            type="number"
            value={form.totalQuestions}
            onChange={(e) => setForm({ ...form, totalQuestions: parseInt(e.target.value) || 10 })}
            required
          />
          <TextField
            label="จำนวนตัวเลือกต่อข้อ"
            type="number"
            value={form.choicesPerQuestion}
            onChange={(e) => setForm({ ...form, choicesPerQuestion: parseInt(e.target.value) || 4 })}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleCreateExam}>
            สร้าง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Versions Dialog */}
      <Dialog open={versionDialogOpen} onClose={() => setVersionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างชุดข้อสอบ (สลับข้อ/ตัวเลือก)</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Alert severity="info">
            ระบบจะสลับลำดับข้อและตัวเลือกอัตโนมัติ พร้อมสร้างเฉลยแต่ละชุด
          </Alert>
          <TextField
            label="รหัสชุดข้อสอบ (คั่นด้วยคอมมา)"
            value={versionForm.versionCodes}
            onChange={(e) => setVersionForm({ ...versionForm, versionCodes: e.target.value })}
            helperText="ตัวอย่าง: A,B,C,D"
          />
          <FormControlLabel
            control={
              <Switch
                checked={versionForm.shuffleQuestions}
                onChange={(e) => setVersionForm({ ...versionForm, shuffleQuestions: e.target.checked })}
              />
            }
            label="สลับลำดับข้อ"
          />
          <FormControlLabel
            control={
              <Switch
                checked={versionForm.shuffleChoices}
                onChange={(e) => setVersionForm({ ...versionForm, shuffleChoices: e.target.checked })}
              />
            }
            label="สลับลำดับตัวเลือก"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVersionDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" startIcon={<PublishIcon />} onClick={handleGenerateVersions}>
            สร้างชุดข้อสอบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
