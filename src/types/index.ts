export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'SCANNER_OPERATOR';
  schoolId: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  schoolId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classroom: string;
}

export interface Exam {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  subject: string;
  totalQuestions: number;
  choicesPerQuestion: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  questions?: Question[];
  examVersions?: ExamVersion[];
  _count?: {
    questions: number;
    examVersions: number;
    results: number;
  };
}

export interface Question {
  id: string;
  examId: string;
  questionNumber: number;
  content: string;
  choices: Choice[];
}

export interface Choice {
  id: string;
  questionId: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

export interface ExamVersion {
  id: string;
  examId: string;
  versionCode: string;
  questionMapping: any;
  choiceMapping: any;
  answerKey: any;
}

export interface AnswerSheet {
  id: string;
  schoolId: string;
  examId: string;
  studentCode: string;
  answers: Record<string, string>;
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  student?: Student;
  exam?: Exam;
  examVersion?: ExamVersion;
  details?: GradeDetail[];
  createdAt: string;
}

export interface GradeDetail {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ExamStats {
  examId: string;
  totalScanned: number;
  averageScore: number;
  averagePercentage: number;
  maxScore: number;
  minScore: number;
  questionAnalysis: QuestionAnalysis[];
  recentResults: RecentResult[];
}

export interface QuestionAnalysis {
  questionNumber: number;
  correctCount: number;
  totalCount: number;
  correctRate: number;
}

export interface RecentResult {
  studentCode: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scannedAt: string;
}

export interface ScanResult {
  studentCode: string;
  versionCode: string;
  answers: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
