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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { studentsApi } from '@/services/api';
import { Student, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [classroom, setClassroom] = useState('');
  const [classrooms, setClassrooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ studentCode: '', firstName: '', lastName: '', classroom: '' });

  const loadStudents = useCallback(() => {
    setLoading(true);
    studentsApi
      .getAll({ page: page + 1, limit, search: search || undefined, classroom: classroom || undefined })
      .then(({ data }: { data: PaginatedResponse<Student> }) => {
        setStudents(data.data);
        setTotal(data.meta.total);
      })
      .catch(() => toast.error('โหลดข้อมูลนักเรียนไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [page, limit, search, classroom]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    studentsApi.getClassrooms().then(({ data }) => setClassrooms(data));
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, form);
        toast.success('แก้ไขข้อมูลนักเรียนสำเร็จ');
      } else {
        await studentsApi.create(form);
        toast.success('เพิ่มนักเรียนสำเร็จ');
      }
      setDialogOpen(false);
      setEditingStudent(null);
      setForm({ studentCode: '', firstName: '', lastName: '', classroom: '' });
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      classroom: student.classroom,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบนักเรียนคนนี้?')) return;
    try {
      await studentsApi.remove(id);
      toast.success('ลบนักเรียนสำเร็จ');
      loadStudents();
    } catch {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await studentsApi.importCsv(file);
      toast.success(`นำเข้าสำเร็จ ${data.imported} คน`);
      if (data.errors?.length > 0) {
        toast.error(`มีข้อผิดพลาด ${data.errors.length} รายการ`);
      }
      loadStudents();
    } catch {
      toast.error('นำเข้าไม่สำเร็จ');
    }
    e.target.value = '';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">จัดการนักเรียน</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            component="label"
          >
            นำเข้า CSV
            <input type="file" hidden accept=".csv" onChange={handleImportCsv} />
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingStudent(null);
              setForm({ studentCode: '', firstName: '', lastName: '', classroom: '' });
              setDialogOpen(true);
            }}
          >
            เพิ่มนักเรียน
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="ค้นหา ชื่อ, นามสกุล, รหัส..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ห้องเรียน</InputLabel>
            <Select
              value={classroom}
              label="ห้องเรียน"
              onChange={(e) => { setClassroom(e.target.value); setPage(0); }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {classrooms.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip label={`ทั้งหมด ${total} คน`} color="primary" variant="outlined" />
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>รหัสนักเรียน</TableCell>
                  <TableCell>ชื่อ</TableCell>
                  <TableCell>นามสกุล</TableCell>
                  <TableCell>ห้องเรียน</TableCell>
                  <TableCell align="center">จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Chip label={s.studentCode} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{s.firstName}</TableCell>
                    <TableCell>{s.lastName}</TableCell>
                    <TableCell>
                      <Chip label={s.classroom} size="small" color="info" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(s)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(s.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      ไม่พบข้อมูลนักเรียน
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={limit}
            rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียน'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="รหัสนักเรียน"
            value={form.studentCode}
            onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
            required
            disabled={!!editingStudent}
          />
          <TextField
            label="ชื่อ"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <TextField
            label="นามสกุล"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
          <TextField
            label="ห้องเรียน"
            value={form.classroom}
            onChange={(e) => setForm({ ...form, classroom: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingStudent ? 'บันทึก' : 'เพิ่ม'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
