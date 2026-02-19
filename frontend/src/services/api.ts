import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; schoolCode: string }) =>
    api.post('/auth/register', data),
  me: () => api.post('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const studentsApi = {
  getAll: (params?: Record<string, any>) => api.get('/students', { params }),
  getOne: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  remove: (id: string) => api.delete(`/students/${id}`),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getClassrooms: () => api.get('/students/classrooms'),
};

export const examsApi = {
  getAll: (params?: Record<string, any>) => api.get('/exams', { params }),
  getOne: (id: string) => api.get(`/exams/${id}`),
  create: (data: any) => api.post('/exams', data),
  update: (id: string, data: any) => api.put(`/exams/${id}`, data),
  remove: (id: string) => api.delete(`/exams/${id}`),
  generateVersions: (id: string, data: any) => api.post(`/exams/${id}/versions`, data),
  getVersions: (id: string) => api.get(`/exams/${id}/versions`),
};

export const scannerApi = {
  submit: (data: {
    examId: string;
    studentCode: string;
    versionCode: string;
    answers: Record<string, string>;
    schoolId: string;
  }) => api.post('/scanner/submit', data),
  getStats: (examId: string) => api.get(`/scanner/stats/${examId}`),
};

export const resultsApi = {
  getByExam: (examId: string, params?: Record<string, any>) =>
    api.get(`/results/exam/${examId}`, { params }),
  getByStudent: (studentId: string) => api.get(`/results/student/${studentId}`),
  getOne: (id: string) => api.get(`/results/${id}`),
  exportExam: (examId: string) => api.get(`/results/exam/${examId}/export`),
};

export default api;
