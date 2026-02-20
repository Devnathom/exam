import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const schoolId = user.schoolId || undefined;

    const [totalStudents, totalExams, totalResults, recentResults] = await Promise.all([
      prisma.student.count({ where: { schoolId, deletedAt: null } }),
      prisma.exam.count({ where: { schoolId } }),
      prisma.result.count({ where: { schoolId } }),
      prisma.result.findMany({
        where: { schoolId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { studentCode: true, firstName: true, lastName: true } },
          exam: { select: { title: true, subject: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalStudents,
      totalExams,
      totalResults,
      recentResults,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
