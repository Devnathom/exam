# ระบบจัดการสอบและสแกน OMR (Exam Management & OMR Scanning System)

ระบบ SaaS สำหรับจัดการข้อสอบ สแกนกระดาษคำตอบ OMR และตรวจข้อสอบอัตโนมัติ รองรับหลายโรงเรียน (Multi-tenant) พร้อมแดชบอร์ดเรียลไทม์

## สถาปัตยกรรม

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Next.js     │◄───►│  NestJS     │◄───►│  PostgreSQL  │
│  Frontend    │     │  Backend    │     │              │
│  (Port 3000) │     │  (Port 4000)│     │  (Port 5432) │
└─────────────┘     └──────┬──────┘     └──────────────┘
       ▲                   │
       │ WebSocket         ▼
       └───────────  ┌──────────┐
                     │  Redis   │
                     │ (Port 6379)│
                     └──────────┘
```

## เทคโนโลยี

### Backend
- **NestJS** - Framework หลัก
- **Prisma ORM** - จัดการฐานข้อมูล
- **PostgreSQL** - ฐานข้อมูลหลัก
- **Redis** - Cache + Pub/Sub
- **Socket.io** - WebSocket เรียลไทม์
- **JWT** - Authentication (Access + Refresh Token)

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** (Strict Mode)
- **Material UI v5** - UI Components
- **Zustand** - State Management
- **Recharts** - กราฟและสถิติ
- **Socket.io Client** - WebSocket

## คุณสมบัติหลัก

- **Multi-Tenant** - แยกข้อมูลตามโรงเรียน
- **จัดการนักเรียน** - CRUD + นำเข้า CSV
- **จัดการข้อสอบ** - สร้างข้อสอบ + สลับข้อ/ตัวเลือก + สร้างหลายชุด (A,B,C,D)
- **สแกน OMR** - ใช้กล้องมือถือสแกนกระดาษคำตอบ
- **ตรวจอัตโนมัติ** - คำนวณคะแนนทันทีหลังสแกน
- **แดชบอร์ดเรียลไทม์** - อัปเดตผลสอบแบบ Live
- **Role-Based Access** - Super Admin, School Admin, Teacher, Scanner Operator

## โครงสร้างโปรเจค

```
exam-omr-system/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication (JWT)
│   │   │   ├── schools/        # School Management
│   │   │   ├── students/       # Student CRUD + CSV Import
│   │   │   ├── exams/          # Exam + Version Generation
│   │   │   ├── scanner/        # OMR Scan + Auto Grading
│   │   │   └── results/        # Results + Export
│   │   ├── common/             # Guards, Decorators, Filters
│   │   ├── prisma/             # Prisma Service
│   │   ├── websocket/          # Socket.io Gateway
│   │   └── config/             # App Configuration
│   ├── prisma/
│   │   ├── schema.prisma       # Database Schema
│   │   └── seed.ts             # Seed Data
│   └── Dockerfile
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/login/     # Login Page
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/  # Realtime Dashboard
│   │   │   │   ├── students/   # Student Management
│   │   │   │   └── exams/      # Exam Management
│   │   │   └── scanner/        # OMR Scanner (PWA)
│   │   ├── services/           # API + WebSocket Services
│   │   ├── lib/                # Zustand Store
│   │   ├── theme/              # MUI Theme
│   │   └── types/              # TypeScript Types
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## การติดตั้งและเริ่มใช้งาน

### วิธีที่ 1: Docker Compose (แนะนำ)

```bash
# Clone โปรเจค
cd exam-omr-system

# เริ่มทุกบริการ
docker compose up -d

# รัน Migration + Seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# เปิดเว็บ
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
```

### วิธีที่ 2: Development Mode (Local)

#### ข้อกำหนดเบื้องต้น
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

#### 1. ตั้งค่า Backend

```bash
cd backend

# ติดตั้ง Dependencies
npm install

# คัดลอกและแก้ไข .env
cp .env.example .env
# แก้ไข DATABASE_URL, REDIS_HOST, JWT_SECRET ตามต้องการ

# สร้าง Prisma Client
npx prisma generate

# รัน Migration
npx prisma migrate dev --name init

# สร้างข้อมูลทดสอบ
npx prisma db seed

# เริ่ม Backend
npm run start:dev
```

