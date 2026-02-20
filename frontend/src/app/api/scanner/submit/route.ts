import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { examId, examVersionId, studentCode, answers } = body;

    const answerSheet = await prisma.answerSheet.create({
      data: {
        schoolId: user.schoolId!,
        examId,
        examVersionId: examVersionId || null,
        studentCode,
        answers,
        isProcessed: true,
        scannedAt: new Date(),
      },
    });

    // Auto-grade if exam version has answer key
    if (examVersionId) {
      const version = await prisma.examVersion.findUnique({ where: { id: examVersionId } });
      if (version?.answerKey) {
        const answerKey = version.answerKey as Record<string, string>;
        const studentAnswers = answers as Record<string, string>;
        let score = 0;
        const totalQuestions = Object.keys(answerKey).length;
        const details: any[] = [];

        for (const [qNum, correctAnswer] of Object.entries(answerKey)) {
          const studentAnswer = studentAnswers[qNum] || '';
          const isCorrect = studentAnswer === correctAnswer;
          if (isCorrect) score++;
          details.push({ questionNumber: parseInt(qNum), studentAnswer, correctAnswer, isCorrect });
        }

        const student = await prisma.student.findFirst({
          where: { studentCode, schoolId: user.schoolId! },
        });

        if (student) {
          await prisma.answerSheet.update({
            where: { id: answerSheet.id },
            data: { studentId: student.id },
          });

          await prisma.result.create({
            data: {
              schoolId: user.schoolId!,
              examId,
              examVersionId,
              studentId: student.id,
              answerSheetId: answerSheet.id,
              score,
              totalQuestions,
              percentage: (score / totalQuestions) * 100,
              details,
            },
          });
        }

        return NextResponse.json({
          answerSheet,
          score,
          totalQuestions,
          percentage: (score / totalQuestions) * 100,
        }, { status: 201 });
      }
    }

    return NextResponse.json({ answerSheet }, { status: 201 });
  } catch (error: any) {
    console.error('Scanner submit error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
