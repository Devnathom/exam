import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const where: any = { schoolId: user.schoolId };

    const [data, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true, examVersions: true } } },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('Exams GET error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const exam = await prisma.exam.create({
      data: {
        title: body.title,
        subject: body.subject,
        description: body.description || null,
        totalQuestions: body.totalQuestions || 10,
        choicesPerQuestion: body.choicesPerQuestion || 4,
        schoolId: user.schoolId!,
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    console.error('Exams POST error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
