import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('เริ่มติดตั้งข้อมูลตัวอย่าง...');

    // สร้างโรงเรียน
    const school = await prisma.school.upsert({
      where: { code: 'DEMO001' },
      update: {},
      create: {
        name: 'โรงเรียนสาธิตตัวอย่าง',
        code: 'DEMO001',
        address: '123 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร',
        phone: '02-1234567',
      },
    });

    console.log('สร้างโรงเรียน:', school.name);

    // สร้างผู้ใช้
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@school.com' },
      update: {},
      create: {
        email: 'admin@school.com',
        password: hashedPassword,
        firstName: 'ผู้ดูแล',
        lastName: 'ระบบ',
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        isActive: true,
      },
    });

    console.log('สร้างผู้ใช้:', admin.email);

    // สร้างนักเรียนตัวอย่าง
    const students = [
      { studentCode: '6001', firstName: 'สมชาย', lastName: 'ใจดี', classroom: 'ม.6/1' },
      { studentCode: '6002', firstName: 'สมหญิง', lastName: 'รักเรียน', classroom: 'ม.6/1' },
      { studentCode: '6003', firstName: 'วิรัญ', lastName: 'มีนัก', classroom: 'ม.6/2' },
      { studentCode: '6004', firstName: 'มานี', lastName: 'จิตใจดี', classroom: 'ม.6/2' },
      { studentCode: '6005', firstName: 'ประเสริฐ', lastName: 'เก่นวิชา', classroom: 'ม.6/3' },
    ];

    for (const student of students) {
      await prisma.student.upsert({
        where: { schoolId_studentCode: { schoolId: school.id, studentCode: student.studentCode } },
        update: {},
        create: {
          ...student,
          schoolId: school.id,
          isActive: true,
        },
      });
    }

    console.log('สร้างนักเรียน', students.length, 'คน');

    // สร้างข้อสอบตัวอย่าง
    const exam = await prisma.exam.create({
      data: {
        title: 'ข้อสอบวิชาคณิตศาสตร์ ม.6',
        subject: 'คณิตศาสตร์',
        description: 'ข้อสอบปลายภาค 1/2567',
        totalQuestions: 10,
        choicesPerQuestion: 4,
        status: 'PUBLISHED',
        schoolId: school.id,
      },
    });

    console.log('สร้างข้อสอบ:', exam.title);

    // สร้างคำถามและตัวเลือก
    for (let i = 1; i <= exam.totalQuestions; i++) {
      const question = await prisma.question.create({
        data: {
          examId: exam.id,
          questionNumber: i,
          content: `ข้อที่ ${i}: คำถามตัวอย่างสำหรับข้อสอบวิชาคณิตศาสตร์`,
        },
      });

      // สร้างตัวเลือก
      const choices = ['ก', 'ข', 'ค', 'ง'];
      for (let j = 0; j < choices.length; j++) {
        await prisma.choice.create({
          data: {
            questionId: question.id,
            label: choices[j],
            content: `ตัวเลือก ${choices[j]} สำหรับข้อที่ ${i}`,
            isCorrect: j === 0, // ตัวเลือกแรก (ก) เป็นคำตอบที่ถูกต้อง
          },
        });
      }
    }

    console.log('สร้างคำถามและตัวเลือกเรียบร้อย');

    return NextResponse.json({
      success: true,
      message: '✅ ติดตั้งข้อมูลตัวอย่างสำเร็จ!',
      data: {
        email: 'admin@school.com',
        password: 'admin123',
        studentsCount: students.length,
        examTitle: exam.title,
      },
    });
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการติดตั้งข้อมูล:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
