import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('เริ่มสร้างข้อมูลตัวอย่าง...');

  const school = await prisma.school.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      name: 'โรงเรียนสาธิตแห่งชาติ',
      code: 'DEMO001',
      address: '123 ถนนพหลโยธิน กรุงเทพฯ 10400',
      phone: '02-123-4567',
    },
  });

  console.log(`สร้างโรงเรียน: ${school.name}`);

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@exam.com' },
    update: {},
    create: {
      email: 'superadmin@exam.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.school.com' },
    update: {},
    create: {
      email: 'admin@demo.school.com',
      password: hashedPassword,
      firstName: 'ผู้ดูแล',
      lastName: 'โรงเรียน',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.school.com' },
    update: {},
    create: {
      email: 'teacher@demo.school.com',
      password: hashedPassword,
      firstName: 'ครูสมชาย',
      lastName: 'ใจดี',
      role: 'TEACHER',
      schoolId: school.id,
    },
  });

  const scanner = await prisma.user.upsert({
    where: { email: 'scanner@demo.school.com' },
    update: {},
    create: {
      email: 'scanner@demo.school.com',
      password: hashedPassword,
      firstName: 'เจ้าหน้าที่',
      lastName: 'สแกน',
      role: 'SCANNER_OPERATOR',
      schoolId: school.id,
    },
  });

  console.log(`สร้างผู้ใช้: ${superAdmin.email}, ${schoolAdmin.email}, ${teacher.email}, ${scanner.email}`);

  const students = [];
  const classrooms = ['ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1'];
  for (let i = 1; i <= 50; i++) {
    const studentCode = String(i).padStart(5, '0');
    const classroom = classrooms[Math.floor((i - 1) / 10)];
    const student = await prisma.student.upsert({
      where: {
        schoolId_studentCode: {
          schoolId: school.id,
          studentCode,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        studentCode,
        firstName: `นักเรียน${i}`,
        lastName: `ทดสอบ${i}`,
        classroom,
      },
    });
    students.push(student);
  }

  console.log(`สร้างนักเรียน ${students.length} คน`);

  const exam = await prisma.exam.create({
    data: {
      schoolId: school.id,
      title: 'แบบทดสอบวิชาคณิตศาสตร์ กลางภาค',
      description: 'ข้อสอบกลางภาคเรียนที่ 1 ปีการศึกษา 2569',
      subject: 'คณิตศาสตร์',
      totalQuestions: 10,
      choicesPerQuestion: 4,
      status: 'DRAFT',
    },
  });

  const choiceLabels = ['A', 'B', 'C', 'D'];
  for (let q = 1; q <= 10; q++) {
    const correctIdx = Math.floor(Math.random() * 4);
    await prisma.question.create({
      data: {
        examId: exam.id,
        questionNumber: q,
        content: `โจทย์คณิตศาสตร์ข้อที่ ${q}`,
        choices: {
          create: choiceLabels.map((label, idx) => ({
            label,
            content: `ตัวเลือก ${label} ของข้อ ${q}`,
            isCorrect: idx === correctIdx,
          })),
        },
      },
    });
  }

  console.log(`สร้างข้อสอบ: ${exam.title} (${exam.totalQuestions} ข้อ)`);
  console.log('\nข้อมูลสำหรับทดสอบ:');
  console.log('='.repeat(50));
  console.log('Super Admin: superadmin@exam.com / admin123');
  console.log('School Admin: admin@demo.school.com / admin123');
  console.log('Teacher: teacher@demo.school.com / admin123');
  console.log('Scanner: scanner@demo.school.com / admin123');
  console.log('School Code: DEMO001');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
