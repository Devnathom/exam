'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  QrCodeScanner as ScanIcon,
} from '@mui/icons-material';
import { examsApi, scannerApi } from '@/services/api';
import { useAuthStore } from '@/lib/store';
import { Exam, ExamVersion, ScanResult } from '@/types';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [versions, setVersions] = useState<ExamVersion[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    studentCode: '',
    versionCode: 'A',
    answers: {} as Record<string, string>,
  });

  useEffect(() => {
    examsApi.getAll({ limit: 100 }).then(({ data }) => {
      const published = data.data.filter((e: Exam) => e.status === 'PUBLISHED');
      setExams(published);
      if (published.length > 0) setSelectedExamId(published[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      examsApi.getVersions(selectedExamId).then(({ data }) => setVersions(data));
    }
  }, [selectedExamId]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      toast.error('ไม่สามารถเปิดกล้องได้');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);

    // Process OMR from captured image
    const result = processOMR(ctx, canvas.width, canvas.height);
    setScanResult(result);
    stopCamera();
  }, [stopCamera]);

  const processOMR = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): ScanResult => {
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Apply threshold
    const threshold = 128;
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i] < threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    // Detect filled bubbles by analyzing grid regions
    const selectedExam = exams.find((e) => e.id === selectedExamId);
    const totalQuestions = selectedExam?.totalQuestions || 10;
    const choicesPerQuestion = selectedExam?.choicesPerQuestion || 4;
    const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, choicesPerQuestion);

    // Define answer grid region (proportional to image)
    const gridLeft = Math.floor(width * 0.15);
    const gridTop = Math.floor(height * 0.3);
    const gridWidth = Math.floor(width * 0.7);
    const gridHeight = Math.floor(height * 0.6);

    const rowHeight = gridHeight / totalQuestions;
    const colWidth = gridWidth / choicesPerQuestion;
    const bubbleRadius = Math.min(rowHeight, colWidth) * 0.3;

    const answers: Record<string, string> = {};

    for (let q = 0; q < totalQuestions; q++) {
      const centerY = gridTop + (q + 0.5) * rowHeight;
      let minDarkness = Infinity;
      let selectedChoice = '';

      for (let c = 0; c < choicesPerQuestion; c++) {
        const centerX = gridLeft + (c + 0.5) * colWidth;

        // Sample pixels in bubble area
        let darkPixels = 0;
        let totalPixels = 0;

        for (let dy = -bubbleRadius; dy <= bubbleRadius; dy++) {
          for (let dx = -bubbleRadius; dx <= bubbleRadius; dx++) {
            if (dx * dx + dy * dy <= bubbleRadius * bubbleRadius) {
              const px = Math.floor(centerX + dx);
              const py = Math.floor(centerY + dy);
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                if (data[idx] === 0) darkPixels++;
                totalPixels++;
              }
            }
          }
        }

        const darkness = totalPixels > 0 ? darkPixels / totalPixels : 0;
        if (darkness > 0.4 && darkness < minDarkness) {
          minDarkness = darkness;
          selectedChoice = choiceLabels[c];
        }
      }

      if (selectedChoice) {
        answers[String(q + 1)] = selectedChoice;
      }
    }

    // Detect student code from top region
    const studentCodeRegionTop = Math.floor(height * 0.05);
    const studentCodeRegionHeight = Math.floor(height * 0.2);
    const codeColWidth = Math.floor(width * 0.06);
    const codeDigits = 5;
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let studentCode = '';
    for (let d = 0; d < codeDigits; d++) {
      const colCenterX = Math.floor(width * 0.3) + d * codeColWidth;
      let maxDark = 0;
      let selectedDigit = '0';

      for (let digit = 0; digit < 10; digit++) {
        const rowCenterY = studentCodeRegionTop + (digit + 0.5) * (studentCodeRegionHeight / 10);
        let darkPixels = 0;
        let total = 0;
        const r = bubbleRadius * 0.6;

        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r * r) {
              const px = Math.floor(colCenterX + dx);
              const py = Math.floor(rowCenterY + dy);
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                if (data[idx] === 0) darkPixels++;
                total++;
              }
            }
          }
        }

        const ratio = total > 0 ? darkPixels / total : 0;
        if (ratio > maxDark) {
          maxDark = ratio;
          selectedDigit = digits[digit];
        }
      }
      studentCode += selectedDigit;
    }

    // Detect version code
    let versionCode = 'A';
    const versionLabels = versions.map((v) => v.versionCode);
    if (versionLabels.length > 0) {
      versionCode = versionLabels[0];
    }

    return { studentCode, versionCode, answers };
  };

  const handleSubmit = async () => {
    if (!scanResult || !user?.schoolId) return;
    setSubmitting(true);
    try {
      const { data } = await scannerApi.submit({
        examId: selectedExamId,
        studentCode: scanResult.studentCode,
        versionCode: scanResult.versionCode,
        answers: scanResult.answers,
        schoolId: user.schoolId,
      });
      setSubmitResult(data.result);
      toast.success(`ตรวจสำเร็จ: ${data.result.score}/${data.result.totalQuestions} คะแนน`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ส่งผลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!user?.schoolId) return;
    setSubmitting(true);
    try {
      const { data } = await scannerApi.submit({
        examId: selectedExamId,
        studentCode: manualForm.studentCode,
        versionCode: manualForm.versionCode,
        answers: manualForm.answers,
        schoolId: user.schoolId,
      });
      setSubmitResult(data.result);
      setManualDialogOpen(false);
      toast.success(`ตรวจสำเร็จ: ${data.result.score}/${data.result.totalQuestions} คะแนน`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ส่งผลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setScanResult(null);
    setSubmitResult(null);
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScanIcon /> สแกนกระดาษคำตอบ
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>เลือกข้อสอบ</InputLabel>
                <Select
                  value={selectedExamId}
                  label="เลือกข้อสอบ"
                  onChange={(e) => { setSelectedExamId(e.target.value); resetScan(); }}
                >
                  {exams.map((exam) => (
                    <MenuItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!cameraActive && !capturedImage && (
                  <Button variant="contained" startIcon={<CameraIcon />} onClick={startCamera} fullWidth>
                    เปิดกล้อง
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setManualForm({
                      studentCode: '',
                      versionCode: versions[0]?.versionCode || 'A',
                      answers: {},
                    });
                    setManualDialogOpen(true);
                  }}
                  fullWidth
                >
                  กรอกมือ
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Camera View */}
      {cameraActive && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: 400, borderRadius: 8, background: '#000' }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" color="success" onClick={captureImage} size="large">
                ถ่ายภาพ
              </Button>
              <Button variant="outlined" color="error" onClick={stopCamera}>
                ปิดกล้อง
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Captured Image & Scan Result */}
      {capturedImage && scanResult && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ภาพที่ถ่าย</Typography>
                <img src={capturedImage} alt="captured" style={{ width: '100%', borderRadius: 8 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ผลการอ่าน OMR</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">รหัสนักเรียน</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={scanResult.studentCode}
                    onChange={(e) => setScanResult({ ...scanResult, studentCode: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">ชุดข้อสอบ</Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={scanResult.versionCode}
                    onChange={(e) => setScanResult({ ...scanResult, versionCode: e.target.value })}
                  >
                    {versions.map((v) => (
                      <MenuItem key={v.id} value={v.versionCode}>{v.versionCode}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>ข้อ</TableCell>
                        <TableCell>คำตอบ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(scanResult.answers).map(([q, a]) => (
                        <TableRow key={q}>
                          <TableCell>{q}</TableCell>
                          <TableCell>
                            <Chip label={a} size="small" color="primary" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
                    onClick={handleSubmit}
                    disabled={submitting}
                    fullWidth
                  >
                    ส่งตรวจ
                  </Button>
                  <Button variant="outlined" onClick={resetScan} fullWidth>
                    สแกนใหม่
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Submit Result */}
      {submitResult && (
        <Card sx={{ mt: 3, border: 2, borderColor: submitResult.percentage >= 50 ? 'success.main' : 'error.main' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            {submitResult.percentage >= 50 ? (
              <CheckIcon sx={{ fontSize: 60, color: 'success.main' }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
            )}
            <Typography variant="h4" fontWeight={700} mt={1}>
              {submitResult.score}/{submitResult.totalQuestions}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {submitResult.percentage.toFixed(1)}%
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={resetScan}>
              สแกนคนถัดไป
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Input Dialog */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>กรอกคำตอบด้วยมือ</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="รหัสนักเรียน"
            value={manualForm.studentCode}
            onChange={(e) => setManualForm({ ...manualForm, studentCode: e.target.value })}
            required
          />
          <FormControl size="small">
            <InputLabel>ชุดข้อสอบ</InputLabel>
            <Select
              value={manualForm.versionCode}
              label="ชุดข้อสอบ"
              onChange={(e) => setManualForm({ ...manualForm, versionCode: e.target.value })}
            >
              {versions.map((v) => (
                <MenuItem key={v.id} value={v.versionCode}>{v.versionCode}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="subtitle2">คำตอบ:</Typography>
          <Grid container spacing={1}>
            {Array.from({ length: selectedExam?.totalQuestions || 10 }, (_, i) => i + 1).map((q) => (
              <Grid item xs={6} sm={4} key={q}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>ข้อ {q}:</Typography>
                  <Select
                    size="small"
                    value={manualForm.answers[String(q)] || ''}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        answers: { ...manualForm.answers, [String(q)]: e.target.value },
                      })
                    }
                    sx={{ minWidth: 60 }}
                  >
                    <MenuItem value="">-</MenuItem>
                    {['A', 'B', 'C', 'D'].slice(0, selectedExam?.choicesPerQuestion || 4).map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setManualDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleManualSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'ส่งตรวจ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