#### 2. ตั้งค่า Frontend

```bash
cd frontend

# ติดตั้ง Dependencies
npm install

# เริ่ม Frontend
npm run dev
```

#### 3. เข้าใช้งาน

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api

## ข้อมูลทดสอบ (Seed Data)

| บทบาท | อีเมล | รหัสผ่าน |
|--------|--------|----------|
| Super Admin | superadmin@exam.com | admin123 |
| School Admin | admin@demo.school.com | admin123 |
| Teacher | teacher@demo.school.com | admin123 |
| Scanner Operator | scanner@demo.school.com | admin123 |

- **รหัสโรงเรียน**: `DEMO001`
- **นักเรียนทดสอบ**: 50 คน (รหัส 00001-00050)
- **ข้อสอบตัวอย่าง**: คณิตศาสตร์ 10 ข้อ

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | เข้าสู่ระบบ |
| POST | /api/auth/register | ลงทะเบียน |
| POST | /api/auth/refresh | Refresh Token |
| POST | /api/auth/logout | ออกจากระบบ |
| POST | /api/auth/me | ข้อมูลผู้ใช้ปัจจุบัน |

### Students
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/students | รายการนักเรียน (paginated) |
| GET | /api/students/:id | ข้อมูลนักเรียน |
| POST | /api/students | เพิ่มนักเรียน |
| PUT | /api/students/:id | แก้ไขนักเรียน |
| DELETE | /api/students/:id | ลบนักเรียน |
| POST | /api/students/import | นำเข้า CSV |
| GET | /api/students/classrooms | รายการห้องเรียน |

### Exams
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/exams | รายการข้อสอบ |
| GET | /api/exams/:id | ข้อมูลข้อสอบ |
| POST | /api/exams | สร้างข้อสอบ |
| PUT | /api/exams/:id | แก้ไขข้อสอบ |
| DELETE | /api/exams/:id | ลบข้อสอบ |
| POST | /api/exams/:id/versions | สร้างชุดข้อสอบ |
| GET | /api/exams/:id/versions | รายการชุดข้อสอบ |

### Scanner & Results
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/scanner/submit | ส่งผลสแกน + ตรวจอัตโนมัติ |
| GET | /api/scanner/stats/:examId | สถิติข้อสอบ |
| GET | /api/results/exam/:examId | ผลสอบตามข้อสอบ |
| GET | /api/results/student/:studentId | ผลสอบตามนักเรียน |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| join.school | Client → Server | เข้าร่วมห้องโรงเรียน |
| join.exam | Client → Server | เข้าร่วมห้องข้อสอบ |
| exam.scan.completed | Server → Client | สแกนเสร็จ (ผลรายคน) |
| exam.stats.updated | Server → Client | สถิติอัปเดต |

## ฐานข้อมูล

### ตาราง
- **schools** - โรงเรียน
- **users** - ผู้ใช้ (Multi-role)
- **students** - นักเรียน (แยกตาม school_id)
- **exams** - ข้อสอบ
- **questions** - คำถาม
- **choices** - ตัวเลือก
- **exam_versions** - ชุดข้อสอบ (JSONB mapping)
- **answer_sheets** - กระดาษคำตอบ
- **results** - ผลสอบ

### Design Principles
- UUID Primary Keys ทุกตาราง
- Proper Indexing สำหรับ query ที่ใช้บ่อย
- JSONB สำหรับ version mapping และ answer key
- Soft Delete (deletedAt) สำหรับข้อมูลสำคัญ
- Unique Constraints ป้องกันข้อมูลซ้ำ

## Security

- **JWT** Access + Refresh Token
- **bcrypt** Password Hashing (12 rounds)
- **Helmet** Security Headers
- **CORS** Configuration
- **Rate Limiting** (100 req/min)
- **Input Validation** (class-validator)
- **Role-Based Guards**

## Production Build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<another-secure-string>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=production
```

### Frontend
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## License

MIT
